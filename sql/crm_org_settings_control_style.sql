-- CRM button & tab shape / fill style preferences. Run once after sql/crm_org_settings.sql.

alter table public.crm_org_settings
  add column if not exists button_shape text not null default 'square_rounded'
    check (button_shape in ('square', 'square_rounded', 'rounded')),
  add column if not exists field_shape text not null default 'square_rounded'
    check (field_shape in ('square', 'square_rounded', 'rounded')),
  add column if not exists tab_shape text not null default 'rounded'
    check (tab_shape in ('square', 'square_rounded', 'rounded')),
  add column if not exists tab_idle_style text not null default 'outline'
    check (tab_idle_style in ('empty', 'outline')),
  add column if not exists tab_active_style text not null default 'filled'
    check (tab_active_style in ('filled', 'outline')),
  add column if not exists button_primary_style text not null default 'filled'
    check (button_primary_style in ('filled', 'outline')),
  add column if not exists page_outline_shape text not null default 'square_rounded'
    check (page_outline_shape in ('square', 'square_rounded')),
  add column if not exists header_layout text not null default 'top'
    check (header_layout in ('top', 'left')),
  add column if not exists sidebar_panel_style text not null default 'filled'
    check (sidebar_panel_style in ('clear', 'outline', 'filled'));

notify pgrst, 'reload schema';
