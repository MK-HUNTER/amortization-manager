CREATE TABLE public.loan_extra_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  payment_no INTEGER NOT NULL CHECK (payment_no > 0),
  amount NUMERIC(18,2) NOT NULL CHECK (amount >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_loan_payment_no UNIQUE (loan_id, payment_no)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.loan_extra_payments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.loan_extra_payments TO authenticated;
GRANT ALL ON public.loan_extra_payments TO service_role;

ALTER TABLE public.loan_extra_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read loan_extra_payments" ON public.loan_extra_payments FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public insert loan_extra_payments" ON public.loan_extra_payments FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public update loan_extra_payments" ON public.loan_extra_payments FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public delete loan_extra_payments" ON public.loan_extra_payments FOR DELETE TO anon, authenticated USING (true);

CREATE TRIGGER loan_extra_payments_updated_at BEFORE UPDATE ON public.loan_extra_payments
FOR EACH ROW EXECUTE FUNCTION public.tg_loans_updated_at();

CREATE INDEX idx_loan_extra_payments_loan_id ON public.loan_extra_payments (loan_id);
