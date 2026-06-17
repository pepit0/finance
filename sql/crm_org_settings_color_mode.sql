-- CRM light/dark color mode preference. Run once in Supabase SQL Editor as postgres.
-- Requires: sql/crm_org_settings.sql

alter table public.crm_org_settings
  add column if not exists color_mode text not null default 'dark'
    check (color_mode in ('dark', 'light'));

update public.crm_org_settings
set color_mode = 'dark'
where color_mode is null or trim(color_mode) = '';

notify pgrst, 'reload schema';
