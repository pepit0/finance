-- Quick fix when website leads stop appearing after enabling auto-comments.
-- Run on CRM Supabase (postgres). Then redeploy Edge Function if you updated index.ts.

alter table public.crm_activities
  alter column author_id drop not null;

-- Updates ingest RPC: comment failure no longer rolls back the whole lead.
-- Re-run the full file (safe):
--   sql/crm_marketing_ingest_bridge.sql

notify pgrst, 'reload schema';
