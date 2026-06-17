-- CRM page / panel outline corner shape. Run once after sql/crm_org_settings_control_style.sql.

alter table public.crm_org_settings
  add column if not exists page_outline_shape text not null default 'square_rounded'
    check (page_outline_shape in ('square', 'square_rounded'));

notify pgrst, 'reload schema';
