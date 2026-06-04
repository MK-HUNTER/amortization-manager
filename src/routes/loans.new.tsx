import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Banknote, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

import { createLoan } from "@/lib/loans/loans.functions";
import { loanFormSchema, type LoanFormValues } from "@/lib/loans/schema";
import { calculateEmi, generateSchedule } from "@/lib/loans/amortization";
import { currency, percent } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/loans/new")({
  head: () => ({
    meta: [
      { title: "Add New Loan · Amortix" },
      {
        name: "description",
        content: "Add a loan with strict validation and a live amortization preview.",
      },
    ],
  }),
  component: AddLoanPage,
});

function AddLoanPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const createFn = useServerFn(createLoan);

  const today = format(new Date(), "yyyy-MM-dd");

  const form = useForm<LoanFormValues>({
    resolver: zodResolver(loanFormSchema),
    mode: "onChange",
    defaultValues: {
      bank_name: "",
      loan_number: "",
      purpose: "",
      borrowed_amount: "" as unknown as number,
      interest_rate: "" as unknown as number,
      tenure_months: "" as unknown as number,
      start_date: today,
      balloon_date: "",
      balloon_amount: "" as unknown as number,
      extra_payment: "" as unknown as number,
      emi_type: "standard",
      loan_status: "active",
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, isValid },
  } = form;

  const watched = watch();
  const preview = useMemo(() => {
    const amt = Number(watched.borrowed_amount);
    const rate = Number(watched.interest_rate);
    const tenure = Number(watched.tenure_months);
    if (!amt || !rate || !tenure || amt <= 0 || tenure <= 0) return null;
    return generateSchedule({
      borrowedAmount: amt,
      interestRate: rate,
      tenureMonths: tenure,
      startDate: watched.start_date || today,
      extraPayment: Number(watched.extra_payment) || 0,
      balloonDate: watched.balloon_date || null,
      balloonAmount: Number(watched.balloon_amount) || null,
    });
  }, [watched, today]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      const payload = {
        bank_name: values.bank_name,
        loan_number: values.loan_number,
        purpose: values.purpose || null,
        borrowed_amount: Number(values.borrowed_amount),
        interest_rate: Number(values.interest_rate),
        tenure_months: Number(values.tenure_months),
        start_date: values.start_date,
        balloon_date: values.balloon_date || null,
        balloon_amount:
          values.balloon_amount && !Number.isNaN(Number(values.balloon_amount))
            ? Number(values.balloon_amount)
            : null,
        extra_payment:
          values.extra_payment && !Number.isNaN(Number(values.extra_payment))
            ? Number(values.extra_payment)
            : 0,
        emi_type: values.emi_type,
        loan_status: values.loan_status,
      };
      const res = await createFn({ data: payload });
      await qc.invalidateQueries({ queryKey: ["loans"] });
      toast.success("Loan created");
      navigate({ to: "/loans/$id", params: { id: res.loan.id } });
    } catch (e) {
      toast.error((e as Error).message);
    }
  });

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate({ to: "/loans" })}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to loans
      </button>

      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          New record
        </div>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Add a new loan</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Validated inputs with a real-time amortization preview on the right.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <form onSubmit={onSubmit} className="glass-card space-y-5 rounded-2xl p-6 lg:col-span-3">
          <Section title="Lender">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Bank / Lender" error={errors.bank_name?.message}>
                <input
                  className={inputCls(!!errors.bank_name)}
                  placeholder="ICICI Bank"
                  {...register("bank_name")}
                />
              </Field>
              <Field label="Loan number" error={errors.loan_number?.message}>
                <input
                  className={inputCls(!!errors.loan_number)}
                  placeholder="HL-2024-00138"
                  {...register("loan_number")}
                />
              </Field>
              <Field label="Purpose" error={errors.purpose?.message} className="sm:col-span-2">
                <input
                  className={inputCls(!!errors.purpose)}
                  placeholder="Home renovation"
                  {...register("purpose")}
                />
              </Field>
            </div>
          </Section>

          <Section title="Loan terms">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Borrowed amount" error={errors.borrowed_amount?.message}>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className={inputCls(!!errors.borrowed_amount)}
                  placeholder="250000"
                  {...register("borrowed_amount")}
                />
              </Field>
              <Field label="Interest rate (%)" error={errors.interest_rate?.message}>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  max="100"
                  className={inputCls(!!errors.interest_rate)}
                  placeholder="8.5"
                  {...register("interest_rate")}
                />
              </Field>
              <Field label="Tenure (months)" error={errors.tenure_months?.message}>
                <input
                  type="number"
                  min="1"
                  max="600"
                  className={inputCls(!!errors.tenure_months)}
                  placeholder="240"
                  {...register("tenure_months")}
                />
              </Field>
              <Field label="Start date" error={errors.start_date?.message}>
                <input
                  type="date"
                  className={inputCls(!!errors.start_date)}
                  {...register("start_date")}
                />
              </Field>
              <Field label="EMI type">
                <select className={inputCls(false)} {...register("emi_type")}>
                  <option value="standard">Standard reducing</option>
                  <option value="reducing">Reducing balance</option>
                  <option value="flat">Flat</option>
                </select>
              </Field>
              <Field label="Status">
                <select className={inputCls(false)} {...register("loan_status")}>
                  <option value="active">Active</option>
                  <option value="closed">Closed</option>
                  <option value="overdue">Overdue</option>
                </select>
              </Field>
            </div>
          </Section>

          <Section title="Optional">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Extra monthly payment">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className={inputCls(false)}
                  placeholder="0"
                  {...register("extra_payment")}
                />
              </Field>
              <Field label="Balloon date">
                <input type="date" className={inputCls(false)} {...register("balloon_date")} />
              </Field>
              <Field label="Balloon amount">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className={inputCls(false)}
                  placeholder="0"
                  {...register("balloon_amount")}
                />
              </Field>
            </div>
          </Section>

          <div className="flex items-center justify-between border-t border-border pt-4">
            <div className="text-xs text-muted-foreground">
              All amounts are saved as-entered. EMI is computed using reducing balance.
            </div>
            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-card transition-transform",
                isValid && !isSubmitting
                  ? "bg-gradient-primary hover:-translate-y-0.5 hover:shadow-glow"
                  : "cursor-not-allowed bg-muted text-muted-foreground",
              )}
            >
              <CheckCircle2 className="h-4 w-4" />
              {isSubmitting ? "Saving…" : "Create loan"}
            </button>
          </div>
        </form>

        <motion.aside
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2"
        >
          <div className="glass-card sticky top-20 rounded-2xl p-6">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary text-white">
                <Banknote className="h-4.5 w-4.5" />
              </div>
              <div>
                <div className="text-sm font-semibold">Live preview</div>
                <div className="text-[11px] text-muted-foreground">Updates as you type</div>
              </div>
            </div>

            {preview ? (
              <dl className="mt-5 space-y-3 text-sm">
                <Stat label="Monthly EMI" value={currency(preview.emi)} highlight />
                <Stat label="Total payment" value={currency(preview.totalPayment)} />
                <Stat label="Total interest" value={currency(preview.totalInterest)} />
                <Stat label="Effective rate" value={percent(Number(watched.interest_rate) || 0)} />
                <Stat label="Payoff months" value={String(preview.payoffMonths)} />
                <Stat label="Payoff date" value={preview.payoffDate} />
              </dl>
            ) : (
              <p className="mt-5 text-sm text-muted-foreground">
                Enter amount, rate, and tenure to see the schedule preview.
              </p>
            )}
          </div>
        </motion.aside>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {title}
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  error,
  children,
  className,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-xs font-medium text-foreground">{label}</span>
      {children}
      {error && <span className="mt-1 block text-[11px] text-destructive">{error}</span>}
    </label>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 pb-2 last:border-0 last:pb-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={cn("font-semibold", highlight && "text-lg text-gradient")}>{value}</dd>
    </div>
  );
}

const inputCls = (hasErr: boolean) =>
  cn(
    "h-10 w-full rounded-xl border bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30",
    hasErr ? "border-destructive focus:border-destructive" : "border-input focus:border-ring",
  );
