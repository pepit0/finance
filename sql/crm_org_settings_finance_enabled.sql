-- Toggle finance/lender features for orgs that do not use automotive finance workflows.
-- Run once after sql/crm_org_settings_control_style.sql.

alter table public.crm_org_settings
  add column if not exists finance_enabled boolean not null default true;

notify pgrst, 'reload schema';
