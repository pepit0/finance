-- Customer profile / credit-app edit audit trail (run once on CRM Supabase as postgres).
-- Requires: sql/crm_security.sql, sql/crm_directory_delegated_admins.sql (for restore RPC).

create table if not exists public.crm_customer_edit_history (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  customer_id uuid not null references public.crm_customers (id) on delete cascade,
  author_id uuid references auth.users (id) on delete set null,
  author_email text,
  source text not null check (source in ('created', 'profile', 'credit_app', 'assignment', 'status', 'restore')),
  summary text not null,
  changes jsonb not null default '[]'::jsonb,
  snapshot_before jsonb not null default '{}'::jsonb
);

create index if not exists crm_customer_edit_history_customer_idx
  on public.crm_customer_edit_history (customer_id, created_at desc);

alter table public.crm_customer_edit_history enable row level security;

revoke all on table public.crm_customer_edit_history from public, anon;

grant select, insert on table public.crm_customer_edit_history to authenticated;

drop policy if exists crm_customer_edit_history_select on public.crm_customer_edit_history;
drop policy if exists crm_customer_edit_history_insert on public.crm_customer_edit_history;

create policy crm_customer_edit_history_select on public.crm_customer_edit_history
  for select to authenticated
  using (public.user_has_crm_access());

create policy crm_customer_edit_history_insert on public.crm_customer_edit_history
  for insert to authenticated
  with check (
    public.user_has_crm_access()
    and (author_id is null or author_id = auth.uid())
  );

-- Directory admins may restore a prior snapshot (writes customer row + new history entry).
create or replace function public.restore_crm_customer_edit(p_history_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.crm_customer_edit_history%rowtype;
  v_snap jsonb;
  v_credit jsonb;
  v_meta jsonb;
  v_summary text;
begin
  if not public.user_has_crm_access() then
    return jsonb_build_object('ok', false, 'error', 'CRM access required.');
  end if;

  if not public.crm_user_directory_admin() then
    return jsonb_build_object('ok', false, 'error', 'Directory admin access required to restore.');
  end if;

  select * into v_row
  from public.crm_customer_edit_history
  where id = p_history_id;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'Edit history entry not found.');
  end if;

  v_snap := v_row.snapshot_before;
  if v_snap is null or v_snap = '{}'::jsonb then
    return jsonb_build_object('ok', false, 'error', 'Nothing to restore for this entry.');
  end if;

  v_credit := coalesce(v_snap -> 'credit_application_info', '{}'::jsonb);
  v_meta := coalesce(
    (select c.profile_metadata from public.crm_customers c where c.id = v_row.customer_id),
    '{}'::jsonb
  );
  v_meta := v_meta || jsonb_build_object('credit_application_info', v_credit);

  update public.crm_customers c
  set
    display_name = coalesce(nullif(trim(v_snap ->> 'display_name'), ''), c.display_name),
    phone = case when v_snap ? 'phone' then nullif(trim(v_snap ->> 'phone'), '') else c.phone end,
    secondary_phone = case when v_snap ? 'secondary_phone' then nullif(trim(v_snap ->> 'secondary_phone'), '') else c.secondary_phone end,
    email = case when v_snap ? 'email' then nullif(trim(v_snap ->> 'email'), '') else c.email end,
    date_of_birth = case
      when v_snap ? 'date_of_birth' and nullif(trim(v_snap ->> 'date_of_birth'), '') is not null
        then (v_snap ->> 'date_of_birth')::date
      when v_snap ? 'date_of_birth'
        then null
      else c.date_of_birth
    end,
    assigned_to = case
      when v_snap ? 'assigned_to' and nullif(trim(v_snap ->> 'assigned_to'), '') is not null
        then (v_snap ->> 'assigned_to')::uuid
      when v_snap ? 'assigned_to'
        then null
      else c.assigned_to
    end,
    assigned_to_email = case when v_snap ? 'assigned_to_email' then nullif(trim(v_snap ->> 'assigned_to_email'), '') else c.assigned_to_email end,
    status = coalesce(nullif(trim(v_snap ->> 'status'), ''), c.status),
    lost_at = case
      when v_snap ? 'lost_at' and nullif(trim(v_snap ->> 'lost_at'), '') is not null
        then (v_snap ->> 'lost_at')::timestamptz
      when v_snap ? 'lost_at'
        then null
      else c.lost_at
    end,
    profile_metadata = v_meta
  where c.id = v_row.customer_id;

  v_summary := format(
    'Restored customer data to version before %s edit on %s',
    v_row.source,
    to_char(v_row.created_at at time zone 'UTC', 'YYYY-MM-DD HH24:MI')
  );

  insert into public.crm_customer_edit_history (
    customer_id,
    author_id,
    author_email,
    source,
    summary,
    changes,
    snapshot_before
  )
  values (
    v_row.customer_id,
    auth.uid(),
    nullif(trim(coalesce(auth.jwt() ->> 'email', '')), ''),
    'restore',
    v_summary,
    jsonb_build_array(
      jsonb_build_object(
        'field', 'restore',
        'label', 'Restored from history',
        'old', v_row.summary,
        'new', v_summary
      )
    ),
    v_snap
  );

  return jsonb_build_object('ok', true, 'customer_id', v_row.customer_id::text);
end;
$$;

revoke all on function public.restore_crm_customer_edit(uuid) from public, anon;
grant execute on function public.restore_crm_customer_edit(uuid) to authenticated;

notify pgrst, 'reload schema';
