import * as XLSX from 'xlsx';
import type { PaymentRow, ScheduleSummary } from './amortization';
import type { LoanRow } from './schema';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n);

export function exportScheduleToExcel(loan: LoanRow, summary: ScheduleSummary) {
  const wb = XLSX.utils.book_new();

  const meta = [
    ['Loan Amortization Schedule'],
    [],
    ['Bank', loan.bank_name],
    ['Loan #', loan.loan_number],
    ['Purpose', loan.purpose ?? '—'],
    ['Borrowed Amount', fmt(Number(loan.borrowed_amount))],
    ['Interest Rate', `${loan.interest_rate}%`],
    ['Tenure (months)', loan.tenure_months],
    ['Start Date', loan.start_date],
    [],
    ['Monthly EMI', fmt(summary.emi)],
    ['Total Interest', fmt(summary.totalInterest)],
    ['Total Payment', fmt(summary.totalPayment)],
    ['Payoff Date', summary.payoffDate],
  ];
  const ws1 = XLSX.utils.aoa_to_sheet(meta);
  ws1['!cols'] = [{ wch: 22 }, { wch: 28 }];
  XLSX.utils.book_append_sheet(wb, ws1, 'Summary');

  const rows = summary.schedule.map((r: PaymentRow) => ({
    'Payment #': r.paymentNo,
    Date: r.date,
    EMI: Number(r.emi.toFixed(2)),
    Principal: Number(r.principal.toFixed(2)),
    Interest: Number(r.interest.toFixed(2)),
    Extra: Number(r.extra.toFixed(2)),
    Balance: Number(r.balance.toFixed(2)),
  }));
  const ws2 = XLSX.utils.json_to_sheet(rows);
  ws2['!cols'] = [
    { wch: 10 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, ws2, 'Schedule');

  const filename = `amortization-${loan.bank_name.replace(/\s+/g, '_')}-${loan.loan_number}.xlsx`;
  XLSX.writeFile(wb, filename);
}
