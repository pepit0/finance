-- CRM textbox & dropdown shape preference. Run once after sql/crm_org_settings_control_style.sql.

alter table public.crm_org_settings
  add column if not exists field_shape text not null default 'square_rounded'
    check (field_shape in ('square', 'square_rounded', 'rounded'));

notify pgrst, 'reload schema';
