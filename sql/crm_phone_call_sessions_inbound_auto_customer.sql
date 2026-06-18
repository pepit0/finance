-- Tracks call sessions that auto-created a customer from an unknown inbound caller.
-- Run once after sql/crm_phone_call_sessions.sql.

alter table public.crm_phone_call_sessions
  add column if not exists inbound_auto_created_customer boolean not null default false;

notify pgrst, 'reload schema';
