-- Daily to-do agenda (run once on CRM Supabase as postgres).
-- Requires: sql/crm_security.sql, sql/crm_directory_delegated_admins.sql (crm_user_directory_admin).
-- After first install, run sql/crm_todo_daily_team_access.sql if upgrading from admin-only policies.
-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.crm_todo_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  task_date date not null,
  title text not null,
  sort_order integer not null default 0,
  is_default boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint crm_todo_items_title_nonempty check (length(trim(title)) > 0)
);

create unique index if not exists crm_todo_items_user_date_title_idx
  on public.crm_todo_items (user_id, task_date, lower(trim(title)));

create index if not exists crm_todo_items_user_date_idx
  on public.crm_todo_items (user_id, task_date, sort_order, created_at);

create table if not exists public.crm_todo_daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  log_date date not null,
  archived_at timestamptz not null default now(),
  items jsonb not null default '[]'::jsonb
);

create unique index if not exists crm_todo_daily_logs_user_date_idx
  on public.crm_todo_daily_logs (user_id, log_date);

create index if not exists crm_todo_daily_logs_user_archived_idx
  on public.crm_todo_daily_logs (user_id, archived_at desc);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.crm_todo_items enable row level security;
alter table public.crm_todo_daily_logs enable row level security;

revoke all on table public.crm_todo_items from public;
revoke all on table public.crm_todo_daily_logs from public;
revoke all on table public.crm_todo_items from anon;
revoke all on table public.crm_todo_daily_logs from anon;

drop policy if exists crm_todo_items_select on public.crm_todo_items;
drop policy if exists crm_todo_items_insert on public.crm_todo_items;
drop policy if exists crm_todo_items_update on public.crm_todo_items;
drop policy if exists crm_todo_items_delete on public.crm_todo_items;
drop policy if exists crm_todo_daily_logs_select on public.crm_todo_daily_logs;

create policy crm_todo_items_select on public.crm_todo_items
  for select to authenticated
  using (public.user_has_crm_access());

create policy crm_todo_items_insert on public.crm_todo_items
  for insert to authenticated
  with check (
    public.user_has_crm_access()
    and is_default = false
    and (
      user_id = auth.uid()
      or public.crm_user_directory_admin()
    )
  );

create policy crm_todo_items_update on public.crm_todo_items
  for update to authenticated
  using (
    public.user_has_crm_access()
    and (
      user_id = auth.uid()
      or public.crm_user_directory_admin()
    )
  )
  with check (
    public.user_has_crm_access()
    and (
      user_id = auth.uid()
      or public.crm_user_directory_admin()
    )
  );

create policy crm_todo_items_delete on public.crm_todo_items
  for delete to authenticated
  using (
    public.user_has_crm_access()
    and is_default = false
    and (
      user_id = auth.uid()
      or public.crm_user_directory_admin()
    )
  );

create policy crm_todo_daily_logs_select on public.crm_todo_daily_logs
  for select to authenticated
  using (public.user_has_crm_access());

grant select, insert, update, delete on public.crm_todo_items to authenticated;
grant select on public.crm_todo_daily_logs to authenticated;

-- ---------------------------------------------------------------------------
-- Resolve target user (self, or another user when directory admin)
-- ---------------------------------------------------------------------------

create or replace function public.crm_todo_target_user_id(p_user_id uuid)
returns uuid
language plpgsql
stable
security definer
set search_path = public, auth
as $$
declare
  v_caller uuid := auth.uid();
begin
  if v_caller is null then
    raise exception 'Not authenticated';
  end if;

  if not public.user_has_crm_access() then
    raise exception 'CRM access required';
  end if;

  if p_user_id is not null and p_user_id <> v_caller then
    if not public.crm_user_directory_admin() then
      raise exception 'Cannot access another user''s to-do';
    end if;
    return p_user_id;
  end if;

  return v_caller;
end;
$$;

revoke all on function public.crm_todo_target_user_id(uuid) from public;
grant execute on function public.crm_todo_target_user_id(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Archive yesterday / end-of-day log
-- ---------------------------------------------------------------------------

create or replace function public.archive_crm_todo_day(p_log_date date, p_user_id uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid;
  v_items jsonb;
begin
  v_user_id := public.crm_todo_target_user_id(p_user_id);

  if p_log_date is null then
    raise exception 'p_log_date is required';
  end if;

  if exists (
    select 1
    from public.crm_todo_daily_logs l
    where l.user_id = v_user_id
      and l.log_date = p_log_date
  ) then
    return jsonb_build_object('ok', true, 'already_archived', true);
  end if;

  if not exists (
    select 1
    from public.crm_todo_items i
    where i.user_id = v_user_id
      and i.task_date = p_log_date
  ) then
    return jsonb_build_object('ok', true, 'skipped', true, 'reason', 'no_items');
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'title', i.title,
        'is_default', i.is_default,
        'completed', i.completed_at is not null,
        'completed_at', i.completed_at
      )
      order by i.sort_order, i.created_at
    ),
    '[]'::jsonb
  )
  into v_items
  from public.crm_todo_items i
  where i.user_id = v_user_id
    and i.task_date = p_log_date;

  insert into public.crm_todo_daily_logs (user_id, log_date, items)
  values (v_user_id, p_log_date, v_items);

  return jsonb_build_object('ok', true, 'archived', true, 'item_count', jsonb_array_length(v_items));
