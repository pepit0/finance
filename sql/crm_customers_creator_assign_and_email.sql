-- Run once in Supabase SQL Editor for existing CRM databases.
-- Adds created_by_email snapshot, auto-assigns creator when assigned_to is null, locks creator fields on update.
-- Backfills created_by_email and assigns previously unassigned rows to created_by where applicable.

alter table public.crm_customers add column if not exists created_by_email text;

create or replace function public.crm_customers_set_creator_snapshot_and_assign()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  em text;
begin
  em := nullif(trim(coalesce(auth.jwt() ->> 'email', '')), '');
  if em is null then
    em := nullif(
      trim((select u.email from auth.users u where u.id = new.created_by limit 1)),
      ''
    );
  end if;
  new.created_by_email := em;

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

drop trigger if exists crm_customers_set_creator_snapshot_and_assign on public.crm_customers;
create trigger crm_customers_set_creator_snapshot_and_assign
  before insert on public.crm_customers
  for each row
  execute function public.crm_customers_set_creator_snapshot_and_assign();

create or replace function public.crm_customers_protect_creator()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if tg_op <> 'UPDATE' then
    return new;
  end if;
  if new.created_by is distinct from old.created_by then
    raise exception 'created_by cannot be changed';
  end if;
  if old.created_by_email is not null and new.created_by_email is distinct from old.created_by_email then
    raise exception 'created_by_email cannot be changed';
  end if;
  return new;
end;
$$;

drop trigger if exists crm_customers_protect_creator on public.crm_customers;
create trigger crm_customers_protect_creator
  before update on public.crm_customers
  for each row
  execute function public.crm_customers_protect_creator();

update public.crm_customers c
set created_by_email = nullif(trim(u.email), '')
from auth.users u
where c.created_by = u.id
  and (c.created_by_email is null or trim(c.created_by_email) = '');

update public.crm_customers c
set
  assigned_to = c.created_by,
  assigned_to_email = coalesce(
    nullif(trim(c.created_by_email), ''),
    nullif(trim(u.email), '')
  )
from auth.users u
where c.created_by = u.id
  and c.assigned_to is null
  and c.created_by is not null;

notify pgrst, 'reload schema';
