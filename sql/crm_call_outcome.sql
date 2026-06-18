-- Call outcome metadata (bridge / leg status). Run once after crm_phone_call_sessions.sql + crm_activities_twilio_calls.sql.

alter table public.crm_phone_call_sessions
  add column if not exists parent_call_status text,
  add column if not exists dial_call_status text,
  add column if not exists agent_answered boolean not null default false,
  add column if not exists bridge_connected boolean not null default false,
  add column if not exists parent_call_duration_seconds integer
    check (parent_call_duration_seconds is null or parent_call_duration_seconds >= 0);

alter table public.crm_activities
  add column if not exists call_session_status text,
  add column if not exists call_parent_status text,
  add column if not exists call_dial_status text,
  add column if not exists call_agent_answered boolean,
  add column if not exists call_bridge_connected boolean,
  add column if not exists call_failure_reason text,
  add column if not exists call_parent_duration_seconds integer
    check (call_parent_duration_seconds is null or call_parent_duration_seconds >= 0);

notify pgrst, 'reload schema';
