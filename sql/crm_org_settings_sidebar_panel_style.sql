-- CRM left sidebar panel style (clear / outlined / filled).
-- Run once after sql/crm_org_settings_header_layout.sql.

alter table public.crm_org_settings
  add column if not exists sidebar_panel_style text not null default 'filled'
    check (sidebar_panel_style in ('clear', 'outline', 'filled'));

notify pgrst, 'reload schema';
