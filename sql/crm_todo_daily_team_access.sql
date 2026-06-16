-- Run once on CRM Supabase (postgres) after sql/crm_todo_daily.sql.
-- Opens daily to-do to all CRM users: everyone can view any user's list;
-- users edit only their own; directory admins may edit any user's list (admin mode in UI).

-- ---------------------------------------------------------------------------
-- RLS: team read, own write (admins may write any row)
-- ---------------------------------------------------------------------------

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
-- Archive / ensure (all CRM users; optional p_user_id for admin)
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

  if not exists (
    select 1
    from public.crm_todo_items i
    where i.user_id = v_user_id
      and i.task_date = p_task_date
  ) then
    insert into public.crm_todo_items (user_id, task_date, title, sort_order, is_default)
    values
      (v_user_id, p_task_date, 'Post on marketplace accounts', 0, true),
      (v_user_id, p_task_date, 'Post on kijiji accounts', 1, true),
      (v_user_id, p_task_date, 'Post on social media''s', 2, true);
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

-- Drop old single-arg overloads if present (signature change).
drop function if exists public.archive_crm_todo_day(date);
drop function if exists public.ensure_crm_todo_day(date);

notify pgrst, 'reload schema';
