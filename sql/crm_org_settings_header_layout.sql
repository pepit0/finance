-- CRM desktop header layout preference.
-- Run once after sql/crm_org_settings_control_style.sql.

alter table public.crm_org_settings
  add column if not exists header_layout text not null default 'top'
    check (header_layout in ('top', 'left'));

notify pgrst, 'reload schema';
