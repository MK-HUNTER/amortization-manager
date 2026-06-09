-- Migration to add comment column to loan_extra_payments
ALTER TABLE public.loan_extra_payments ADD COLUMN comment TEXT;
