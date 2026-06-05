import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Edit2, Check, X } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useState, useMemo } from "react";
import { toast } from "sonner";

import { getLoan, saveCustomExtraPayment } from "@/lib/loans/loans.functions";
import { generateSchedule } from "@/lib/loans/amortization";
import { currencyDetail } from "@/lib/format";
import { ExcelExportButton } from "@/components/loans/excel-export-button";
import type { LoanRow, LoanExtraPayment } from "@/lib/loans/schema";

const loanQuery = (id: string) =>
  queryOptions({ queryKey: ["loan", id], queryFn: () => getLoan({ data: { id } }) });

export const Route = createFileRoute("/loans/$id/schedule")({
  head: () => ({ meta: [{ title: "Amortization Schedule · Amortix" }] }),
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
  const extraPayments = (data.extraPayments ?? []) as LoanExtraPayment[];
  const navigate = useNavigate();
  const qc = useQueryClient();
  const saveExtraFn = useServerFn(saveCustomExtraPayment);

  const [activeEditMonth, setActiveEditMonth] = useState<number | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const customExtraPaymentsRecord = useMemo(() => {
    const record: Record<number, number> = {};
    for (const ep of extraPayments) {
      record[ep.payment_no] = Number(ep.amount);
    }
    return record;
  }, [extraPayments]);

  const summary = generateSchedule({
    borrowedAmount: Number(loan.borrowed_amount),
    interestRate: Number(loan.interest_rate),
    tenureMonths: Number(loan.tenure_months),
    startDate: loan.start_date,
    extraPayment: Number(loan.extra_payment ?? 0),
    balloonDate: loan.balloon_date,
    balloonAmount: loan.balloon_amount ? Number(loan.balloon_amount) : null,
    customExtraPayments: customExtraPaymentsRecord,
  });

  const handleSave = async (paymentNo: number) => {
    const amount = editAmount.trim() === "" ? 0 : Number(editAmount);
    if (Number.isNaN(amount) || amount < 0) {
      toast.error("Please enter a valid positive number");
      return;
    }
    setIsSaving(true);
    try {
      await saveExtraFn({
        data: {
          loanId: id,
          paymentNo,
          amount,
        },
      });
      await qc.invalidateQueries({ queryKey: ["loan", id] });
      await qc.invalidateQueries({ queryKey: ["loans"] });
      toast.success(amount > 0 ? "Additional payment saved" : "Additional payment removed");
      setActiveEditMonth(null);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate({ to: "/loans/$id", params: { id } })}
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
            {summary.schedule.length} payments · {currencyDetail(summary.totalPayment)} total
            payment
          </p>
        </div>
        <ExcelExportButton loan={loan} customExtraPayments={customExtraPaymentsRecord} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card overflow-hidden rounded-2xl"
      >
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
                <tr
                  key={row.paymentNo}
                  className="border-b border-border/50 last:border-0 hover:bg-accent/30"
                >
                  <td className="px-4 py-2.5 font-medium text-muted-foreground">{row.paymentNo}</td>
                  <td className="px-4 py-2.5">{format(parseISO(row.date), "MMM d, yyyy")}</td>
                  <td className="px-4 py-2.5 text-right font-medium">{currencyDetail(row.emi)}</td>
                  <td className="px-4 py-2.5 text-right text-primary">
                    {currencyDetail(row.principal)}
                  </td>
                  <td className="px-4 py-2.5 text-right" style={{ color: "var(--color-chart-3)" }}>
                    {currencyDetail(row.interest)}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1.5 group/cell">
                      {activeEditMonth === row.paymentNo ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            autoFocus
                            disabled={isSaving}
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSave(row.paymentNo);
                              if (e.key === "Escape") setActiveEditMonth(null);
                            }}
                            className="h-7 w-20 rounded-lg border border-input bg-background px-1.5 py-0.5 text-right text-xs focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring/30"
                          />
                          <button
                            onClick={() => handleSave(row.paymentNo)}
                            disabled={isSaving}
                            className="rounded-md p-1 text-success hover:bg-success/10 disabled:opacity-40"
                            title="Save"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setActiveEditMonth(null)}
                            disabled={isSaving}
                            className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-40"
                            title="Cancel"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="text-right">
                            {row.extra > 0 ? (
                              <span className="font-medium text-success">
                                {currencyDetail(row.extra)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground/40">—</span>
                            )}
                            {(customExtraPaymentsRecord[row.paymentNo] ?? 0) > 0 && (
                              <div className="text-[10px] text-muted-foreground leading-none mt-0.5">
                                (Custom: {currencyDetail(customExtraPaymentsRecord[row.paymentNo])})
                              </div>
                            )}
                          </div>
                          {row.paymentNo < summary.schedule.length && (
                            <button
                              onClick={() => {
                                setActiveEditMonth(row.paymentNo);
                                setEditAmount(
                                  customExtraPaymentsRecord[row.paymentNo]
                                    ? String(customExtraPaymentsRecord[row.paymentNo])
                                    : "",
                                );
                              }}
                              className="opacity-0 group-hover/cell:opacity-100 focus:opacity-100 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-opacity"
                              title={
                                (customExtraPaymentsRecord[row.paymentNo] ?? 0) > 0
                                  ? "Edit extra payment"
                                  : "Add extra payment"
                              }
                            >
                              {(customExtraPaymentsRecord[row.paymentNo] ?? 0) > 0 ? (
                                <Edit2 className="h-3 w-3" />
                              ) : (
                                <Plus className="h-3 w-3" />
                              )}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right font-semibold">
                    {currencyDetail(row.balance)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="sticky bottom-0 z-10 bg-card">
              <tr className="border-t border-border text-sm">
                <td
                  colSpan={2}
                  className="px-4 py-3 text-[11px] uppercase tracking-wider text-muted-foreground"
                >
                  Totals
                </td>
                <td className="px-4 py-3 text-right font-semibold">
                  {currencyDetail(
                    summary.totalPayment - summary.totalInterest + summary.totalInterest,
                  )}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-primary">
                  {currencyDetail(Number(loan.borrowed_amount))}
                </td>
                <td
                  className="px-4 py-3 text-right font-semibold"
                  style={{ color: "var(--color-chart-3)" }}
                >
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
