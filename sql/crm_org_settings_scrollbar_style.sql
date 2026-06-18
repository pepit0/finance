-- CRM page scrollbar appearance. Run once after sql/crm_org_settings_control_style.sql.

alter table public.crm_org_settings
  add column if not exists scrollbar_style text not null default 'default';

-- Drop legacy outline option (maps to default in the app).
update public.crm_org_settings
set scrollbar_style = 'default'
where scrollbar_style = 'outline';

alter table public.crm_org_settings
  drop constraint if exists crm_org_settings_scrollbar_style_check;

alter table public.crm_org_settings
  add constraint crm_org_settings_scrollbar_style_check
    check (scrollbar_style in ('default', 'filled'));

notify pgrst, 'reload schema';
