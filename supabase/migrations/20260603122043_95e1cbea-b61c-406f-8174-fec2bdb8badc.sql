CREATE TABLE public.loans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bank_name TEXT NOT NULL,
  loan_number TEXT NOT NULL,
  purpose TEXT,
  borrowed_amount NUMERIC(18,2) NOT NULL CHECK (borrowed_amount > 0),
  interest_rate NUMERIC(6,3) NOT NULL CHECK (interest_rate >= 0 AND interest_rate <= 100),
  tenure_months INTEGER NOT NULL CHECK (tenure_months > 0 AND tenure_months <= 600),
  start_date DATE NOT NULL,
  balloon_date DATE,
  balloon_amount NUMERIC(18,2),
  extra_payment NUMERIC(18,2) DEFAULT 0,
  emi_type TEXT NOT NULL DEFAULT 'standard',
  loan_status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.loans TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.loans TO authenticated;
GRANT ALL ON public.loans TO service_role;

ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read loans" ON public.loans FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public insert loans" ON public.loans FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public update loans" ON public.loans FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public delete loans" ON public.loans FOR DELETE TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION public.tg_loans_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER loans_updated_at BEFORE UPDATE ON public.loans
FOR EACH ROW EXECUTE FUNCTION public.tg_loans_updated_at();

CREATE INDEX idx_loans_created_at ON public.loans (created_at DESC);
CREATE INDEX idx_loans_status ON public.loans (loan_status);