import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format, parseISO } from "date-fns";
import { compactCurrency, currencyDetail } from "@/lib/format";
import type { PaymentRow } from "@/lib/loans/amortization";

export function PaymentBreakdownChart({ data }: { data: PaymentRow[] }) {
  const limited = data.slice(0, 24);
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={limited} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis
          dataKey="date"
          tickFormatter={(d) => format(parseISO(d), "MMM yy")}
          stroke="var(--color-muted-foreground)"
          tick={{ fontSize: 11 }}
          minTickGap={20}
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
          labelFormatter={(d) => format(parseISO(d as string), "PP")}
          formatter={(v: number) => currencyDetail(v)}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="principal" stackId="a" fill="var(--color-primary)" radius={[0, 0, 0, 0]} />
        <Bar dataKey="interest" stackId="a" fill="var(--color-chart-3)" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
