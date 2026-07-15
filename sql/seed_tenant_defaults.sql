-- Default CRM branding for NEW tenants (playground + licensed dealers).
-- Run once after the migration bundle (78 files), before seed_playground.sql on playground only.
--
-- INCLUDES background watermark path (default/background.png).
-- Header icon uses builtin/feath-mark (theme-aware Feath SVG in the app — no PNG upload needed).
-- After this file, upload background PNG only:
--   .\scripts\Seed-TenantDefaultBranding.ps1 -SupabaseUrl "..." -ServiceRoleKey "..."
-- Source PNGs live in assets/tenant-default-branding/ (export from playground with Export-TenantDefaultBranding.ps1).
--
-- To refresh settings from a styled playground DB:
--   1. Supabase SQL Editor (crm-playground) → sql/export_tenant_defaults.sql → copy UPDATE
--   2. Replace the update block below (keep paths unless you changed them in Settings)
--   3. sql/export branding: .\scripts\Export-TenantDefaultBranding.ps1

begin;

update public.crm_org_settings
set
  accent_color = '#3fad72',
  color_mode = 'dark',
  header_title = 'Feath CRM',
  header_subtitle = 'Customers, calls, and notes',
  footer_text = '',
  app_version = '0.1.0',
  background_image_path = 'default/background.png',
  header_icon_path = 'builtin/feath-mark',
  button_shape = 'square_rounded',
  field_shape = 'square_rounded',
  tab_shape = 'square_rounded',
  tab_idle_style = 'outline',
  tab_active_style = 'filled',
  button_primary_style = 'filled',
  page_outline_shape = 'square_rounded',
  header_layout = 'top',
  sidebar_panel_style = 'filled',
  header_logo_align = 'left',
  header_title_align = 'left',
  scrollbar_style = 'default',
  scrollbar_shape = 'rounded',
  scrollbar_width = 'thin',
  label_colors = '{"activityCall": {"bg": "#2b6ec5", "text": "#bfdbfe", "border": "#60a5fa"}, "activityText": {"bg": "#006156", "text": "#94ffcd", "border": "#34d399"}, "lenderPending": {"bg": "#334155", "text": "#cbd5e1", "border": "#94a3b8"}, "lenderApproved": {"bg": "#14532d", "text": "#86efac", "border": "#22c55e"}, "lenderDeclined": {"bg": "#7f1d1d", "text": "#fca5a5", "border": "#ef4444"}, "activityComment": {"bg": "#5d35a7", "text": "#e9d5ff", "border": "#c084fc"}, "recordingFailed": {"bg": "#7f1d1d", "text": "#fca5a5", "border": "#ef4444"}, "recordingPending": {"bg": "#374151", "text": "#94a3b8", "border": "#64748b"}, "lenderConditional": {"bg": "#713f12", "text": "#fde68a", "border": "#eab308"}, "recordingRecorded": {"bg": "#ff4242", "text": "#ffffff", "border": "#f59e0b"}}'::jsonb,
  finance_enabled = true,
  admin_whitelist_enabled = false,
  updated_at = now()
where id = 'default';

commit;
