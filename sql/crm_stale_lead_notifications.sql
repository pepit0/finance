-- Run once on the CRM Supabase project (SQL Editor, as postgres).
-- Requires: sql/crm_marketing_ingest_bridge.sql (crm_notifications), sql/crm_directory_delegated_admins.sql
--
-- In-app alerts when an **active** customer has no call/comment/text activity for 12+ hours.
-- Milestones: 12, 24, 36, 48, 60 hours — one alert per milestone since the last touch.
-- If a milestone was skipped (e.g. cron missed 12h but customer is at 25h idle), only the highest
-- uncrossed milestone is sent (24h), not earlier ones. New activity resets the cycle.
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

alter table public.crm_notifications
  add column if not exists stale_hours integer;

create index if not exists crm_notifications_stale_lead_dedup_idx
  on public.crm_notifications (customer_id, created_at desc)
  where type = 'stale_lead';

create index if not exists crm_notifications_stale_lead_milestone_idx
  on public.crm_notifications (customer_id, stale_hours, created_at desc)
  where type = 'stale_lead' and stale_hours is not null;

create index if not exists crm_activities_customer_kind_created_idx
  on public.crm_activities (customer_id, created_at desc)
  where kind in ('call', 'comment', 'text');

drop function if exists public.notify_stale_active_leads(integer);

-- Inserts stale-lead notifications for assignee + directory admins at 12/24/36/48/60 hour milestones.
create or replace function public.notify_stale_active_leads()
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_thresholds constant integer[] := array[12, 24, 36, 48, 60];
  v_customer record;
  v_recipient uuid;
  v_milestone integer;
  v_i integer;
  v_threshold integer;
  v_notifications_created integer := 0;
  v_customers_alerted integer := 0;
  v_milestones_sent jsonb := '[]'::jsonb;
begin
  for v_customer in
    select
      c.id,
      c.display_name,
      c.assigned_to,
      coalesce(act.last_at, c.created_at) as last_touch_at,
      floor(
        extract(epoch from (now() - coalesce(act.last_at, c.created_at))) / 3600.0
      )::integer as hours_idle
    from public.crm_customers c
    left join lateral (
      select max(a.created_at) as last_at
      from public.crm_activities a
      where a.customer_id = c.id
        and a.kind in ('call', 'comment', 'text')
    ) act on true
    where c.status = 'active'
      and floor(
        extract(epoch from (now() - coalesce(act.last_at, c.created_at))) / 3600.0
      ) >= v_thresholds[1]
  loop
    v_milestone := null;

    -- Highest milestone reached that has not been alerted since the last touch.
    for v_i in reverse array_lower(v_thresholds, 1)..array_upper(v_thresholds, 1) loop
      v_threshold := v_thresholds[v_i];
      if v_customer.hours_idle >= v_threshold then
        if not exists (
          select 1
          from public.crm_notifications n
          where n.customer_id = v_customer.id
            and n.type = 'stale_lead'
            and n.stale_hours = v_threshold
            and n.created_at > v_customer.last_touch_at
        ) then
          v_milestone := v_threshold;
          exit;
        end if;
      end if;
    end loop;

    if v_milestone is null then
      continue;
    end if;

    v_customers_alerted := v_customers_alerted + 1;
    v_milestones_sent := v_milestones_sent || jsonb_build_object(
      'customer_id', v_customer.id,
      'milestone_hours', v_milestone,
      'hours_idle', v_customer.hours_idle
    );

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
      insert into public.crm_notifications (
        user_id,
        type,
        title,
        body,
        customer_id,
        stale_hours
      )
      values (
        v_recipient,
        'stale_lead',
        'Lead needs follow-up',
        trim(coalesce(v_customer.display_name, 'Customer'))
          || ' has had no call, comment, or text in '
          || v_milestone::text
          || ' hours.',
        v_customer.id,
        v_milestone
      );
      v_notifications_created := v_notifications_created + 1;
    end loop;
  end loop;

  return jsonb_build_object(
    'customers_alerted', v_customers_alerted,
    'notifications_created', v_notifications_created,
    'milestones', v_milestones_sent,
    'threshold_hours', v_thresholds
  );
end;
$$;

revoke all on function public.notify_stale_active_leads() from public;
grant execute on function public.notify_stale_active_leads() to service_role;

-- Optional: pg_cron (Supabase Pro). Run hourly at minute 5.
-- select cron.schedule(
--   'crm-notify-stale-active-leads',
--   '5 * * * *',
--   $$ select public.notify_stale_active_leads(); $$
-- );

notify pgrst, 'reload schema';
