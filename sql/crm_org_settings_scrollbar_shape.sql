-- CRM scrollbar shape. Run once after sql/crm_org_settings_scrollbar_style.sql.

alter table public.crm_org_settings
  add column if not exists scrollbar_shape text not null default 'rounded'
    check (scrollbar_shape in ('rounded', 'square'));

notify pgrst, 'reload schema';
