-- CRM header logo alignment (left / center / right).
-- Run once after sql/crm_org_settings_control_style.sql.

alter table public.crm_org_settings
  add column if not exists header_logo_align text not null default 'left'
    check (header_logo_align in ('left', 'center', 'right'));

notify pgrst, 'reload schema';
