-- Allow adding/removing CRM lenders dynamically. Run once after sql/crm_lenders.sql and sql/crm_customer_lender_outcomes.sql.

alter table public.crm_lenders
  drop constraint if exists crm_lenders_slug_check;

alter table public.crm_lenders
  add constraint crm_lenders_slug_check
  check (slug ~ '^[a-z][a-z0-9_]{0,47}$');

alter table public.crm_customer_lender_outcomes
  drop constraint if exists crm_customer_lender_outcomes_slug_check;

alter table public.crm_customer_lender_outcomes
  drop constraint if exists crm_customer_lender_outcomes_lender_slug_fkey;

alter table public.crm_customer_lender_outcomes
  add constraint crm_customer_lender_outcomes_lender_slug_fkey
  foreign key (lender_slug)
  references public.crm_lenders (slug)
  on update cascade
  on delete cascade;

notify pgrst, 'reload schema';
