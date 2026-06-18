-- CRM label & badge colors (activity kinds, approval status, call recording states).
-- Run once after sql/crm_org_settings_branding.sql.

alter table public.crm_org_settings
  add column if not exists label_colors jsonb;

comment on column public.crm_org_settings.label_colors is
  'Optional CRM badge colors: activity kinds, lender approval tags, and call recording badges.';

notify pgrst, 'reload schema';
