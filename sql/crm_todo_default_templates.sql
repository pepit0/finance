-- Per-user daily to-do templates + Daniel-only marketing defaults seed.
-- Run once on CRM Supabase (postgres) after sql/crm_todo_daily.sql / sql/crm_todo_daily_team_access.sql.

-- ---------------------------------------------------------------------------
-- Default task templates (seeded into each new day)
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

-- Keep in sync with public.crm_user_directory_master() / sql/crm_directory_set_master_email.sql
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

-- Seeds marketing morning defaults for the directory master only (first-time setup).
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
-- Ensure today: use per-user templates instead of global hard-coded defaults
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
