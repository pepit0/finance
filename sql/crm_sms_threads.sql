-- SMS thread summaries for the CRM Chat tab. Run once after sql/crm_activities_twilio_sms.sql.

create table if not exists public.crm_sms_threads (
  customer_id uuid primary key references public.crm_customers (id) on delete cascade,
  last_message_at timestamptz not null default now(),
  last_message_preview text not null default '',
  last_message_direction text not null
    check (last_message_direction in ('inbound', 'outbound')),
  last_activity_id uuid references public.crm_activities (id) on delete set null,
  assigned_to uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now()
);

create index if not exists crm_sms_threads_assigned_last_idx
  on public.crm_sms_threads (assigned_to, last_message_at desc);

create index if not exists crm_sms_threads_last_message_at_idx
  on public.crm_sms_threads (last_message_at desc);

alter table public.crm_sms_threads enable row level security;

revoke all on table public.crm_sms_threads from public, anon;
grant select on table public.crm_sms_threads to authenticated;

drop policy if exists crm_sms_threads_select on public.crm_sms_threads;

create policy crm_sms_threads_select on public.crm_sms_threads
  for select to authenticated
  using (public.user_has_crm_access());

notify pgrst, 'reload schema';