end;
$$;

revoke all on function public.archive_crm_todo_day(date, uuid) from public;
grant execute on function public.archive_crm_todo_day(date, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Default task templates (see sql/crm_todo_default_templates.sql for upgrades)
-- ---------------------------------------------------------------------------

create table if not exists public.crm_todo_default_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint crm_todo_default_templates_title_nonempty check (length(trim(title)) > 0)
);

create unique index if not exists crm_todo_default_templates_user_title_idx
  on public.crm_todo_default_templates (user_id, lower(trim(title)));

create index if not exists crm_todo_default_templates_user_sort_idx
  on public.crm_todo_default_templates (user_id, sort_order, created_at);

alter table public.crm_todo_default_templates enable row level security;

revoke all on table public.crm_todo_default_templates from public;
revoke all on table public.crm_todo_default_templates from anon;

drop policy if exists crm_todo_default_templates_select on public.crm_todo_default_templates;
drop policy if exists crm_todo_default_templates_insert on public.crm_todo_default_templates;
drop policy if exists crm_todo_default_templates_update on public.crm_todo_default_templates;
drop policy if exists crm_todo_default_templates_delete on public.crm_todo_default_templates;

create policy crm_todo_default_templates_select on public.crm_todo_default_templates
  for select to authenticated
  using (public.user_has_crm_access());

create policy crm_todo_default_templates_insert on public.crm_todo_default_templates
  for insert to authenticated
  with check (
    public.user_has_crm_access()
    and (
      user_id = auth.uid()
      or public.crm_user_directory_admin()
    )
  );

create policy crm_todo_default_templates_update on public.crm_todo_default_templates
  for update to authenticated
  using (
    public.user_has_crm_access()
    and (
      user_id = auth.uid()
      or public.crm_user_directory_admin()
    )
  )
  with check (
    public.user_has_crm_access()
    and (
      user_id = auth.uid()
      or public.crm_user_directory_admin()
    )
  );

create policy crm_todo_default_templates_delete on public.crm_todo_default_templates
  for delete to authenticated
  using (
    public.user_has_crm_access()
    and (
      user_id = auth.uid()
      or public.crm_user_directory_admin()
    )
  );

grant select, insert, update, delete on public.crm_todo_default_templates to authenticated;

create or replace function public.crm_todo_user_is_directory_master(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from auth.users u
    where u.id = p_user_id
      and lower(trim(coalesce(u.email, ''))) = lower('danielsharifian@gmail.com')
  );
$$;

revoke all on function public.crm_todo_user_is_directory_master(uuid) from public;
grant execute on function public.crm_todo_user_is_directory_master(uuid) to authenticated;

create or replace function public.ensure_crm_todo_default_templates(p_user_id uuid default null)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid;
begin
  v_user_id := public.crm_todo_target_user_id(p_user_id);

  if exists (
    select 1
    from public.crm_todo_default_templates t
    where t.user_id = v_user_id
  ) then
    return;
  end if;

  if not public.crm_todo_user_is_directory_master(v_user_id) then
    return;
  end if;

  insert into public.crm_todo_default_templates (user_id, title, sort_order)
  values
    (v_user_id, 'Post on marketplace accounts', 0),
    (v_user_id, 'Post on kijiji accounts', 1),
    (v_user_id, 'Post on social media''s', 2);
end;
$$;

revoke all on function public.ensure_crm_todo_default_templates(uuid) from public;
grant execute on function public.ensure_crm_todo_default_templates(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Ensure today: archive yesterday if needed, seed defaults, return rows
-- ---------------------------------------------------------------------------

create or replace function public.ensure_crm_todo_day(p_task_date date, p_user_id uuid default null)
returns setof public.crm_todo_items
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid;
  v_yesterday date;
begin
  v_user_id := public.crm_todo_target_user_id(p_user_id);

  if p_task_date is null then
    raise exception 'p_task_date is required';
  end if;

  v_yesterday := p_task_date - 1;
  perform public.archive_crm_todo_day(v_yesterday, v_user_id);
  perform public.ensure_crm_todo_default_templates(v_user_id);

  if not exists (
    select 1
    from public.crm_todo_items i
    where i.user_id = v_user_id
      and i.task_date = p_task_date
  ) then
    insert into public.crm_todo_items (user_id, task_date, title, sort_order, is_default)
    select
      v_user_id,
      p_task_date,
      t.title,
      t.sort_order,
      true
    from public.crm_todo_default_templates t
    where t.user_id = v_user_id
    order by t.sort_order, t.created_at;
  end if;

  return query
  select i.*
  from public.crm_todo_items i
  where i.user_id = v_user_id
    and i.task_date = p_task_date
  order by i.sort_order, i.created_at;
end;
$$;

revoke all on function public.ensure_crm_todo_day(date, uuid) from public;
grant execute on function public.ensure_crm_todo_day(date, uuid) to authenticated;

notify pgrst, 'reload schema';
