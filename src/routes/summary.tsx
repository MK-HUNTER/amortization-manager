import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { FileText, PlusCircle } from "lucide-react";

import { listLoans } from "@/lib/loans/loans.functions";
import { calculateEmi } from "@/lib/loans/amortization";
import { currency, percent } from "@/lib/format";
import { StatusBadge } from "@/components/ui/status-badge";
import type { LoanRow } from "@/lib/loans/schema";

const loansQuery = queryOptions({ queryKey: ["loans"], queryFn: () => listLoans() });

export const Route = createFileRoute("/summary")({
  head: () => ({
    meta: [
      { title: "Loan Summary · Amortix" },
      { name: "description", content: "Pick a loan to review its full amortization summary." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(loansQuery),
  component: SummaryIndex,
});

function SummaryIndex() {
  const { data } = useSuspenseQuery(loansQuery);
  const loans = data.loans as LoanRow[];

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Loan summary
        </div>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Select a loan to summarize</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Each summary includes KPIs, trend charts, schedule view, and Excel export.
        </p>
      </div>

      {loans.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
          <h3 className="mt-4 text-base font-semibold">No loans to summarize</h3>
          <p className="mt-1 text-sm text-muted-foreground">Create a loan first.</p>
          <Link
            to="/loans/new"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-4 py-2.5 text-sm font-semibold text-white shadow-card"
          >
            <PlusCircle className="h-4 w-4" /> Add a loan
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loans.map((l) => {
            const emi = calculateEmi(
              Number(l.borrowed_amount),
              Number(l.interest_rate),
              Number(l.tenure_months),
            );
            return (
              <Link
                key={l.id}
                to="/loans/$id"
                params={{ id: l.id }}
                className="glass-card group relative overflow-hidden rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-glow"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-semibold">{l.bank_name}</div>
                    <div className="text-[11px] text-muted-foreground">#{l.loan_number}</div>
                  </div>
                  <StatusBadge status={l.loan_status} />
                </div>
                <div className="mt-4 text-2xl font-bold text-gradient">
                  {currency(Number(l.borrowed_amount))}
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <Item label="Rate" value={percent(Number(l.interest_rate))} />
                  <Item label="Tenure" value={`${l.tenure_months} mo`} />
                  <Item label="EMI" value={currency(emi)} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-accent/50 px-2 py-1.5">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-xs font-semibold">{value}</div>
    </div>
  );
}
