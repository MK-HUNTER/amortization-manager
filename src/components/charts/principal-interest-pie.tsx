import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { currencyDetail } from '@/lib/format';

export function PrincipalInterestPie({
  principal,
  interest,
}: {
  principal: number;
  interest: number;
}) {
  const data = [
    { name: 'Principal', value: principal, color: 'var(--color-primary)' },
    { name: 'Interest', value: interest, color: 'var(--color-chart-3)' },
  ];
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Tooltip
          contentStyle={{
            background: 'var(--color-card)',
            border: '1px solid var(--color-border)',
            borderRadius: 12,
          }}
          formatter={(v: number) => currencyDetail(v)}
        />
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={68}
          outerRadius={100}
          paddingAngle={2}
          stroke="var(--color-card)"
          strokeWidth={3}
        >
          {data.map((d) => (
            <Cell key={d.name} fill={d.color} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}
