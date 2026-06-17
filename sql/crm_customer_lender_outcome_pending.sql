-- Run once in Supabase SQL Editor for existing CRM databases.
-- Adds "pending" lender outcome (submitted, awaiting lender decision).

alter table public.crm_customer_lender_outcomes
  drop constraint if exists crm_customer_lender_outcomes_outcome_check;

alter table public.crm_customer_lender_outcomes
  add constraint crm_customer_lender_outcomes_outcome_check
  check (outcome in ('approved', 'conditional', 'declined', 'pending'));

notify pgrst, 'reload schema';
