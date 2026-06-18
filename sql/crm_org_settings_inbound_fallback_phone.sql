-- Inbound Twilio fallback when assignee is unknown or has no callback phone.
-- Run once after sql/crm_org_settings.sql.

alter table public.crm_org_settings
  add column if not exists inbound_fallback_callback_phone text,
  add column if not exists twilio_recording_disclosure_enabled boolean not null default true,
  add column if not exists twilio_recording_disclosure_text text not null default
    'This call may be recorded for quality and training purposes.';

notify pgrst, 'reload schema';
