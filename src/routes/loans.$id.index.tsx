import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CalendarDays,
  FileSpreadsheet,
  Layers,
  Percent,
  PiggyBank,
  Trash2,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { useMemo } from "react";

import { deleteLoan, getLoan } from "@/lib/loans/loans.functions";
import { generateSchedule } from "@/lib/loans/amortization";
import { currency, percent } from "@/lib/format";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { BalanceTrendChart } from "@/components/charts/balance-trend";
import { PrincipalInterestPie } from "@/components/charts/principal-interest-pie";
import { PaymentBreakdownChart } from "@/components/charts/payment-breakdown";
import { ExcelExportButton } from "@/components/loans/excel-export-button";
import { StatusBadge } from "@/components/ui/status-badge";
import type { LoanRow, LoanExtraPayment } from "@/lib/loans/schema";

const loanQuery = (id: string) =>
  queryOptions({ queryKey: ["loan", id], queryFn: () => getLoan({ data: { id } }) });

export const Route = createFileRoute("/loans/$id/")({
  head: ({ params }) => ({
    meta: [{ title: `Loan ${params.id.slice(0, 8)} · Amortix` }],
  }),
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(loanQuery(params.id));
    if (!data.loan) throw notFound();
    return data;
  },
  component: LoanSummaryPage,
  notFoundComponent: () => (
    <div className="rounded-2xl border border-border p-8 text-center">
      <h2 className="text-lg font-semibold">Loan not found</h2>
      <Link to="/loans" className="mt-3 inline-block text-sm text-primary hover:underline">
        Back to loans
      </Link>
    </div>
  ),
});

function LoanSummaryPage() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(loanQuery(id));
  const loan = data.loan as LoanRow;
  const extraPayments = (data.extraPayments ?? []) as LoanExtraPayment[];
  const navigate = useNavigate();
  const qc = useQueryClient();
  const deleteFn = useServerFn(deleteLoan);

  const customExtraPaymentsRecord = useMemo(() => {
    const record: Record<number, number> = {};
    for (const ep of extraPayments) {
      record[ep.payment_no] = Number(ep.amount);
    }
    return record;
  }, [extraPayments]);

  const summary = generateSchedule({
    borrowedAmount: Number(loan.borrowed_amount),
    interestRate: Number(loan.interest_rate),
    tenureMonths: Number(loan.tenure_months),
    startDate: loan.start_date,
    extraPayment: Number(loan.extra_payment ?? 0),
    balloonDate: loan.balloon_date,
    balloonAmount: loan.balloon_amount ? Number(loan.balloon_amount) : null,
    customExtraPayments: customExtraPaymentsRecord,
  });

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate({ to: "/loans" })}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to loans
      </button>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Loan summary <StatusBadge status={loan.loan_status} />
          </div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">{loan.bank_name}</h1>
          <div className="mt-1 text-sm text-muted-foreground">
            #{loan.loan_number} · {loan.purpose ?? "No purpose specified"}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/loans/$id/schedule"
            params={{ id: loan.id }}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium hover:bg-accent"
          >
            <FileSpreadsheet className="h-4 w-4" /> View schedule
          </Link>
          <ExcelExportButton loan={loan} customExtraPayments={customExtraPaymentsRecord} />
          <button
            onClick={async () => {
              if (!confirm("Delete this loan?")) return;
              try {
                await deleteFn({ data: { id: loan.id } });
                await qc.invalidateQueries({ queryKey: ["loans"] });
                toast.success("Loan deleted");
                navigate({ to: "/loans" });
              } catch (e) {
                toast.error((e as Error).message);
              }
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Borrowed"
          value={currency(Number(loan.borrowed_amount))}
          hint={`Start ${format(parseISO(loan.start_date), "MMM d, yyyy")}`}
          icon={PiggyBank}
          variant="primary"
          index={0}
        />
        <KpiCard
          label="Monthly EMI"
          value={currency(summary.emi)}
          hint="Reducing balance"
          icon={Layers}
          variant="success"
          index={1}
        />
        <KpiCard
          label="Total interest"
          value={currency(summary.totalInterest)}
          hint="Lifetime cost"
          icon={Percent}
          variant="warm"
          index={2}
        />
        <KpiCard
          label="Payoff date"
          value={format(parseISO(summary.payoffDate), "MMM yyyy")}
          hint={`${summary.payoffMonths} months`}
          icon={CalendarDays}
          variant="cool"
          index={3}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-5 lg:col-span-2"
        >
          <h2 className="text-base font-semibold">Outstanding balance</h2>
          <p className="text-xs text-muted-foreground">From start to full payoff</p>
          <div className="mt-3">
            <BalanceTrendChart data={summary.schedule} />
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-card rounded-2xl p-5"
        >
          <h2 className="text-base font-semibold">Principal vs interest</h2>
          <p className="text-xs text-muted-foreground">Lifetime composition</p>
          <PrincipalInterestPie
            principal={Number(loan.borrowed_amount)}
            interest={summary.totalInterest}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-2xl p-5 lg:col-span-3"
        >
          <h2 className="text-base font-semibold">First 24 months — payment breakdown</h2>
          <p className="text-xs text-muted-foreground">Principal stacked with interest</p>
          <div className="mt-3">
            <PaymentBreakdownChart data={summary.schedule} />
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card grid grid-cols-2 gap-4 rounded-2xl p-6 md:grid-cols-4"
      >
        <Meta label="Interest rate" value={percent(Number(loan.interest_rate))} />
        <Meta label="Tenure" value={`${loan.tenure_months} months`} />
        <Meta label="Extra payment" value={currency(Number(loan.extra_payment ?? 0))} />
        <Meta
          label="Balloon"
          value={
            loan.balloon_amount
              ? `${currency(Number(loan.balloon_amount))} · ${loan.balloon_date}`
              : "—"
          }
        />
      </motion.div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
    </div>
  );
}
