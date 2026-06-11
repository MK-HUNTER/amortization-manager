import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Banknote,
  Layers,
  PiggyBank,
  Percent,
  Wallet,
  PlusCircle,
} from "lucide-react";
import { format, parseISO, addMonths, startOfMonth } from "date-fns";

import { listLoans } from "@/lib/loans/loans.functions";
import { calculateEmi, generateSchedule } from "@/lib/loans/amortization";
import { compactCurrency, currency, percent } from "@/lib/format";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { BalanceTrendChart } from "@/components/charts/balance-trend";
import { PrincipalInterestPie } from "@/components/charts/principal-interest-pie";
import { MonthlyOutflowChart, OutflowData } from "@/components/charts/monthly-outflow";
import { LenderExposureChart, LenderData } from "@/components/charts/lender-exposure";
import { StatusBadge } from "@/components/ui/status-badge";
import type { LoanRow } from "@/lib/loans/schema";

const loansQuery = queryOptions({
  queryKey: ["loans"],
  queryFn: () => listLoans(),
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · Amortix" },
      { name: "description", content: "Portfolio KPIs, trends, and recent loan activity." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(loansQuery),
  component: Dashboard,
  errorComponent: ({ error }) => (
    <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
      <h2 className="text-lg font-semibold text-destructive">Couldn't load dashboard</h2>
      <p className="mt-1 text-sm text-muted-foreground">{error.message}</p>
    </div>
  ),
});

function computeLoanMetrics(loan: LoanRow, todayStr: string, currentYearStr: string) {
  const isExpired = loan.loan_status === "paid" || loan.loan_status === "closed";
  if (isExpired) {
    return { outstanding: 0, remainingMonths: 0, interestPaidYTD: 0, currentRate: Number(loan.interest_rate) };
  }

  const schedule = generateSchedule({
    borrowedAmount: Number(loan.borrowed_amount),
    interestRate: Number(loan.interest_rate),
    tenureMonths: Number(loan.tenure_months),
    startDate: loan.start_date,
    extraPayment: Number(loan.extra_payment ?? 0),
    balloonDate: loan.balloon_date,
    balloonAmount: loan.balloon_amount ? Number(loan.balloon_amount) : null,
  }).schedule;

  let outstanding = Number(loan.borrowed_amount);
  let remainingMonths = Number(loan.tenure_months);
  let interestPaidYTD = 0;

  const pastPayments = schedule.filter((row) => row.date <= todayStr);
  if (pastPayments.length > 0) {
    const lastPayment = pastPayments[pastPayments.length - 1];
    outstanding = lastPayment.balance;
    remainingMonths = Math.max(0, schedule.length - pastPayments.length);
  }

  const ytdPayments = schedule.filter((row) => {
    return row.date <= todayStr && row.date.startsWith(currentYearStr);
  });
  interestPaidYTD = ytdPayments.reduce((s, row) => s + row.interest, 0);

  return { outstanding, remainingMonths, interestPaidYTD, currentRate: Number(loan.interest_rate) };
}

function buildAggregates(loans: LoanRow[]) {
  const totals = { principal: 0, interest: 0, emi: 0, balance: 0 };
  const balanceSeries = new Map<string, number>();

  for (const loan of loans) {
    if (loan.loan_status !== "active") continue;
    const summary = generateSchedule({
      borrowedAmount: Number(loan.borrowed_amount),
      interestRate: Number(loan.interest_rate),
      tenureMonths: Number(loan.tenure_months),
      startDate: loan.start_date,
      extraPayment: Number(loan.extra_payment ?? 0),
      balloonDate: loan.balloon_date,
      balloonAmount: loan.balloon_amount ? Number(loan.balloon_amount) : null,
    });
    totals.emi += summary.emi;
    totals.principal += Number(loan.borrowed_amount);
    totals.interest += summary.totalInterest;
    totals.balance += summary.schedule[0]?.balance ?? Number(loan.borrowed_amount);

    for (const row of summary.schedule) {
      balanceSeries.set(row.date, (balanceSeries.get(row.date) ?? 0) + row.balance);
    }
  }

  const trend = Array.from(balanceSeries.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, balance], i) => ({
      paymentNo: i + 1,
      date,
      balance,
      emi: 0,
      principal: 0,
      interest: 0,
      extra: 0,
    }));

  return { totals, trend };
}

