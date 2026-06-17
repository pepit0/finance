-- CRM org-wide settings (accent theme color). Run once in Supabase SQL Editor as postgres.
-- Requires: sql/crm_security.sql, sql/crm_user_directory_positions.sql (crm_user_directory_master).

create table if not exists public.crm_org_settings (
  id text primary key default 'default' check (id = 'default'),
  accent_color text not null default '#f05d22'
    check (accent_color ~* '^#[0-9a-f]{6}$'),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

insert into public.crm_org_settings (id, accent_color)
values ('default', '#f05d22')
on conflict (id) do nothing;

alter table public.crm_org_settings enable row level security;

revoke all on table public.crm_org_settings from public;
revoke all on table public.crm_org_settings from anon;

drop policy if exists crm_org_settings_select on public.crm_org_settings;
drop policy if exists crm_org_settings_update on public.crm_org_settings;

create policy crm_org_settings_select on public.crm_org_settings
  for select to authenticated
  using (public.user_has_crm_access());

create policy crm_org_settings_update on public.crm_org_settings
  for update to authenticated
  using (public.crm_user_directory_master())
  with check (public.crm_user_directory_master());

notify pgrst, 'reload schema';
