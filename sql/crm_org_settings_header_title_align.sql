-- CRM header title/subtitle text alignment (left / center / right).
-- Run once after sql/crm_org_settings_header_logo_align.sql.

alter table public.crm_org_settings
  add column if not exists header_title_align text not null default 'left'
    check (header_title_align in ('left', 'center', 'right'));

notify pgrst, 'reload schema';