function Dashboard() {
  const { data } = useSuspenseQuery(loansQuery);
  const loans = data.loans as LoanRow[];

  const active = loans.filter((l) => l.loan_status === "active");
  const portfolio = loans.reduce((s, l) => s + Number(l.borrowed_amount), 0);
  const avgRate =
    loans.length === 0 ? 0 : loans.reduce((s, l) => s + Number(l.interest_rate), 0) / loans.length;

  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");
  const currentYearStr = String(today.getFullYear());

  let totalOutstanding = 0;
  let totalInterestPaidYTD = 0;
  let weightedRateSum = 0;
  let weightedMaturitySum = 0;

  active.forEach((l) => {
    const m = computeLoanMetrics(l, todayStr, currentYearStr);
    totalOutstanding += m.outstanding;
    totalInterestPaidYTD += m.interestPaidYTD;
    weightedRateSum += m.currentRate * m.outstanding;
    weightedMaturitySum += (m.remainingMonths / 12) * m.outstanding;
  });

  const totalActiveOutstanding = totalOutstanding;
  const weightedAvgRate = totalActiveOutstanding > 0 ? (weightedRateSum / totalActiveOutstanding) : avgRate;
  const weightedAvgMaturity = totalActiveOutstanding > 0 ? (weightedMaturitySum / totalActiveOutstanding) : 0;

  const { trend, totals } = buildAggregates(loans);

  // Generate Monthly cash outflow projection (next 12 months)
  const currentMonthDate = startOfMonth(today);
  const next12Months = Array.from({ length: 12 }).map((_, i) =>
    addMonths(currentMonthDate, i)
  );

  const outflowData: OutflowData[] = next12Months.map((mDate) => {
    const monthKey = format(mDate, "yyyy-MM");
    const monthLabel = format(mDate, "MMM yy");

    let monthPrincipal = 0;
    let monthInterest = 0;

    for (const loan of active) {
      const summary = generateSchedule({
        borrowedAmount: Number(loan.borrowed_amount),
        interestRate: Number(loan.interest_rate),
        tenureMonths: Number(loan.tenure_months),
        startDate: loan.start_date,
        extraPayment: Number(loan.extra_payment ?? 0),
        balloonDate: loan.balloon_date,
        balloonAmount: loan.balloon_amount ? Number(loan.balloon_amount) : null,
      });

      for (const row of summary.schedule) {
        if (row.date.startsWith(monthKey)) {
          monthPrincipal += row.principal;
          monthInterest += row.interest;
        }
      }
    }

    return {
      month: monthLabel,
      Principal: Math.round(monthPrincipal),
      Interest: Math.round(monthInterest),
    };
  });

  // Calculate Lender Concentration
  const lenderMap = new Map<string, number>();
  for (const loan of active) {
    const m = computeLoanMetrics(loan, todayStr, currentYearStr);
    const bankName = loan.bank_name || "Unknown Lender";
    lenderMap.set(bankName, (lenderMap.get(bankName) ?? 0) + m.outstanding);
  }

  const lenderData: LenderData[] = Array.from(lenderMap.entries())
    .map(([name, value]) => ({ name, value: Math.round(value) }))
    .sort((a, b) => b.value - a.value);

  const kpis = [
    {
      label: "Active Balance",
      value: compactCurrency(totalOutstanding),
      hint: `Across ${active.length} active loans`,
      icon: Wallet,
      variant: "primary" as const,
    },
    {
      label: "Portfolio Value",
      value: compactCurrency(portfolio),
      hint: "Total borrowed historical",
      icon: PiggyBank,
      variant: "cool" as const,
    },
    {
      label: "Interest YTD",
      value: compactCurrency(totalInterestPaidYTD),
      hint: "Paid this calendar year",
      icon: Banknote,
      variant: "warm" as const,
    },
    {
      label: "Weighted Avg. Rate",
      value: percent(weightedAvgRate),
      hint: "Weighted by outstanding balance",
      icon: Percent,
      variant: "neutral" as const,
    },
    {
      label: "Avg. Maturity (WAM)",
      value: `${weightedAvgMaturity.toFixed(1)} yr${weightedAvgMaturity === 1 ? "" : "s"}`,
      hint: "Remaining weighted tenure",
      icon: Layers,
      variant: "success" as const,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Treasury overview
          </div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
            Welcome back<span className="text-gradient">.</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Live portfolio metrics, amortization trends, and recent loan activity.
          </p>
        </div>
        <Link
          to="/loans/new"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-4 py-2.5 text-sm font-semibold text-white shadow-card transition-transform hover:-translate-y-0.5 hover:shadow-glow"
        >
          <PlusCircle className="h-4 w-4" />
          Add new loan
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {kpis.map((k, i) => (
          <KpiCard key={k.label} {...k} index={i} />
        ))}
      </div>

      {/* Row 1: Balance Trend and Principal vs Interest */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-2xl p-5 lg:col-span-2"
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Aggregate loan balance trend</h2>
              <p className="text-xs text-muted-foreground">
                Combined outstanding balance over time
              </p>
            </div>
          </div>
          {trend.length > 0 ? (
            <BalanceTrendChart data={trend} />
          ) : (
            <EmptyChart message="Add an active loan to see balance trends." />
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card rounded-2xl p-5"
        >
          <div className="mb-2">
            <h2 className="text-base font-semibold">Principal vs interest</h2>
            <p className="text-xs text-muted-foreground">Across active portfolio lifetime</p>
          </div>
          {totals.principal + totals.interest > 0 ? (
            <>
              <PrincipalInterestPie principal={totals.principal} interest={totals.interest} />
              <div className="mt-4 flex justify-center gap-6 text-xs">
                <Legend
                  dotClass="bg-primary"
                  label="Principal"
                  value={currency(totals.principal)}
                />
                <Legend dotClass="bg-chart-3" label="Interest" value={currency(totals.interest)} />
              </div>
            </>
          ) : (
            <EmptyChart message="No data yet." />
          )}
        </motion.div>
      </div>

      {/* Row 2: Cash Outflow Projection and Lender Exposure */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-2xl p-5 lg:col-span-2"
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Monthly cash outflow projection</h2>
              <p className="text-xs text-muted-foreground">
                Next 12 months debt service (principal & interest)
              </p>
            </div>
          </div>
          {outflowData.length > 0 && outflowData.some((d) => d.Principal + d.Interest > 0) ? (
            <MonthlyOutflowChart data={outflowData} />
          ) : (
            <EmptyChart message="No active loans found for projections." />
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass-card rounded-2xl p-5"
        >
          <div className="mb-2">
            <h2 className="text-base font-semibold">Lender counterparty exposure</h2>
            <p className="text-xs text-muted-foreground">Outstanding balance by bank</p>
          </div>
          {lenderData.length > 0 ? (
            <LenderExposureChart data={lenderData} />
          ) : (
            <EmptyChart message="No active loans to aggregate." />
          )}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-base font-semibold">Recent loans</h2>
            <p className="text-xs text-muted-foreground">Latest 5 records</p>
          </div>
          <Link
            to="/loans"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            View all <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loans.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm text-muted-foreground">No loans yet. Start by adding one.</p>
            <Link
              to="/loans/new"
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              <PlusCircle className="h-4 w-4" /> Add a loan
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Bank / Loan #</th>
                  <th className="px-5 py-3 font-medium">Purpose</th>
                  <th className="px-5 py-3 font-medium">Amount</th>
                  <th className="px-5 py-3 font-medium">Rate</th>
                  <th className="px-5 py-3 font-medium">Tenure</th>
                  <th className="px-5 py-3 font-medium">Start</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {loans.slice(0, 5).map((l) => (
                  <tr
                    key={l.id}
                    className="border-b border-border/60 last:border-0 hover:bg-accent/40"
                  >
                    <td className="px-5 py-3">
                      <Link
                        to="/loans/$id"
                        params={{ id: l.id }}
                        className="block font-medium hover:text-primary"
                      >
                        {l.bank_name}
                      </Link>
                      <div className="text-[11px] text-muted-foreground">#{l.loan_number}</div>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{l.purpose ?? "—"}</td>
                    <td className="px-5 py-3 font-medium">{currency(Number(l.borrowed_amount))}</td>
                    <td className="px-5 py-3">{percent(Number(l.interest_rate))}</td>
                    <td className="px-5 py-3">{l.tenure_months} mo</td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {format(parseISO(l.start_date), "MMM d, yyyy")}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={l.loan_status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function Legend({ dotClass, label, value }: { dotClass: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`h-2.5 w-2.5 rounded-full ${dotClass === "bg-chart-3" ? "" : ""}`}
        style={
          dotClass === "bg-primary"
            ? { backgroundColor: "var(--color-primary)" }
            : { backgroundColor: "var(--color-chart-3)" }
        }
      />
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-[240px] items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
      {message}
    </div>
  );
}
