-- Run on a STYLED Supabase project (e.g. crm-playground) after you finish Settings → Branding.
-- SQL Editor → paste → Run. Copy the single text cell from the result into sql/seed_tenant_defaults.sql
-- (replace the update block), commit, and re-run Apply-PlaygroundMigrations.ps1 if you bundle seeds.
--
-- Logo/watermark paths are included if set. Commit matching PNGs under assets/tenant-default-branding/
-- (export: scripts/Export-TenantDefaultBranding.ps1). On new installs run scripts/Seed-TenantDefaultBranding.ps1
-- after sql/seed_tenant_defaults.sql.

select format(
$fmt$
-- Paste below into sql/seed_tenant_defaults.sql (replace the update ... where id = 'default' block).
update public.crm_org_settings
set
  accent_color = %1$L,
  color_mode = %2$L,
  header_title = %3$L,
  header_subtitle = %4$L,
  footer_text = %5$L,
  app_version = %6$L,
  background_image_path = %7$s,
  header_icon_path = %8$s,
  button_shape = %9$L,
  field_shape = %10$L,
  tab_shape = %11$L,
  tab_idle_style = %12$L,
  tab_active_style = %13$L,
  button_primary_style = %14$L,
  page_outline_shape = %15$L,
  header_layout = %16$L,
  sidebar_panel_style = %17$L,
  header_logo_align = %18$L,
  header_title_align = %19$L,
  scrollbar_style = %20$L,
  scrollbar_shape = %21$L,
  scrollbar_width = %22$L,
  label_colors = %23$s,
  finance_enabled = %24$s,
  admin_whitelist_enabled = false,
  updated_at = now()
where id = 'default';
$fmt$,
  s.accent_color,
  s.color_mode,
  s.header_title,
  s.header_subtitle,
  coalesce(s.footer_text, ''),
  coalesce(s.app_version, '0.0.0'),
  case when s.background_image_path is null then 'null' else quote_literal(s.background_image_path) end,
  case when s.header_icon_path is null then 'null' else quote_literal(s.header_icon_path) end,
  s.button_shape,
  s.field_shape,
  s.tab_shape,
  s.tab_idle_style,
  s.tab_active_style,
  s.button_primary_style,
  s.page_outline_shape,
  s.header_layout,
  s.sidebar_panel_style,
  s.header_logo_align,
  s.header_title_align,
  s.scrollbar_style,
  s.scrollbar_shape,
  s.scrollbar_width,
  case when s.label_colors is null then 'null' else quote_literal(s.label_colors::text) || '::jsonb' end,
  case when s.finance_enabled then 'true' else 'false' end
) as seed_sql
from public.crm_org_settings s
where s.id = 'default';
