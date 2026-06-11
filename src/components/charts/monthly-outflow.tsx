import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { compactCurrency, currencyDetail } from "@/lib/format";

export interface OutflowData {
  month: string; // e.g. "Jul 26"
  Principal: number;
  Interest: number;
}

export function MonthlyOutflowChart({ data }: { data: OutflowData[] }) {
  return (
    <ResponsiveContainer width="100%" height={280} debounce={100}>
      <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis
          dataKey="month"
          stroke="var(--color-muted-foreground)"
          tick={{ fontSize: 11 }}
        />
        <YAxis
          stroke="var(--color-muted-foreground)"
          tickFormatter={(v) => compactCurrency(v)}
          tick={{ fontSize: 11 }}
          width={56}
        />
        <Tooltip
          contentStyle={{
            background: "var(--color-card)",
            border: "1px solid var(--color-border)",
            borderRadius: 12,
          }}
          formatter={(v: number) => currencyDetail(v)}
        />
        <Legend
          verticalAlign="top"
          height={36}
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12 }}
        />
        <Bar dataKey="Principal" stackId="a" fill="var(--color-primary)" radius={[0, 0, 0, 0]} />
        <Bar dataKey="Interest" stackId="a" fill="var(--color-chart-3)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
