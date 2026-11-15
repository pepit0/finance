-- Model B Phase 1 — link crm_org_settings to orgs (additive; Model A app still uses id='default').
-- Apply after sql/mt_01_crm_orgs.sql on crm-playground only until Phase 5.
-- Plan: docs/MULTI_TENANT_PLAN.md §9 mt_02

alter table public.crm_org_settings
  add column if not exists org_id uuid references public.crm_orgs (id) on delete cascade;

create unique index if not exists crm_org_settings_org_id_uidx
  on public.crm_org_settings (org_id)
  where org_id is not null;

comment on column public.crm_org_settings.org_id is
  'Model B: settings row for an org. Legacy single-tenant row keeps id=default until Phase 4/5.';

-- Keep existing check (id = 'default') for now so Model A app continues to work.
-- Phase 4/5 will migrate to one settings row per org and relax/remove the id check.

notify pgrst, 'reload schema';
