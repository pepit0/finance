-- Hotfix: run in Supabase SQL Editor if CRM access RPC was failing or always false.
-- Replaces public.user_has_crm_access() with a version that tolerates different app_metadata shapes.

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

notify pgrst, 'reload schema';
