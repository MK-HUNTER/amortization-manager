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
    return { loan: row };
  });

export const createLoan = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => loanInputSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
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
    const { data: row, error } = await supabaseAdmin
      .from("loans")
      .update(data.patch)
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
