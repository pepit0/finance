-- Pending/completed Twilio call sessions (webhook correlation). Run once after sql/crm_activities_twilio_calls.sql.

create table if not exists public.crm_phone_call_sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  customer_id uuid references public.crm_customers (id) on delete set null,
  agent_user_id uuid references auth.users (id) on delete set null,
  activity_id uuid references public.crm_activities (id) on delete set null,
  direction text not null check (direction in ('inbound', 'outbound')),
  status text not null default 'initiated'
    check (status in ('initiated', 'ringing', 'in-progress', 'completed', 'failed', 'no-answer', 'busy', 'canceled')),
  twilio_call_sid text,
  call_from text,
  call_to text,
  dial_target_phone text,
  call_duration_seconds integer
    check (call_duration_seconds is null or call_duration_seconds >= 0),
  failure_reason text
);

create index if not exists crm_phone_call_sessions_customer_id_idx
  on public.crm_phone_call_sessions (customer_id);

create index if not exists crm_phone_call_sessions_twilio_call_sid_idx
  on public.crm_phone_call_sessions (twilio_call_sid)
  where twilio_call_sid is not null;

create index if not exists crm_phone_call_sessions_activity_id_idx
  on public.crm_phone_call_sessions (activity_id)
  where activity_id is not null;

alter table public.crm_phone_call_sessions enable row level security;

revoke all on table public.crm_phone_call_sessions from public, anon;

drop policy if exists crm_phone_call_sessions_select on public.crm_phone_call_sessions;

create policy crm_phone_call_sessions_select on public.crm_phone_call_sessions
  for select to authenticated
  using (public.user_has_crm_access());

grant select on table public.crm_phone_call_sessions to authenticated;

notify pgrst, 'reload schema';
