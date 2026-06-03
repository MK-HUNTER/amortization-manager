/**
 * Loan Amortization Engine — pure business logic, framework-agnostic.
 * Safe to use on both client (for live preview) and server.
 */
import { addMonths, formatISO } from 'date-fns';

export interface LoanInput {
  borrowedAmount: number;
  interestRate: number; // annual percent (e.g. 8.5)
  tenureMonths: number;
  startDate: string; // YYYY-MM-DD
  extraPayment?: number;
  balloonDate?: string | null;
  balloonAmount?: number | null;
}

export interface PaymentRow {
  paymentNo: number;
  date: string; // YYYY-MM-DD
  emi: number;
  principal: number;
  interest: number;
  extra: number;
  balance: number;
}

export interface ScheduleSummary {
  emi: number;
  totalInterest: number;
  totalPayment: number;
  payoffMonths: number;
  payoffDate: string;
  schedule: PaymentRow[];
}

const round = (n: number) => Math.round(n * 100) / 100;

export function calculateEmi(principal: number, annualRate: number, tenureMonths: number): number {
  if (principal <= 0 || tenureMonths <= 0) return 0;
  const r = annualRate / 12 / 100;
  if (r === 0) return principal / tenureMonths;
  const pow = Math.pow(1 + r, tenureMonths);
  return (principal * r * pow) / (pow - 1);
}

export function generateSchedule(input: LoanInput): ScheduleSummary {
  const {
    borrowedAmount,
    interestRate,
    tenureMonths,
    startDate,
    extraPayment = 0,
    balloonDate = null,
    balloonAmount = null,
  } = input;

  const monthlyRate = interestRate / 12 / 100;
  const baseEmi = calculateEmi(borrowedAmount, interestRate, tenureMonths);

  const start = new Date(startDate);
  const schedule: PaymentRow[] = [];

  let balance = borrowedAmount;
  let totalInterest = 0;
  let totalPayment = 0;
  let month = 1;
  const safetyCap = Math.max(tenureMonths * 2, 720);

  while (balance > 0.5 && month <= safetyCap) {
    const date = formatISO(addMonths(start, month - 1), { representation: 'date' });
    const interest = balance * monthlyRate;
    let principal = Math.min(baseEmi - interest, balance);
    if (principal < 0) principal = 0;

    let extra = 0;
    if (extraPayment > 0) {
      extra = Math.min(extraPayment, balance - principal);
      if (extra < 0) extra = 0;
    }

    let balloon = 0;
    if (balloonDate && balloonAmount && date >= balloonDate) {
      // Apply balloon once on first qualifying month
      const alreadyApplied = schedule.some((r) => r.date >= balloonDate && (r as PaymentRow).extra >= balloonAmount);
      if (!alreadyApplied) {
        balloon = Math.min(balloonAmount, balance - principal - extra);
        if (balloon < 0) balloon = 0;
      }
    }

    const emiPaid = principal + interest;
    balance = balance - principal - extra - balloon;
    totalInterest += interest;
    totalPayment += emiPaid + extra + balloon;

    schedule.push({
      paymentNo: month,
      date,
      emi: round(emiPaid),
      principal: round(principal),
      interest: round(interest),
      extra: round(extra + balloon),
      balance: round(Math.max(balance, 0)),
    });

    month += 1;
    if (balance < 0.5) break;
  }

  return {
    emi: round(baseEmi),
    totalInterest: round(totalInterest),
    totalPayment: round(totalPayment),
    payoffMonths: schedule.length,
    payoffDate: schedule.at(-1)?.date ?? startDate,
    schedule,
  };
}
