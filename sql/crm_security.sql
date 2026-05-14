-- CRM access control (run once in Supabase SQL Editor as postgres).
-- 1) Defines user_has_crm_access() used by RLS and the app RPC.
-- 2) Optional email allowlist (no Dashboard JSON needed): INSERT INTO public.crm_access_allowlist (email) VALUES ('you@company.com');
-- 3) Starter CRM tables with RLS (customers + activities for calls/comments).

-- Optional allowlist: not readable via Data API (no SELECT grants to anon/authenticated).
create table if not exists public.crm_access_allowlist (
  email text primary key check (length(trim(email)) > 0)
);

alter table public.crm_access_allowlist enable row level security;

revoke all on table public.crm_access_allowlist from public;
revoke all on table public.crm_access_allowlist from anon, authenticated;

-- True if JWT grants CRM, or email is allowlisted (checked only inside this definer).
-- Handles roles as json array, json string, crm_access as boolean or string (Dashboard / SQL vary).
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

-- --- CRM data (RLS enforced; anon has no access) ---

create table if not exists public.crm_customers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  created_by uuid not null default auth.uid() references auth.users (id) on delete restrict,
  display_name text not null,
  email text,
  phone text,
  secondary_phone text,
  date_of_birth date,
  status text not null default 'active' check (status in ('active', 'lost')),
  lost_at timestamptz,
  last_call_at timestamptz,
  assigned_to uuid references auth.users (id) on delete set null,
  assigned_to_email text,
  created_by_email text
);

create table if not exists public.crm_activities (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  customer_id uuid not null references public.crm_customers (id) on delete cascade,
  author_id uuid not null default auth.uid() references auth.users (id) on delete restrict,
  author_email text,
  kind text not null check (kind in ('call', 'comment', 'text')),
  body text not null check (length(trim(body)) > 0)
);

create index if not exists crm_activities_customer_id_idx on public.crm_activities (customer_id);
create index if not exists crm_customers_status_idx on public.crm_customers (status);

alter table public.crm_customers enable row level security;
alter table public.crm_activities enable row level security;

drop policy if exists crm_customers_select on public.crm_customers;
drop policy if exists crm_customers_insert on public.crm_customers;
drop policy if exists crm_customers_update on public.crm_customers;
drop policy if exists crm_customers_delete on public.crm_customers;

create policy crm_customers_select on public.crm_customers
  for select to authenticated
  using (public.user_has_crm_access());

create policy crm_customers_insert on public.crm_customers
  for insert to authenticated
  with check (public.user_has_crm_access() and created_by = auth.uid());

create policy crm_customers_update on public.crm_customers
  for update to authenticated
  using (public.user_has_crm_access())
  with check (public.user_has_crm_access());

create policy crm_customers_delete on public.crm_customers
  for delete to authenticated
  using (public.user_has_crm_access() and created_by = auth.uid());

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

drop policy if exists crm_activities_select on public.crm_activities;
drop policy if exists crm_activities_insert on public.crm_activities;
drop policy if exists crm_activities_update on public.crm_activities;
drop policy if exists crm_activities_delete on public.crm_activities;

create policy crm_activities_select on public.crm_activities
  for select to authenticated
  using (public.user_has_crm_access());

create policy crm_activities_insert on public.crm_activities
  for insert to authenticated
  with check (
    public.user_has_crm_access()
    and author_id = auth.uid()
    and exists (select 1 from public.crm_customers c where c.id = customer_id)
  );

create policy crm_activities_update on public.crm_activities
  for update to authenticated
  using (public.user_has_crm_access() and author_id = auth.uid())
  with check (public.user_has_crm_access() and author_id = auth.uid());

grant select, insert, update, delete on public.crm_customers to authenticated;
grant select, insert, update, delete on public.crm_activities to authenticated;

create table if not exists public.crm_directory_admins (
  email text primary key check (length(trim(lower(email))) > 0),
  created_at timestamptz not null default now()
);

create index if not exists crm_directory_admins_email_lower_idx on public.crm_directory_admins (lower(trim(email)));

create or replace function public.crm_user_directory_master()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select lower(trim(coalesce(auth.jwt() ->> 'email', ''))) = lower('danielsharifian@gmail.com');
$$;

grant execute on function public.crm_user_directory_master() to authenticated;

create or replace function public.crm_user_directory_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.crm_user_directory_master()
    or exists (
      select 1
      from public.crm_directory_admins a
      where lower(trim(a.email)) = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
    );
$$;

grant execute on function public.crm_user_directory_admin() to authenticated;

-- Activity delete: authors may remove their own rows; directory admins may remove calls or comments (moderation).
drop policy if exists crm_activities_delete on public.crm_activities;

create policy crm_activities_delete on public.crm_activities
  for delete to authenticated
  using (
    public.user_has_crm_access()
    and (
      author_id = auth.uid()
      or public.crm_user_directory_admin()
    )
  );

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
    and lower(trim(email)) <> lower('danielsharifian@gmail.com')
  );

create policy crm_directory_admins_delete on public.crm_directory_admins
  for delete to authenticated
  using (public.user_has_crm_access() and public.crm_user_directory_master());

grant select, insert, delete on public.crm_directory_admins to authenticated;

create table if not exists public.crm_user_directory (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null check (length(trim(email)) > 0),
  updated_at timestamptz not null default now(),
  display_name text
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
  using (
    public.user_has_crm_access()
    and (user_id = auth.uid() or public.crm_user_directory_admin())
  )
  with check (
    public.user_has_crm_access()
    and (user_id = auth.uid() or public.crm_user_directory_admin())
  );

create policy crm_user_directory_delete on public.crm_user_directory
  for delete to authenticated
  using (public.user_has_crm_access() and user_id = auth.uid());

grant select, insert, update, delete on public.crm_user_directory to authenticated;

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

create or replace function public.crm_activities_touch_last_call()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.kind = 'call' then
    update public.crm_customers
    set last_call_at = case
      when last_call_at is null or NEW.created_at > last_call_at then NEW.created_at
      else last_call_at
    end
    where id = NEW.customer_id;
  end if;
  return NEW;
end;
$$;

drop trigger if exists crm_activities_touch_last_call on public.crm_activities;
create trigger crm_activities_touch_last_call
  after insert on public.crm_activities
  for each row
  execute function public.crm_activities_touch_last_call();
