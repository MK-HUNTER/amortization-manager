import { createFileRoute, Link } from '@tanstack/react-router';
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowUpRight, Banknote, Layers, PiggyBank, Percent, Wallet, PlusCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';

import { listLoans } from '@/lib/loans/loans.functions';
import { calculateEmi, generateSchedule } from '@/lib/loans/amortization';
import { compactCurrency, currency, percent } from '@/lib/format';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { BalanceTrendChart } from '@/components/charts/balance-trend';
import { PrincipalInterestPie } from '@/components/charts/principal-interest-pie';
import { StatusBadge } from '@/components/ui/status-badge';
import type { LoanRow } from '@/lib/loans/schema';

const loansQuery = queryOptions({
  queryKey: ['loans'],
  queryFn: () => listLoans(),
});

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: 'Dashboard · Amortix' },
      { name: 'description', content: 'Portfolio KPIs, trends, and recent loan activity.' },
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

function buildAggregates(loans: LoanRow[]) {
  const totals = { principal: 0, interest: 0, emi: 0, balance: 0 };
  const balanceSeries = new Map<string, number>();

  for (const loan of loans) {
    if (loan.loan_status !== 'active') continue;
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

  const active = loans.filter((l) => l.loan_status === 'active');
  const portfolio = loans.reduce((s, l) => s + Number(l.borrowed_amount), 0);
  const avgRate =
    loans.length === 0 ? 0 : loans.reduce((s, l) => s + Number(l.interest_rate), 0) / loans.length;
  const monthlyEmi = active.reduce(
    (s, l) =>
      s + calculateEmi(Number(l.borrowed_amount), Number(l.interest_rate), Number(l.tenure_months)),
    0,
  );
  const { trend, totals } = buildAggregates(loans);

  const kpis = [
    { label: 'Total loans', value: String(loans.length).padStart(2, '0'), hint: 'All-time records', icon: Layers, variant: 'primary' as const },
    { label: 'Active loans', value: String(active.length).padStart(2, '0'), hint: 'Currently amortizing', icon: Wallet, variant: 'success' as const },
    { label: 'Portfolio value', value: compactCurrency(portfolio), hint: 'Total borrowed', icon: PiggyBank, variant: 'cool' as const },
    { label: 'Monthly EMI', value: compactCurrency(monthlyEmi), hint: 'Across active loans', icon: Banknote, variant: 'warm' as const },
    { label: 'Avg. interest', value: percent(avgRate), hint: 'Weighted by count', icon: Percent, variant: 'neutral' as const },
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
              <p className="text-xs text-muted-foreground">Combined outstanding balance over time</p>
            </div>
          </div>
          {trend.length > 0 ? (
            <BalanceTrendChart data={trend} />
          ) : (
            <EmptyChart message="Add a loan to see balance trends." />
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
                <Legend dotClass="bg-primary" label="Principal" value={currency(totals.principal)} />
                <Legend dotClass="bg-chart-3" label="Interest" value={currency(totals.interest)} />
              </div>
            </>
          ) : (
            <EmptyChart message="No data yet." />
          )}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
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
                  <tr key={l.id} className="border-b border-border/60 last:border-0 hover:bg-accent/40">
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
                    <td className="px-5 py-3 text-muted-foreground">{l.purpose ?? '—'}</td>
                    <td className="px-5 py-3 font-medium">{currency(Number(l.borrowed_amount))}</td>
                    <td className="px-5 py-3">{percent(Number(l.interest_rate))}</td>
                    <td className="px-5 py-3">{l.tenure_months} mo</td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {format(parseISO(l.start_date), 'MMM d, yyyy')}
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
      <span className={`h-2.5 w-2.5 rounded-full ${dotClass === 'bg-chart-3' ? '' : ''}`} style={dotClass === 'bg-primary' ? { backgroundColor: 'var(--color-primary)' } : { backgroundColor: 'var(--color-chart-3)' }} />
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
