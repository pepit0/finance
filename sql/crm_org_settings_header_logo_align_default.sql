-- Allow "default" header logo alignment (inline logo beside title on left sidebar).
-- Run once after sql/crm_org_settings_header_logo_align.sql.

alter table public.crm_org_settings
  drop constraint if exists crm_org_settings_header_logo_align_check;

alter table public.crm_org_settings
  add constraint crm_org_settings_header_logo_align_check
    check (header_logo_align in ('default', 'left', 'center', 'right'));

alter table public.crm_org_settings
  alter column header_logo_align set default 'default';

notify pgrst, 'reload schema';
