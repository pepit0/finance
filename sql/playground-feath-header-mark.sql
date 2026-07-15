-- Playground / demo: use Feath product-site header mark (theme-aware SVG in app).
-- Run on crm-playground Supabase only — not Temptation prod.
-- Safe to re-run.

begin;

update public.crm_org_settings
set
  header_icon_path = 'builtin/feath-mark',
  updated_at = now()
where id = 'default';

commit;
