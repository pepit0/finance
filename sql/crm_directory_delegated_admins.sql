-- Run once in Supabase SQL Editor for existing CRM databases.
-- Delegated directory admins (team display names + remove CRM calls/comments/texts).
-- Master email + admin helpers: sql/crm_user_directory_positions.sql, sql/crm_position_permissions.sql,
-- and sql/crm_directory_set_master_email.sql (run last on fresh installs).

create table if not exists public.crm_directory_admins (
  email text primary key check (length(trim(lower(email))) > 0),
  created_at timestamptz not null default now()
);

create index if not exists crm_directory_admins_email_lower_idx on public.crm_directory_admins (lower(trim(email)));

-- Do not replace crm_user_directory_master() or crm_user_directory_admin() here — later migrations
-- (positions, permissions) define those; redefining with CHANGE_ME breaks fresh playground bundles.

alter table public.crm_directory_admins enable row level security;

revoke all on table public.crm_directory_admins from public;
revoke all on table public.crm_directory_admins from anon, authenticated;

drop policy if exists crm_directory_admins_select on public.crm_directory_admins;
drop policy if exists crm_directory_admins_insert on public.crm_directory_admins;
drop policy if exists crm_directory_admins_delete on public.crm_directory_admins;

create policy crm_directory_admins_select on public.crm_directory_admins
  for select to authenticated
  using (
    public.user_has_crm_access()
    and (
      public.crm_user_directory_master()
      or lower(trim(email)) = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
    )
  );

create policy crm_directory_admins_insert on public.crm_directory_admins
  for insert to authenticated
  with check (
    public.user_has_crm_access()
    and public.crm_user_directory_master()
    and lower(trim(email)) <> lower(trim(coalesce(auth.jwt() ->> 'email', '')))
  );

create policy crm_directory_admins_delete on public.crm_directory_admins
  for delete to authenticated
  using (public.user_has_crm_access() and public.crm_user_directory_master());

grant select, insert, delete on public.crm_directory_admins to authenticated;

notify pgrst, 'reload schema';
