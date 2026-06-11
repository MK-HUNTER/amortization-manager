import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { compactCurrency, currencyDetail } from "@/lib/format";

export interface LenderData {
  name: string; // e.g. "HSBC"
  value: number; // outstanding balance
}

export function LenderExposureChart({ data }: { data: LenderData[] }) {
  const colors = [
    "var(--color-primary)",
    "var(--color-chart-3)",
    "var(--color-chart-2)",
    "var(--color-chart-4)",
    "var(--color-chart-5)",
  ];

  return (
    <ResponsiveContainer width="100%" height={260} debounce={100}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ left: 16, right: 8, top: 8, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
        <XAxis
          type="number"
          stroke="var(--color-muted-foreground)"
          tickFormatter={(v) => compactCurrency(v)}
          tick={{ fontSize: 11 }}
        />
        <YAxis
          type="category"
          dataKey="name"
          stroke="var(--color-muted-foreground)"
          tick={{ fontSize: 11 }}
          width={80}
        />
        <Tooltip
          contentStyle={{
            background: "var(--color-card)",
            border: "1px solid var(--color-border)",
            borderRadius: 12,
          }}
          formatter={(v: number) => currencyDetail(v)}
        />
        <Bar dataKey="value" fill="var(--color-primary)" radius={[0, 4, 4, 0]}>
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
