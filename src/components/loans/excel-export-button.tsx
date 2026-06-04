import { Download } from "lucide-react";
import type { LoanRow } from "@/lib/loans/schema";
import { generateSchedule } from "@/lib/loans/amortization";
import { exportScheduleToExcel } from "@/lib/loans/export-excel";
import { cn } from "@/lib/utils";

export function ExcelExportButton({
  loan,
  className,
  label = "Export to Excel",
}: {
  loan: LoanRow;
  className?: string;
  label?: string;
}) {
  const handle = () => {
    const summary = generateSchedule({
      borrowedAmount: Number(loan.borrowed_amount),
      interestRate: Number(loan.interest_rate),
      tenureMonths: Number(loan.tenure_months),
      startDate: loan.start_date,
      extraPayment: Number(loan.extra_payment ?? 0),
      balloonDate: loan.balloon_date,
      balloonAmount: loan.balloon_amount ? Number(loan.balloon_amount) : null,
    });
    exportScheduleToExcel(loan, summary);
  };

  return (
    <button
      onClick={handle}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-4 py-2.5 text-sm font-semibold text-white shadow-card transition-transform hover:-translate-y-0.5 hover:shadow-glow active:translate-y-0",
        className,
      )}
    >
      <Download className="h-4 w-4" />
      {label}
    </button>
  );
}
