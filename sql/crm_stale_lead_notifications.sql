-- Run once on the CRM Supabase project (SQL Editor, as postgres).
-- Requires: sql/crm_marketing_ingest_bridge.sql (crm_notifications), sql/crm_directory_delegated_admins.sql
--
-- Sends in-app alerts when an **active** customer has no call/comment/text activity for 12+ hours.
-- Call notify_stale_active_leads() on a schedule (Edge Function + cron, or pg_cron below).

-- Keep in sync with sql/crm_directory_set_master_email.sql when you change the master admin email.
create or replace function public.crm_notification_admin_user_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public, auth
as $$
  select distinct u.id
  from auth.users u
  where lower(trim(coalesce(u.email, ''))) in (
    select lower(trim(a.email))
    from public.crm_directory_admins a
    union
    select lower('danielsharifian@gmail.com')
  );
$$;

revoke all on function public.crm_notification_admin_user_ids() from public;
grant execute on function public.crm_notification_admin_user_ids() to service_role;

create index if not exists crm_notifications_stale_lead_dedup_idx
  on public.crm_notifications (customer_id, created_at desc)
  where type = 'stale_lead';

create index if not exists crm_activities_customer_kind_created_idx
  on public.crm_activities (customer_id, created_at desc)
  where kind in ('call', 'comment', 'text');

-- Inserts stale-lead notifications for assignee + directory admins (deduped per customer per stale window).
create or replace function public.notify_stale_active_leads(p_stale_hours integer default 12)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_stale_interval interval := make_interval(hours => p_stale_hours);
  v_customer record;
  v_recipient uuid;
  v_notifications_created integer := 0;
  v_customers_alerted integer := 0;
begin
  if p_stale_hours is null or p_stale_hours < 1 or p_stale_hours > 168 then
    raise exception 'p_stale_hours must be between 1 and 168';
  end if;

  for v_customer in
    select
      c.id,
      c.display_name,
      c.assigned_to
    from public.crm_customers c
    left join lateral (
      select max(a.created_at) as last_at
      from public.crm_activities a
      where a.customer_id = c.id
        and a.kind in ('call', 'comment', 'text')
    ) act on true
    where c.status = 'active'
      and coalesce(act.last_at, c.created_at) <= now() - v_stale_interval
      and not exists (
        select 1
        from public.crm_notifications n
        where n.customer_id = c.id
          and n.type = 'stale_lead'
          and n.created_at > now() - v_stale_interval
      )
  loop
    v_customers_alerted := v_customers_alerted + 1;

    for v_recipient in
      select distinct r.uid
      from (
        select v_customer.assigned_to as uid
        where v_customer.assigned_to is not null
        union all
        select admin_uid from public.crm_notification_admin_user_ids() as admin_uid
      ) r
      where r.uid is not null
    loop
      insert into public.crm_notifications (user_id, type, title, body, customer_id)
      values (
        v_recipient,
        'stale_lead',
        'Lead needs follow-up',
        trim(coalesce(v_customer.display_name, 'Customer'))
          || ' has had no call, comment, or text in '
          || p_stale_hours::text
          || '+ hours.',
        v_customer.id
      );
      v_notifications_created := v_notifications_created + 1;
    end loop;
  end loop;

  return jsonb_build_object(
    'customers_alerted', v_customers_alerted,
    'notifications_created', v_notifications_created,
    'stale_hours', p_stale_hours
  );
end;
$$;

revoke all on function public.notify_stale_active_leads(integer) from public;
grant execute on function public.notify_stale_active_leads(integer) to service_role;

-- Optional: pg_cron (Supabase Pro). Run hourly at minute 5.
-- select cron.schedule(
--   'crm-notify-stale-active-leads',
--   '5 * * * *',
--   $$ select public.notify_stale_active_leads(12); $$
-- );

notify pgrst, 'reload schema';
