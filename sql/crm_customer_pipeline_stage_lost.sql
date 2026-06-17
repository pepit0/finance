-- Run once on the CRM Supabase project (SQL Editor, as postgres).
-- Requires: sql/crm_customer_pipeline_stage.sql

alter table public.crm_customers drop constraint if exists crm_customers_pipeline_stage_check;

alter table public.crm_customers
  add constraint crm_customers_pipeline_stage_check check (
    pipeline_stage in (
      'fresh_lead',
      'contacted',
      'no_contact',
      'apped',
      'pending_fi',
      'sold',
      'lost'
    )
  );

update public.crm_customers
set pipeline_stage = 'lost'
where status = 'lost'
  and pipeline_stage <> 'lost';

notify pgrst, 'reload schema';
