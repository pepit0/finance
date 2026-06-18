-- Dial leg CallSid for Twilio <Dial record> callbacks (child call, distinct from parent agent leg).
-- Run once after sql/crm_phone_call_sessions.sql.

alter table public.crm_phone_call_sessions
  add column if not exists twilio_dial_call_sid text;

create index if not exists crm_phone_call_sessions_twilio_dial_call_sid_idx
  on public.crm_phone_call_sessions (twilio_dial_call_sid)
  where twilio_dial_call_sid is not null;

notify pgrst, 'reload schema';
