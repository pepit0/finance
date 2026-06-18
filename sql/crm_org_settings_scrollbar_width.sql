-- CRM scrollbar width. Run once after sql/crm_org_settings_scrollbar_shape.sql.

alter table public.crm_org_settings
  add column if not exists scrollbar_width text not null default 'thin'
    check (scrollbar_width in ('thin', 'thick'));

notify pgrst, 'reload schema';
