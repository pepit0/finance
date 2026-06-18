-- Exact Twilio voice webhook URL used when the outbound call was created (signature validation).
-- Run once after sql/crm_phone_call_sessions.sql.

alter table public.crm_phone_call_sessions
  add column if not exists voice_webhook_url text;

notify pgrst, 'reload schema';
