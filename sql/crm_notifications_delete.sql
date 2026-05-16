-- Run once on the CRM Supabase project (after sql/crm_marketing_ingest_bridge.sql).
-- Lets each user delete their own notification rows (dismiss individual alerts).

grant delete on table public.crm_notifications to authenticated;

drop policy if exists crm_notifications_delete on public.crm_notifications;

create policy crm_notifications_delete on public.crm_notifications
  for delete to authenticated
  using (user_id = auth.uid());

notify pgrst, 'reload schema';
