-- Per-user read cursors for SMS unread counts. Run once after sql/crm_sms_threads.sql.

create table if not exists public.crm_sms_read_cursors (
  user_id uuid not null references auth.users (id) on delete cascade,
  customer_id uuid not null references public.crm_customers (id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (user_id, customer_id)
);

create index if not exists crm_sms_read_cursors_user_idx
  on public.crm_sms_read_cursors (user_id);

alter table public.crm_sms_read_cursors enable row level security;

revoke all on table public.crm_sms_read_cursors from public, anon;
grant select, insert, update on table public.crm_sms_read_cursors to authenticated;

drop policy if exists crm_sms_read_cursors_select on public.crm_sms_read_cursors;
drop policy if exists crm_sms_read_cursors_insert on public.crm_sms_read_cursors;
drop policy if exists crm_sms_read_cursors_update on public.crm_sms_read_cursors;

create policy crm_sms_read_cursors_select on public.crm_sms_read_cursors
  for select to authenticated
  using (user_id = auth.uid() and public.user_has_crm_access());

create policy crm_sms_read_cursors_insert on public.crm_sms_read_cursors
  for insert to authenticated
  with check (user_id = auth.uid() and public.user_has_crm_access());

create policy crm_sms_read_cursors_update on public.crm_sms_read_cursors
  for update to authenticated
  using (user_id = auth.uid() and public.user_has_crm_access())
  with check (user_id = auth.uid() and public.user_has_crm_access());

notify pgrst, 'reload schema';
