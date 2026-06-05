import { z } from "zod";

export const loanFormSchema = z.object({
  bank_name: z.string().trim().min(1, "Bank name required").max(120),
  loan_number: z.string().trim().min(1, "Loan number required").max(60),
  purpose: z.string().trim().max(200).optional().or(z.literal("")),
  borrowed_amount: z.coerce.number().positive("Must be positive").max(1_000_000_000),
  interest_rate: z.coerce.number().min(0, "Cannot be negative").max(100, "Max 100%"),
  tenure_months: z.coerce.number().int().min(1).max(600),
  start_date: z.string().min(1, "Start date required"),
  balloon_date: z.string().optional().or(z.literal("")),
  balloon_amount: z.coerce.number().min(0).optional().nullable().or(z.nan()).or(z.literal("")),
  extra_payment: z.coerce.number().min(0).optional().or(z.nan()),
  emi_type: z.enum(["standard", "reducing", "flat"]).default("standard"),
  loan_status: z.enum(["active", "closed", "overdue"]).default("active"),
});

export type LoanFormValues = z.input<typeof loanFormSchema>;
export type LoanFormParsed = z.output<typeof loanFormSchema>;

export interface LoanRow {
  id: string;
  bank_name: string;
  loan_number: string;
  purpose: string | null;
  borrowed_amount: number;
  interest_rate: number;
  tenure_months: number;
  start_date: string;
  balloon_date: string | null;
  balloon_amount: number | null;
  extra_payment: number | null;
  emi_type: string;
  loan_status: string;
  created_at: string;
  updated_at: string;
}

export interface LoanExtraPayment {
  id: string;
  loan_id: string;
  payment_no: number;
  amount: number;
  created_at: string;
  updated_at: string;
}
