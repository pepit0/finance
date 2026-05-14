-- Run once in Supabase SQL Editor for existing CRM databases.
-- Adds display_name to team directory, admin helper, RLS for admin edits, and trigger to lock user_id/email for admins.
-- After this file, run sql/crm_directory_delegated_admins.sql so directory admins include delegated accounts
-- (master danielsharifian@gmail.com + crm_directory_admins rows). That migration replaces crm_user_directory_admin().

alter table public.crm_user_directory add column if not exists display_name text;

create or replace function public.crm_user_directory_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    lower(trim(coalesce(auth.jwt() ->> 'email', ''))) = lower('danielsharifian@gmail.com')
    or lower(trim(coalesce(auth.jwt() -> 'app_metadata' ->> 'crm_directory_admin', ''))) in ('true', 't', '1', 'yes');
$$;

grant execute on function public.crm_user_directory_admin() to authenticated;

drop policy if exists crm_user_directory_update on public.crm_user_directory;

create policy crm_user_directory_update on public.crm_user_directory
  for update to authenticated
  using (
    public.user_has_crm_access()
    and (user_id = auth.uid() or public.crm_user_directory_admin())
  )
  with check (
    public.user_has_crm_access()
    and (user_id = auth.uid() or public.crm_user_directory_admin())
  );

create or replace function public.crm_user_directory_protect_identifiers()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if tg_op <> 'UPDATE' then
    return new;
  end if;
  if public.crm_user_directory_admin() then
    if new.user_id is distinct from old.user_id or new.email is distinct from old.email then
      raise exception 'Directory admin may only change display_name (and updated_at)';
    end if;
    return new;
  end if;
  if new.user_id is distinct from old.user_id then
    raise exception 'Cannot change user_id';
  end if;
  return new;
end;
$$;

drop trigger if exists crm_user_directory_protect_identifiers on public.crm_user_directory;
create trigger crm_user_directory_protect_identifiers
  before update on public.crm_user_directory
  for each row
  execute function public.crm_user_directory_protect_identifiers();

notify pgrst, 'reload schema';
