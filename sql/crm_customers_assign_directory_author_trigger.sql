-- Run once in Supabase SQL Editor for existing CRM databases.
-- Adds: customer assignment (assigned_to, assigned_to_email), team directory, and server-side author_email fill on activities.

alter table public.crm_customers add column if not exists assigned_to uuid references auth.users (id) on delete set null;
alter table public.crm_customers add column if not exists assigned_to_email text;

create table if not exists public.crm_user_directory (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null check (length(trim(email)) > 0),
  updated_at timestamptz not null default now()
);

create index if not exists crm_user_directory_email_idx on public.crm_user_directory (lower(email));

alter table public.crm_user_directory enable row level security;

revoke all on table public.crm_user_directory from public;
revoke all on table public.crm_user_directory from anon, authenticated;

drop policy if exists crm_user_directory_select on public.crm_user_directory;
drop policy if exists crm_user_directory_insert on public.crm_user_directory;
drop policy if exists crm_user_directory_update on public.crm_user_directory;
drop policy if exists crm_user_directory_delete on public.crm_user_directory;

create policy crm_user_directory_select on public.crm_user_directory
  for select to authenticated
  using (public.user_has_crm_access());

create policy crm_user_directory_insert on public.crm_user_directory
  for insert to authenticated
  with check (public.user_has_crm_access() and user_id = auth.uid());

create policy crm_user_directory_update on public.crm_user_directory
  for update to authenticated
  using (public.user_has_crm_access() and user_id = auth.uid())
  with check (public.user_has_crm_access() and user_id = auth.uid());

create policy crm_user_directory_delete on public.crm_user_directory
  for delete to authenticated
  using (public.user_has_crm_access() and user_id = auth.uid());

grant select, insert, update, delete on public.crm_user_directory to authenticated;

create or replace function public.crm_activities_fill_author_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.author_email := coalesce(
    nullif(trim(new.author_email), ''),
    (select u.email from auth.users u where u.id = new.author_id limit 1)
  );
  return new;
end;
$$;

drop trigger if exists crm_activities_fill_author_email on public.crm_activities;
create trigger crm_activities_fill_author_email
  before insert on public.crm_activities
  for each row
  execute function public.crm_activities_fill_author_email();

notify pgrst, 'reload schema';
