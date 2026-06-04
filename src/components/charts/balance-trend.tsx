import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format, parseISO } from "date-fns";
import { compactCurrency, currencyDetail } from "@/lib/format";
import type { PaymentRow } from "@/lib/loans/amortization";

export function BalanceTrendChart({ data }: { data: PaymentRow[] }) {
  const sampled =
    data.length > 60 ? data.filter((_, i) => i % Math.ceil(data.length / 60) === 0) : data;
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={sampled} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="balFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.45} />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
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
        <Area
          type="monotone"
          dataKey="balance"
          stroke="var(--color-primary)"
          strokeWidth={2.5}
          fill="url(#balFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
