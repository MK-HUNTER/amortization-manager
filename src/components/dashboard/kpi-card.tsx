import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: string;
  hint?: string;
  delta?: { value: string; positive?: boolean };
  icon: LucideIcon;
  variant?: "primary" | "success" | "warm" | "cool" | "neutral";
  index?: number;
}

const variantBg: Record<NonNullable<Props["variant"]>, string> = {
  primary: "bg-gradient-primary",
  success: "bg-gradient-success",
  warm: "bg-gradient-warm",
  cool: "bg-gradient-cool",
  neutral: "bg-muted",
};

export function KpiCard({
  label,
  value,
  hint,
  delta,
  icon: Icon,
  variant = "neutral",
  index = 0,
}: Props) {
  const onColor = variant !== "neutral";
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: "easeOut" }}
      whileHover={{ y: -4 }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border p-5 shadow-card transition-shadow hover:shadow-glow",
        onColor ? cn(variantBg[variant], "text-white border-white/10") : "glass-card",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div
            className={cn(
              "text-[11px] font-semibold uppercase tracking-[0.14em]",
              onColor ? "text-white/75" : "text-muted-foreground",
            )}
          >
            {label}
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{value}</div>
          {hint && (
            <div
              className={cn("mt-1 text-xs", onColor ? "text-white/70" : "text-muted-foreground")}
            >
              {hint}
            </div>
          )}
        </div>
        <div
          className={cn(
            "rounded-xl p-2.5",
            onColor ? "bg-white/15 backdrop-blur" : "bg-accent text-accent-foreground",
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {delta && (
        <div
          className={cn(
            "mt-4 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
            onColor
              ? "bg-white/15 text-white"
              : delta.positive
                ? "bg-success/15 text-success"
                : "bg-destructive/15 text-destructive",
          )}
        >
          {delta.value}
        </div>
      )}
      <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-white/10 blur-2xl transition-opacity group-hover:opacity-100" />
    </motion.div>
  );
}
