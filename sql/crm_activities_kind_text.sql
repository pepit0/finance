-- Run once in Supabase SQL Editor for existing CRM databases.
-- Adds activity kind 'text' (e.g. SMS / text thread) alongside 'call' and 'comment'.

alter table public.crm_activities drop constraint if exists crm_activities_kind_check;

alter table public.crm_activities
  add constraint crm_activities_kind_check check (kind in ('call', 'comment', 'text'));

notify pgrst, 'reload schema';
