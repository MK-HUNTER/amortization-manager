import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const loanInputSchema = z.object({
  bank_name: z.string().trim().min(1).max(120),
  loan_number: z.string().trim().min(1).max(60),
  purpose: z.string().trim().max(200).nullable().optional(),
  borrowed_amount: z.number().positive().max(1_000_000_000),
  interest_rate: z.number().min(0).max(100),
  tenure_months: z.number().int().min(1).max(600),
  start_date: z.string().min(1),
  balloon_date: z.string().nullable().optional(),
  balloon_amount: z.number().min(0).nullable().optional(),
  extra_payment: z.number().min(0).nullable().optional(),
  emi_type: z.string().default("standard"),
  loan_status: z.string().default("active"),
});

export const listLoans = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("loans")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return { loans: data ?? [] };
});

export const getLoan = createServerFn({ method: "GET" })
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("loans")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);

    const { data: extraPayments, error: extraErr } = await supabaseAdmin
      .from("loan_extra_payments")
      .select("*")
      .eq("loan_id", data.id)
      .order("payment_no", { ascending: true });
    if (extraErr) throw new Error(extraErr.message);

    return { loan: row, extraPayments: extraPayments ?? [] };
  });

export const createLoan = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => loanInputSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (data.balloon_date) {
      const { generateSchedule } = await import("@/lib/loans/amortization");
      const summary = generateSchedule({
        borrowedAmount: data.borrowed_amount,
        interestRate: data.interest_rate,
        tenureMonths: data.tenure_months,
        startDate: data.start_date,
        extraPayment: data.extra_payment ?? 0,
        balloonDate: data.balloon_date,
      });
      data.balloon_amount = summary.balloonAmount;
    } else {
      data.balloon_amount = null;
    }

    const { data: row, error } = await supabaseAdmin
      .from("loans")
      .insert(data)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return { loan: row };
  });

export const updateLoan = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), patch: loanInputSchema.partial() }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from("loans")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();

    if (fetchErr) throw new Error(fetchErr.message);
    if (!existing) throw new Error("Loan not found");

    const merged = {
      borrowed_amount:
        data.patch.borrowed_amount !== undefined
          ? data.patch.borrowed_amount
          : Number(existing.borrowed_amount),
      interest_rate:
        data.patch.interest_rate !== undefined
          ? data.patch.interest_rate
          : Number(existing.interest_rate),
      tenure_months:
        data.patch.tenure_months !== undefined
          ? data.patch.tenure_months
          : Number(existing.tenure_months),
      start_date: data.patch.start_date !== undefined ? data.patch.start_date : existing.start_date,
      extra_payment:
        data.patch.extra_payment !== undefined
          ? data.patch.extra_payment
          : Number(existing.extra_payment ?? 0),
      balloon_date:
        data.patch.balloon_date !== undefined ? data.patch.balloon_date : existing.balloon_date,
    };

    let calculatedBalloonAmount: number | null = null;
    if (merged.balloon_date) {
      const { data: extraPayments, error: extraErr } = await supabaseAdmin
        .from("loan_extra_payments")
        .select("*")
        .eq("loan_id", data.id);
      if (extraErr) throw new Error(extraErr.message);

      const customExtraPaymentsRecord: Record<number, number> = {};
      for (const ep of extraPayments ?? []) {
        customExtraPaymentsRecord[ep.payment_no] = Number(ep.amount);
      }

      const { generateSchedule } = await import("@/lib/loans/amortization");
      const summary = generateSchedule({
        borrowedAmount: merged.borrowed_amount,
        interestRate: merged.interest_rate,
        tenureMonths: merged.tenure_months,
        startDate: merged.start_date,
        extraPayment: merged.extra_payment ?? 0,
        balloonDate: merged.balloon_date,
        customExtraPayments: customExtraPaymentsRecord,
      });
      calculatedBalloonAmount = summary.balloonAmount ?? null;
    }

    const finalPatch = {
      ...data.patch,
      balloon_amount: calculatedBalloonAmount,
    };

    const { data: row, error } = await supabaseAdmin
      .from("loans")
      .update(finalPatch)
      .eq("id", data.id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return { loan: row };
  });

export const deleteLoan = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("loans").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const saveCustomExtraPayment = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        loanId: z.string().uuid(),
        paymentNo: z.number().int().positive(),
        amount: z.number().min(0),
        comment: z.string().trim().max(500).nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Fetch loan details first
    const { data: loan, error: fetchErr } = await supabaseAdmin
      .from("loans")
      .select("*")
      .eq("id", data.loanId)
      .maybeSingle();
    if (fetchErr) throw new Error(fetchErr.message);
    if (!loan) throw new Error("Loan not found");

    if (data.amount <= 0) {
      const { error } = await supabaseAdmin
        .from("loan_extra_payments")
        .delete()
        .eq("loan_id", data.loanId)
        .eq("payment_no", data.paymentNo);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin.from("loan_extra_payments").upsert(
        {
          loan_id: data.loanId,
          payment_no: data.paymentNo,
          amount: data.amount,
          comment: data.comment || null,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "loan_id,payment_no",
        },
      );
      if (error) throw new Error(error.message);
    }

    // Recalculate balloon amount if the loan has a balloon date
    if (loan.balloon_date) {
      const { data: extraPayments, error: extraErr } = await supabaseAdmin
        .from("loan_extra_payments")
        .select("*")
        .eq("loan_id", data.loanId);
      if (extraErr) throw new Error(extraErr.message);

      const customExtraPaymentsRecord: Record<number, number> = {};
      for (const ep of extraPayments ?? []) {
        customExtraPaymentsRecord[ep.payment_no] = Number(ep.amount);
      }

      const { generateSchedule } = await import("@/lib/loans/amortization");
      const summary = generateSchedule({
        borrowedAmount: Number(loan.borrowed_amount),
        interestRate: Number(loan.interest_rate),
        tenureMonths: Number(loan.tenure_months),
        startDate: loan.start_date,
        extraPayment: Number(loan.extra_payment ?? 0),
        balloonDate: loan.balloon_date,
        customExtraPayments: customExtraPaymentsRecord,
      });

      const { error: updateErr } = await supabaseAdmin
        .from("loans")
        .update({ balloon_amount: summary.balloonAmount })
        .eq("id", data.loanId);
      if (updateErr) throw new Error(updateErr.message);
    }

    return { ok: true };
  });
