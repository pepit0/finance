-- Optional phone on website leads (run once on the **CRM** Supabase project as postgres).
-- Marketing forms may omit phone; ingest should not reject those submissions.
--
-- After this ALTER, re-run the full sql/crm_marketing_ingest_bridge.sql so
-- ingest_marketing_preapproval_lead accepts missing/blank phone.

alter table public.crm_public_preapproval_leads
  alter column phone drop not null;

notify pgrst, 'reload schema';
