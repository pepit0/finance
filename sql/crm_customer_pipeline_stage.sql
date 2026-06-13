-- Run once on the CRM Supabase project (SQL Editor, as postgres).
-- Requires: sql/crm_security.sql (crm_customers), sql/crm_customer_edit_history.sql for edit-history source.

alter table public.crm_customers
  add column if not exists pipeline_stage text not null default 'fresh_lead';

alter table public.crm_customers drop constraint if exists crm_customers_pipeline_stage_check;

alter table public.crm_customers
  add constraint crm_customers_pipeline_stage_check check (
    pipeline_stage in (
      'fresh_lead',
      'contacted',
      'no_contact',
      'apped',
      'pending_fi',
      'sold'
    )
  );

create index if not exists crm_customers_status_pipeline_idx
  on public.crm_customers (status, pipeline_stage);

-- Allow pipeline stage in edit history source enum.
alter table public.crm_customer_edit_history
  drop constraint if exists crm_customer_edit_history_source_check;

alter table public.crm_customer_edit_history
  add constraint crm_customer_edit_history_source_check check (
    source in ('created', 'profile', 'credit_app', 'assignment', 'status', 'restore', 'pipeline')
  );

notify pgrst, 'reload schema';
