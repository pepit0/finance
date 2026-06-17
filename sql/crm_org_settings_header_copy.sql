-- CRM header title + subtitle (Settings → Branding).
-- Run once in Supabase SQL Editor as postgres after sql/crm_org_settings_branding.sql.

alter table public.crm_org_settings
  add column if not exists header_title text not null default 'Temptation Motorsports CRM',
  add column if not exists header_subtitle text not null default 'Customers, calls, and notes';

alter table public.crm_org_settings
  drop constraint if exists crm_org_settings_header_title_check;

alter table public.crm_org_settings
  add constraint crm_org_settings_header_title_check
  check (
    char_length(trim(header_title)) >= 1
    and char_length(header_title) <= 120
  );

alter table public.crm_org_settings
  drop constraint if exists crm_org_settings_header_subtitle_check;

alter table public.crm_org_settings
  add constraint crm_org_settings_header_subtitle_check
  check (char_length(header_subtitle) <= 200);

notify pgrst, 'reload schema';
