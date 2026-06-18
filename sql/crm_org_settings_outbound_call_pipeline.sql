-- Auto-assign pipeline stage when a CRM user places an outbound Twilio call.
-- Run once after sql/crm_org_settings.sql and sql/crm_pipeline_stages.sql.

alter table public.crm_org_settings
  add column if not exists outbound_call_pipeline_stage_enabled boolean not null default false,
  add column if not exists outbound_call_pipeline_stage text;

notify pgrst, 'reload schema';
