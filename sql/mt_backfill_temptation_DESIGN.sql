-- DESIGN ONLY for Phase 5 — do NOT run on Temptation prod until Phase 5 gate.
-- Backfill Temptation CRM (pepit0's Project / izgehybhisycbhalkbub) into Model B as org #1.
-- Plan: docs/MULTI_TENANT_PLAN.md §9.3

-- 1) Create Temptation org
-- insert into public.crm_orgs (slug, display_name, has_crm, has_website, status)
-- values ('temptation', 'Temptation Motorsports', true, true, 'active');

-- 2) Domains
-- insert into public.crm_org_domains (hostname, org_id, kind)
-- select 'crm.sharifian.cfd', id, 'crm' from public.crm_orgs where slug = 'temptation';

-- 3) Link settings
-- update public.crm_org_settings set org_id = (select id from public.crm_orgs where slug = 'temptation')
-- where id = 'default';

-- 4) Members: every auth user currently on allowlist / with crm_access
-- insert into public.crm_org_members (org_id, user_id, role)
-- select o.id, u.id, 'staff'
-- from public.crm_orgs o
-- cross join auth.users u
-- where o.slug = 'temptation'
--   and (
--     exists (select 1 from public.crm_access_allowlist a where lower(a.email) = lower(u.email))
--     or ... app_metadata check via dashboard export
--   );

-- 5) Later phases: update all CRM tables set org_id = temptation id where org_id is null;

-- Keep this file as a checklist; replace with executable SQL in Phase 5 after playground rehearsal.
