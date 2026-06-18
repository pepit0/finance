-- Run once on the CRM Supabase project (after crm_security.sql; profile_metadata column
-- is ensured here so this file can run before or after crm_marketing_ingest_bridge.sql).
-- 1) Preserves explicit created_by_email on system-ingested customers (marketing webhook).
-- 2) Backfills existing website leads to "System - Website app".

alter table public.crm_customers
  add column if not exists profile_metadata jsonb;

create or replace function public.crm_customers_set_creator_snapshot_and_assign()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  em text;
  explicit_system_email text := nullif(trim(coalesce(new.created_by_email, '')), '');
begin
  if new.created_by is null and explicit_system_email is not null then
    -- Ingest / service role sets created_by_email (e.g. System - Website app); do not overwrite from JWT.
    null;
  else
    em := nullif(trim(coalesce(auth.jwt() ->> 'email', '')), '');
    if em is null and new.created_by is not null then
      em := nullif(
        trim((select u.email from auth.users u where u.id = new.created_by limit 1)),
        ''
      );
    end if;
    new.created_by_email := em;
  end if;

  if new.assigned_to is null and new.created_by is not null then
    new.assigned_to := new.created_by;
    new.assigned_to_email := coalesce(
      nullif(trim(coalesce(new.assigned_to_email, '')), ''),
      new.created_by_email
    );
  end if;
  return new;
end;
$$;

update public.crm_customers
set
  created_by_email = 'System - Website app',
  profile_metadata = coalesce(profile_metadata, '{}'::jsonb)
    || jsonb_build_object('creator_display', 'System - Website app')
where created_by is null
  and (profile_metadata ->> 'source') = 'marketing'
  and coalesce(created_by_email, '') <> 'System - Website app';

notify pgrst, 'reload schema';
