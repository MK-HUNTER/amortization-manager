import { createFileRoute } from '@tanstack/react-router';
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { listLoans } from '@/lib/loans/loans.functions';
import { calculateEmi, generateSchedule } from '@/lib/loans/amortization';
import { compactCurrency, currency, currencyDetail, percent } from '@/lib/format';
import { BalanceTrendChart } from '@/components/charts/balance-trend';
import type { LoanRow } from '@/lib/loans/schema';

const loansQuery = queryOptions({ queryKey: ['loans'], queryFn: () => listLoans() });

export const Route = createFileRoute('/reports')({
  head: () => ({
    meta: [
      { title: 'Reports · Amortix' },
      { name: 'description', content: 'Portfolio analytics: principal vs interest, EMIs by bank, balance trends.' },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(loansQuery),
  component: ReportsPage,
});

function ReportsPage() {
  const { data } = useSuspenseQuery(loansQuery);
  const loans = data.loans as LoanRow[];

  const totals = { principal: 0, interest: 0, emi: 0 };
  const byBank = new Map<string, { bank: string; principal: number; interest: number; emi: number }>();
  const balanceSeries = new Map<string, number>();

  for (const l of loans) {
    const s = generateSchedule({
      borrowedAmount: Number(l.borrowed_amount),
      interestRate: Number(l.interest_rate),
      tenureMonths: Number(l.tenure_months),
      startDate: l.start_date,
      extraPayment: Number(l.extra_payment ?? 0),
      balloonDate: l.balloon_date,
      balloonAmount: l.balloon_amount ? Number(l.balloon_amount) : null,
    });
    const emi = calculateEmi(Number(l.borrowed_amount), Number(l.interest_rate), Number(l.tenure_months));
    totals.principal += Number(l.borrowed_amount);
    totals.interest += s.totalInterest;
    totals.emi += l.loan_status === 'active' ? emi : 0;

    const entry = byBank.get(l.bank_name) ?? { bank: l.bank_name, principal: 0, interest: 0, emi: 0 };
    entry.principal += Number(l.borrowed_amount);
    entry.interest += s.totalInterest;
    entry.emi += emi;
    byBank.set(l.bank_name, entry);

    if (l.loan_status === 'active') {
      for (const r of s.schedule) balanceSeries.set(r.date, (balanceSeries.get(r.date) ?? 0) + r.balance);
    }
  }

  const bankData = Array.from(byBank.values()).sort((a, b) => b.principal - a.principal);
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

  const pieData = [
    { name: 'Principal', value: totals.principal, color: 'var(--color-primary)' },
    { name: 'Interest', value: totals.interest, color: 'var(--color-chart-3)' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Portfolio analytics
        </div>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Aggregated insights across {loans.length} loan{loans.length === 1 ? '' : 's'}.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Pill label="Total principal" value={currency(totals.principal)} />
        <Pill label="Lifetime interest" value={currency(totals.interest)} />
        <Pill
          label="Interest %"
          value={percent(totals.principal > 0 ? (totals.interest / totals.principal) * 100 : 0)}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-5 lg:col-span-2">
          <h2 className="text-base font-semibold">Portfolio balance over time</h2>
          <p className="text-xs text-muted-foreground">Sum of outstanding balances across active loans</p>
          <div className="mt-3">
            {trend.length > 0 ? (
              <BalanceTrendChart data={trend} />
            ) : (
              <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
                No active loans
              </div>
            )}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card rounded-2xl p-5">
          <h2 className="text-base font-semibold">Principal vs interest</h2>
          <p className="text-xs text-muted-foreground">Across all loans</p>
          {totals.principal + totals.interest > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Tooltip
                  contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 12 }}
                  formatter={(v: number) => currencyDetail(v)}
                />
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={2}
                  stroke="var(--color-card)"
                  strokeWidth={3}
                >
                  {pieData.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">No data</div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-2xl p-5 lg:col-span-3">
          <h2 className="text-base font-semibold">Exposure by lender</h2>
          <p className="text-xs text-muted-foreground">Principal & interest grouped by bank</p>
          {bankData.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={bankData} margin={{ left: 0, right: 8, top: 16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="bank" stroke="var(--color-muted-foreground)" tick={{ fontSize: 11 }} />
                <YAxis stroke="var(--color-muted-foreground)" tickFormatter={(v) => compactCurrency(v)} tick={{ fontSize: 11 }} width={56} />
                <Tooltip
                  contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 12 }}
                  formatter={(v: number) => currencyDetail(v)}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="principal" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="interest" fill="var(--color-chart-3)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">No data</div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-card rounded-2xl px-5 py-4">
      <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold text-gradient">{value}</div>
    </div>
  );
}
