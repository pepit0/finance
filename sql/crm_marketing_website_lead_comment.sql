-- Run once on the CRM Supabase project (SQL Editor, role: postgres).
-- Use this if crm_marketing_ingest_bridge.sql was applied before website comments were added.

alter table public.crm_activities
  alter column author_id drop not null;

-- Then run the full file sql/crm_marketing_ingest_bridge.sql again (safe to re-run).

notify pgrst, 'reload schema';
