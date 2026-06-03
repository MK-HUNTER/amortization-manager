import { createFileRoute, Link, notFound, useNavigate } from '@tanstack/react-router';
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { format, parseISO } from 'date-fns';

import { getLoan } from '@/lib/loans/loans.functions';
import { generateSchedule } from '@/lib/loans/amortization';
import { currencyDetail } from '@/lib/format';
import { ExcelExportButton } from '@/components/loans/excel-export-button';
import type { LoanRow } from '@/lib/loans/schema';

const loanQuery = (id: string) =>
  queryOptions({ queryKey: ['loan', id], queryFn: () => getLoan({ data: { id } }) });

export const Route = createFileRoute('/loans/$id/schedule')({
  head: () => ({ meta: [{ title: 'Amortization Schedule · Amortix' }] }),
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(loanQuery(params.id));
    if (!data.loan) throw notFound();
    return data;
  },
  component: SchedulePage,
});

function SchedulePage() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(loanQuery(id));
  const loan = data.loan as LoanRow;
  const navigate = useNavigate();

  const summary = generateSchedule({
    borrowedAmount: Number(loan.borrowed_amount),
    interestRate: Number(loan.interest_rate),
    tenureMonths: Number(loan.tenure_months),
    startDate: loan.start_date,
    extraPayment: Number(loan.extra_payment ?? 0),
    balloonDate: loan.balloon_date,
    balloonAmount: loan.balloon_amount ? Number(loan.balloon_amount) : null,
  });

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate({ to: '/loans/$id', params: { id } })}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to loan
      </button>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Amortization schedule
          </div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            {loan.bank_name} <span className="text-muted-foreground">#{loan.loan_number}</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {summary.schedule.length} payments · {currencyDetail(summary.totalPayment)} total payment
          </p>
        </div>
        <ExcelExportButton loan={loan} />
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card overflow-hidden rounded-2xl">
        <div className="max-h-[68vh] overflow-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-card">
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 text-right font-medium">EMI</th>
                <th className="px-4 py-3 text-right font-medium">Principal</th>
                <th className="px-4 py-3 text-right font-medium">Interest</th>
                <th className="px-4 py-3 text-right font-medium">Extra</th>
                <th className="px-4 py-3 text-right font-medium">Balance</th>
              </tr>
            </thead>
            <tbody>
              {summary.schedule.map((row) => (
                <tr key={row.paymentNo} className="border-b border-border/50 last:border-0 hover:bg-accent/30">
                  <td className="px-4 py-2.5 font-medium text-muted-foreground">{row.paymentNo}</td>
                  <td className="px-4 py-2.5">{format(parseISO(row.date), 'MMM d, yyyy')}</td>
                  <td className="px-4 py-2.5 text-right font-medium">{currencyDetail(row.emi)}</td>
                  <td className="px-4 py-2.5 text-right text-primary">{currencyDetail(row.principal)}</td>
                  <td className="px-4 py-2.5 text-right" style={{ color: 'var(--color-chart-3)' }}>
                    {currencyDetail(row.interest)}
                  </td>
                  <td className="px-4 py-2.5 text-right text-success">
                    {row.extra > 0 ? currencyDetail(row.extra) : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-right font-semibold">{currencyDetail(row.balance)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="sticky bottom-0 z-10 bg-card">
              <tr className="border-t border-border text-sm">
                <td colSpan={2} className="px-4 py-3 text-[11px] uppercase tracking-wider text-muted-foreground">
                  Totals
                </td>
                <td className="px-4 py-3 text-right font-semibold">{currencyDetail(summary.totalPayment - summary.totalInterest + summary.totalInterest)}</td>
                <td className="px-4 py-3 text-right font-semibold text-primary">
                  {currencyDetail(Number(loan.borrowed_amount))}
                </td>
                <td className="px-4 py-3 text-right font-semibold" style={{ color: 'var(--color-chart-3)' }}>
                  {currencyDetail(summary.totalInterest)}
                </td>
                <td className="px-4 py-3"></td>
                <td className="px-4 py-3 text-right font-semibold">$0.00</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
