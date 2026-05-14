-- =============================================================================
-- FIX: "Could not find the function public.user_has_crm_access without
--      parameters in the schema cache"
--
-- In Supabase: SQL Editor → New query → paste this ENTIRE file → Run.
-- Then wait ~10 seconds and try /crm again (or sign out and sign in).
-- =============================================================================

-- 1) Table the function reads (no rows = fine; you add emails later if you want)
create table if not exists public.crm_access_allowlist (
  email text primary key check (length(trim(email)) > 0)
);

alter table public.crm_access_allowlist enable row level security;

revoke all on table public.crm_access_allowlist from public;
revoke all on table public.crm_access_allowlist from anon, authenticated;

-- 2) RPC the app calls: supabase.rpc('user_has_crm_access')
create or replace function public.user_has_crm_access()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  jwt jsonb := auth.jwt();
  am jsonb := coalesce(jwt -> 'app_metadata', '{}'::jsonb);
  roles_val jsonb;
  email_val text := lower(trim(coalesce(jwt ->> 'email', '')));
begin
  if email_val <> '' and exists (select 1 from public.crm_access_allowlist a where lower(a.email) = email_val) then
    return true;
  end if;

  if (am -> 'crm_access') is not null then
    if jsonb_typeof(am -> 'crm_access') = 'boolean' and (am ->> 'crm_access')::boolean then
      return true;
    end if;
    if jsonb_typeof(am -> 'crm_access') = 'string' and lower(trim(am ->> 'crm_access')) in ('true', 't', '1', 'yes') then
      return true;
    end if;
  end if;

  roles_val := am -> 'roles';
  if roles_val is not null then
    if jsonb_typeof(roles_val) = 'array' and roles_val @> '"crm"'::jsonb then
      return true;
    end if;
    if jsonb_typeof(roles_val) = 'string' and roles_val #>> '{}' = 'crm' then
      return true;
    end if;
  end if;

  return false;
end;
$$;

grant execute on function public.user_has_crm_access() to authenticated;
grant execute on function public.user_has_crm_access() to service_role;

-- 3) Force API gateway to see the new function (schema cache)
notify pgrst, 'reload schema';
