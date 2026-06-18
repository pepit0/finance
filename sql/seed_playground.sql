-- Playground seed data (no PII). Run ONLY on empty/dev Supabase after base migrations.
-- Requires: crm_security, crm_customers, crm_pipeline_stages (from migrations).

begin;

insert into public.crm_customers (
  id,
  created_by,
  created_by_email,
  display_name,
  phone,
  email,
  status,
  pipeline_stage,
  created_at
)
values
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0001',
    null,
    'Playground Seed',
    'Alex Sample',
    '+15550100001',
    'alex.sample@example.invalid',
    'active',
    'fresh_lead',
    now() - interval '2 days'
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0002',
    null,
    'Playground Seed',
    'Blake Demo',
    '+15550100002',
    'blake.demo@example.invalid',
    'active',
    'contacted',
    now() - interval '5 days'
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0003',
    null,
    'Playground Seed',
    'Casey Test',
    '+15550100003',
    null,
    'active',
    'apped',
    now() - interval '10 days'
  )
on conflict (id) do nothing;

update public.crm_org_settings
set
  header_title = coalesce(nullif(trim(header_title), ''), 'Playground CRM'),
  header_subtitle = coalesce(nullif(trim(header_subtitle), ''), 'Demo tenant — fake data only'),
  footer_text = 'Playground CRM',
  app_version = '0.1.0',
  updated_at = now()
where id = 'default';

commit;
