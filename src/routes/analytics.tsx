import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calculator,
  TrendingUp,
  Scale,
  Save,
  RefreshCw,
  AlertCircle,
  Percent,
  PiggyBank,
  Layers,
  CalendarDays,
  CheckCircle2,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { z } from "zod";

import { listLoans, getLoan, updateLoan } from "@/lib/loans/loans.functions";
import { generateSchedule } from "@/lib/loans/amortization";
import { currency, percent, currencyDetail } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { LoanRow, LoanExtraPayment } from "@/lib/loans/schema";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";

// Validate search query parameter for loanId
const searchSchema = z.object({
  loanId: z.string().uuid().optional(),
});

const loansQuery = queryOptions({
  queryKey: ["loans"],
  queryFn: () => listLoans(),
});

const loanDetailQuery = (id: string | undefined) =>
  queryOptions({
    queryKey: ["loan", id],
    queryFn: () =>
      id
        ? getLoan({ data: { id } })
        : Promise.resolve({ loan: null, extraPayments: [] }),
    enabled: !!id,
  });

export const Route = createFileRoute("/analytics")({
  validateSearch: (search) => searchSchema.parse(search),
  head: () => ({
    meta: [
      { title: "Loan Parameter Simulator & Analytics · Amortix" },
      {
        name: "description",
        content: "Simulate parameter adjustments to interest, principal, and payoff timelines.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(loansQuery),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const search = useSearch({ from: "/analytics" });
  const navigate = useNavigate();
  const qc = useQueryClient();
  const updateFn = useServerFn(updateLoan);

  const { data: loansData } = useSuspenseQuery(loansQuery);
  const loans = (loansData.loans ?? []) as LoanRow[];

  // Auto-select first loan if none specified
  useEffect(() => {
    if (!search.loanId && loans.length > 0) {
      navigate({ to: "/analytics", search: { loanId: loans[0].id }, replace: true });
    }
  }, [search.loanId, loans, navigate]);

  const selectedLoanId = search.loanId;

  // Retrieve selected loan details dynamically
  const { data: detailData, isLoading: isDetailLoading } = useQuery(
    loanDetailQuery(selectedLoanId)
  );

  const selectedLoan = detailData?.loan as LoanRow | null;
  const extraPayments = (detailData?.extraPayments ?? []) as LoanExtraPayment[];

  // Local state for simulator input fields
  const [simulatedParams, setSimulatedParams] = useState({
    borrowed_amount: 0,
    interest_rate: 0,
    tenure_months: 0,
    extra_payment: 0,
    balloon_date: "",
  });

  const [formErrors, setFormErrors] = useState({
    borrowed_amount: "",
    interest_rate: "",
    tenure_months: "",
    extra_payment: "",
  });

  // Sync simulator parameters when selected loan loads
  useEffect(() => {
    if (selectedLoan) {
      setSimulatedParams({
        borrowed_amount: Number(selectedLoan.borrowed_amount),
        interest_rate: Number(selectedLoan.interest_rate),
        tenure_months: Number(selectedLoan.tenure_months),
        extra_payment: Number(selectedLoan.extra_payment ?? 0),
        balloon_date: selectedLoan.balloon_date ?? "",
      });
      setFormErrors({
        borrowed_amount: "",
        interest_rate: "",
        tenure_months: "",
        extra_payment: "",
      });
    }
  }, [selectedLoan]);

  const handleInputChange = (field: keyof typeof simulatedParams, val: string) => {
    setSimulatedParams((prev) => ({ ...prev, [field]: val }));

    // Real-time validations
    let err = "";
    if (field === "borrowed_amount") {
      const num = Number(val);
      if (Number.isNaN(num) || num <= 0) err = "Must be a positive number";
      if (num > 1_000_000_000) err = "Max limit is $1,000,000,000";
    } else if (field === "interest_rate") {
      const num = Number(val);
      if (Number.isNaN(num) || num < 0) err = "Cannot be negative";
      if (num > 100) err = "Max rate is 100%";
    } else if (field === "tenure_months") {
      const num = Number(val);
      if (Number.isNaN(num) || !Number.isInteger(num) || num < 1) err = "Must be at least 1 month";
      if (num > 600) err = "Max tenure is 600 months";
    } else if (field === "extra_payment") {
      const num = Number(val);
      if (Number.isNaN(num) || num < 0) err = "Cannot be negative";
    }

    setFormErrors((prev) => ({ ...prev, [field]: err }));
  };

  const isFormValid = useMemo(() => {
    return (
      selectedLoan &&
      !formErrors.borrowed_amount &&
      !formErrors.interest_rate &&
      !formErrors.tenure_months &&
      !formErrors.extra_payment &&
      simulatedParams.borrowed_amount > 0 &&
      simulatedParams.interest_rate >= 0 &&
      simulatedParams.tenure_months >= 1
    );
  }, [selectedLoan, formErrors, simulatedParams]);

  // Compute schedules
  const currentSchedule = useMemo(() => {
    if (!selectedLoan) return null;
    const customExtraPaymentsRecord: Record<number, number> = {};
    for (const ep of extraPayments) {
      customExtraPaymentsRecord[ep.payment_no] = Number(ep.amount);
    }
    return generateSchedule({
      borrowedAmount: Number(selectedLoan.borrowed_amount),
      interestRate: Number(selectedLoan.interest_rate),
      tenureMonths: Number(selectedLoan.tenure_months),
      startDate: selectedLoan.start_date,
      extraPayment: Number(selectedLoan.extra_payment ?? 0),
      balloonDate: selectedLoan.balloon_date,
      balloonAmount: selectedLoan.balloon_amount ? Number(selectedLoan.balloon_amount) : null,
      customExtraPayments: customExtraPaymentsRecord,
    });
  }, [selectedLoan, extraPayments]);

  const simulatedSchedule = useMemo(() => {
    if (!selectedLoan || !isFormValid) return null;
    const customExtraPaymentsRecord: Record<number, number> = {};
    for (const ep of extraPayments) {
      customExtraPaymentsRecord[ep.payment_no] = Number(ep.amount);
    }
    return generateSchedule({
      borrowedAmount: Number(simulatedParams.borrowed_amount),
      interestRate: Number(simulatedParams.interest_rate),
      tenureMonths: Number(simulatedParams.tenure_months),
      startDate: selectedLoan.start_date,
      extraPayment: Number(simulatedParams.extra_payment),
      balloonDate: simulatedParams.balloon_date || null,
      customExtraPayments: customExtraPaymentsRecord,
    });
  }, [selectedLoan, simulatedParams, extraPayments, isFormValid]);

  // Merge outstanding balance trends for recharts overlay
  const chartData = useMemo(() => {
    if (!currentSchedule || !simulatedSchedule) return [];
    const dateMap = new Map<string, { date: string; currentBalance: number; simulatedBalance: number }>();

    for (const row of currentSchedule.schedule) {
      dateMap.set(row.date, {
        date: row.date,
        currentBalance: row.balance,
        simulatedBalance: 0,
      });
    }

    for (const row of simulatedSchedule.schedule) {
      const entry = dateMap.get(row.date);
      if (entry) {
        entry.simulatedBalance = row.balance;
      } else {
        dateMap.set(row.date, {
          date: row.date,
          currentBalance: 0,
          simulatedBalance: row.balance,
        });
      }
    }

    const sorted = Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    // Sample down to 80 intervals max for clean performance
    return sorted.length > 80
      ? sorted.filter((_, i) => i % Math.ceil(sorted.length / 80) === 0)
      : sorted;
  }, [currentSchedule, simulatedSchedule]);

  const handleReset = () => {
    if (selectedLoan) {
      setSimulatedParams({
        borrowed_amount: Number(selectedLoan.borrowed_amount),
        interest_rate: Number(selectedLoan.interest_rate),
        tenure_months: Number(selectedLoan.tenure_months),
        extra_payment: Number(selectedLoan.extra_payment ?? 0),
        balloon_date: selectedLoan.balloon_date ?? "",
      });
      setFormErrors({
        borrowed_amount: "",
        interest_rate: "",
        tenure_months: "",
        extra_payment: "",
      });
      toast.info("Simulator reset to actual database values");
    }
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleCommit = async () => {
    if (!selectedLoan || !isFormValid) return;
    const confirmSave = confirm(
      `Are you sure you want to commit these simulated parameters to the database? This updates "${selectedLoan.bank_name}" permanently.`
    );
    if (!confirmSave) return;

    try {
      setIsSaving(true);
      await updateFn({
        data: {
          id: selectedLoan.id,
          patch: {
            borrowed_amount: Number(simulatedParams.borrowed_amount),
            interest_rate: Number(simulatedParams.interest_rate),
            tenure_months: Number(simulatedParams.tenure_months),
            extra_payment: Number(simulatedParams.extra_payment),
            balloon_date: simulatedParams.balloon_date || null,
          },
        },
      });
      await qc.invalidateQueries({ queryKey: ["loans"] });
      await qc.invalidateQueries({ queryKey: ["loan", selectedLoan.id] });
      toast.success("Loan parameters updated in DB successfully!");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  // Helper renderers for KPIs diff comparison
  const emiDiff = simulatedSchedule && currentSchedule ? simulatedSchedule.emi - currentSchedule.emi : 0;
  const interestDiff = simulatedSchedule && currentSchedule ? simulatedSchedule.totalInterest - currentSchedule.totalInterest : 0;
  const paymentDiff = simulatedSchedule && currentSchedule ? simulatedSchedule.totalPayment - currentSchedule.totalPayment : 0;
  const monthsDiff = simulatedSchedule && currentSchedule ? simulatedSchedule.payoffMonths - currentSchedule.payoffMonths : 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Simulator Engine
        </div>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Loan Parameter Simulator</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Simulate parameter adjustments to see direct financial comparisons and commit simulated terms to DB.
        </p>
      </div>

      {/* Loan Registry Selector */}
      <div className="glass-card rounded-2xl p-5">
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Select loan registry entry
        </label>
        {loans.length === 0 ? (
          <div className="flex h-12 items-center text-sm text-muted-foreground">
            No loans found. Add a loan registry entry first.
          </div>
        ) : (
          <select
            value={selectedLoanId || ""}
            onChange={(e) => {
              const val = e.target.value;
              navigate({ to: "/analytics", search: { loanId: val || undefined } });
            }}
            className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
          >
            {loans.map((l) => (
              <option key={l.id} value={l.id}>
                {l.bank_name} — #{l.loan_number} ({currency(l.borrowed_amount)})
              </option>
            ))}
          </select>
        )}
      </div>

      {isDetailLoading && (
        <div className="flex h-64 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Loading loan details...</span>
          </div>
        </div>
      )}

      {!isDetailLoading && selectedLoan && currentSchedule && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Simulator Form (Left Column) */}
          <div className="glass-card flex flex-col justify-between rounded-2xl p-6 lg:col-span-2 space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary text-white">
                  <Calculator className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold">Adjust Parameters</h2>
                  <p className="text-xs text-muted-foreground">Change variables to see immediate impact</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Borrowed Amount */}
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-foreground">Borrowed Amount ($)</span>
                  <input
                    type="number"
                    step="1000"
                    value={simulatedParams.borrowed_amount || ""}
                    onChange={(e) => handleInputChange("borrowed_amount", e.target.value)}
                    className={cn(
                      "h-10 w-full rounded-xl border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30",
                      formErrors.borrowed_amount ? "border-destructive focus:border-destructive" : "border-input focus:border-ring"
                    )}
                  />
                  {formErrors.borrowed_amount && (
                    <span className="mt-1 block text-[11px] text-destructive">{formErrors.borrowed_amount}</span>
                  )}
                </label>

                {/* Interest Rate */}
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-foreground">Annual Interest Rate (%)</span>
                  <input
                    type="number"
                    step="0.05"
                    value={simulatedParams.interest_rate || ""}
                    onChange={(e) => handleInputChange("interest_rate", e.target.value)}
                    className={cn(
                      "h-10 w-full rounded-xl border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30",
                      formErrors.interest_rate ? "border-destructive focus:border-destructive" : "border-input focus:border-ring"
                    )}
                  />
                  {formErrors.interest_rate && (
                    <span className="mt-1 block text-[11px] text-destructive">{formErrors.interest_rate}</span>
                  )}
                </label>

                {/* Tenure Months */}
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-foreground">Tenure (Months)</span>
                  <input
                    type="number"
                    step="1"
                    value={simulatedParams.tenure_months || ""}
                    onChange={(e) => handleInputChange("tenure_months", e.target.value)}
                    className={cn(
                      "h-10 w-full rounded-xl border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30",
                      formErrors.tenure_months ? "border-destructive focus:border-destructive" : "border-input focus:border-ring"
                    )}
                  />
                  {formErrors.tenure_months && (
                    <span className="mt-1 block text-[11px] text-destructive">{formErrors.tenure_months}</span>
                  )}
                </label>

                {/* Extra Monthly Payment */}
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-foreground">Extra Monthly Payment ($)</span>
                  <input
                    type="number"
                    step="50"
                    value={simulatedParams.extra_payment || ""}
                    onChange={(e) => handleInputChange("extra_payment", e.target.value)}
                    className={cn(
                      "h-10 w-full rounded-xl border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30",
                      formErrors.extra_payment ? "border-destructive focus:border-destructive" : "border-input focus:border-ring"
                    )}
                  />
                  {formErrors.extra_payment && (
                    <span className="mt-1 block text-[11px] text-destructive">{formErrors.extra_payment}</span>
                  )}
                </label>

                {/* Balloon Date */}
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-foreground">Balloon Payoff Date (Optional)</span>
                  <input
                    type="date"
                    value={simulatedParams.balloon_date}
                    onChange={(e) => handleInputChange("balloon_date", e.target.value)}
                    className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-border flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-accent cursor-pointer"
              >
                <RefreshCw className="h-4 w-4" /> Reset
              </button>
              <button
                type="button"
                disabled={!isFormValid || isSaving}
                onClick={handleCommit}
                className={cn(
                  "inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-card transition-transform cursor-pointer",
                  isFormValid && !isSaving
                    ? "bg-gradient-primary hover:-translate-y-0.5 hover:shadow-glow"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                <Save className="h-4 w-4" />
                {isSaving ? "Saving..." : "Commit to DB"}
              </button>
            </div>
          </div>

          {/* Results Comparison & Charts (Right 3 Columns) */}
          <div className="lg:col-span-3 space-y-6">
            {!isFormValid ? (
              <div className="glass-card flex flex-col items-center justify-center h-[350px] rounded-2xl text-center p-8">
                <AlertCircle className="h-10 w-10 text-warning mb-3" />
                <h3 className="font-semibold text-base">Invalid Inputs Detected</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                  Please fix the error messages in the form fields to view the amortization schedule comparison.
                </p>
              </div>
            ) : (
              simulatedSchedule && (
                <>
                  {/* KPI Comparison Grid */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {/* EMI KPI */}
                    <ComparisonCard
                      label="Monthly EMI"
                      currentVal={currency(currentSchedule.emi)}
                      simulatedVal={currency(simulatedSchedule.emi)}
                      diff={emiDiff}
                      diffText={
                        emiDiff === 0
                          ? "No change"
                          : `${emiDiff > 0 ? "+" : ""}${currency(emiDiff)} (${percent((emiDiff / currentSchedule.emi) * 100)})`
                      }
                      isBetter={emiDiff <= 0}
                      icon={Layers}
                    />

                    {/* Payoff Date KPI */}
                    <ComparisonCard
                      label="Payoff Timeline"
                      currentVal={`${format(parseISO(currentSchedule.payoffDate), "MMM yyyy")} (${currentSchedule.payoffMonths} mo)`}
                      simulatedVal={`${format(parseISO(simulatedSchedule.payoffDate), "MMM yyyy")} (${simulatedSchedule.payoffMonths} mo)`}
                      diff={monthsDiff}
                      diffText={
                        monthsDiff === 0
                          ? "No change"
                          : `${monthsDiff > 0 ? "+" : ""}${monthsDiff} month${Math.abs(monthsDiff) === 1 ? "" : "s"}`
                      }
                      isBetter={monthsDiff <= 0}
                      icon={CalendarDays}
                    />

                    {/* Lifetime Interest KPI */}
                    <ComparisonCard
                      label="Lifetime Interest Cost"
                      currentVal={currency(currentSchedule.totalInterest)}
                      simulatedVal={currency(simulatedSchedule.totalInterest)}
                      diff={interestDiff}
                      diffText={
                        interestDiff === 0
                          ? "No change"
                          : `${interestDiff > 0 ? "+" : ""}${currency(interestDiff)} (${percent((interestDiff / (currentSchedule.totalInterest || 1)) * 100)})`
                      }
                      isBetter={interestDiff <= 0}
                      icon={Percent}
                    />

                    {/* Total Cost KPI */}
                    <ComparisonCard
                      label="Total Payments Sum"
                      currentVal={currency(currentSchedule.totalPayment)}
                      simulatedVal={currency(simulatedSchedule.totalPayment)}
                      diff={paymentDiff}
                      diffText={
                        paymentDiff === 0
                          ? "No change"
                          : `${paymentDiff > 0 ? "+" : ""}${currency(paymentDiff)}`
                      }
                      isBetter={paymentDiff <= 0}
                      icon={PiggyBank}
                    />
                  </div>

                  {/* Dual Chart Visualization */}
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card rounded-2xl p-5"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-base font-semibold">Amortization Trajectory Comparison</h3>
                        <p className="text-xs text-muted-foreground">Outstanding balance over the loan timeline</p>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-semibold">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-block h-0.5 w-6 border-t border-dashed border-muted-foreground" />
                          <span className="text-muted-foreground">Current DB State</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="inline-block h-1.5 w-4 rounded-full bg-primary" />
                          <span className="text-primary">Simulated Mode</span>
                        </div>
                      </div>
                    </div>

                    <div className="h-[300px] mt-2">
                      <ResponsiveContainer width="100%" height="100%" debounce={100}>
                        <AreaChart data={chartData} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                          <defs>
                            <linearGradient id="currentChartFill" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="var(--color-muted-foreground)" stopOpacity={0.15} />
                              <stop offset="100%" stopColor="var(--color-muted-foreground)" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="simulatedChartFill" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.4} />
                              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                          <XAxis
                            dataKey="date"
                            tickFormatter={(d) => {
                              try {
                                return format(parseISO(d), "MMM yy");
                              } catch {
                                return d;
                              }
                            }}
                            stroke="var(--color-muted-foreground)"
                            tick={{ fontSize: 11 }}
                            minTickGap={30}
                          />
                          <YAxis
                            stroke="var(--color-muted-foreground)"
                            tickFormatter={(v) => {
                              if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
                              if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}k`;
                              return `$${v}`;
                            }}
                            tick={{ fontSize: 11 }}
                            width={54}
                          />
                          <Tooltip
                            contentStyle={{
                              background: "var(--color-card)",
                              border: "1px solid var(--color-border)",
                              borderRadius: 12,
                            }}
                            labelFormatter={(d) => {
                              try {
                                return format(parseISO(d as string), "MMMM d, yyyy");
                              } catch {
                                return d;
                              }
                            }}
                            formatter={(v: number) => currencyDetail(v)}
                          />
                          <Area
                            type="monotone"
                            dataKey="currentBalance"
                            stroke="var(--color-muted-foreground)"
                            strokeWidth={2}
                            strokeDasharray="4 4"
                            fill="url(#currentChartFill)"
                            name="Current State"
                          />
                          <Area
                            type="monotone"
                            dataKey="simulatedBalance"
                            stroke="var(--color-primary)"
                            strokeWidth={2.5}
                            fill="url(#simulatedChartFill)"
                            name="Simulated State"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </motion.div>
                </>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface ComparisonCardProps {
  label: string;
  currentVal: string;
  simulatedVal: string;
  diff: number;
  diffText: string;
  isBetter: boolean;
  icon: React.ComponentType<{ className?: string }>;
}

function ComparisonCard({
  label,
  currentVal,
  simulatedVal,
  diff,
  diffText,
  isBetter,
  icon: Icon,
}: ComparisonCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-5 flex flex-col justify-between"
    >
      <div className="flex items-start justify-between">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
          <div className="text-xl font-bold text-gradient mt-1">{simulatedVal}</div>
        </div>
        <div className="rounded-lg bg-accent/40 p-2 text-muted-foreground">
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-border/50 flex flex-wrap items-center justify-between text-xs gap-2">
        <div>
          <span className="text-muted-foreground">Current: </span>
          <span className="font-semibold text-foreground/80">{currentVal}</span>
        </div>

        {diff !== 0 && (
          <span
            className={cn(
              "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-medium text-[11px]",
              isBetter
                ? "bg-success/10 text-success border border-success/20"
                : "bg-destructive/10 text-destructive border border-destructive/20"
            )}
          >
            {diffText}
          </span>
        )}

        {diff === 0 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full font-medium text-[11px] bg-muted text-muted-foreground">
            No change
          </span>
        )}
      </div>
    </motion.div>
  );
}
