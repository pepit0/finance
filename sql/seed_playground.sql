-- Playground-only fake customers. Run on crm-playground after migrations.
-- Branding: run sql/seed_tenant_defaults.sql first (or use playground-with-seed bundle order).
-- Requires: crm_security, crm_customers, crm_pipeline_stages.

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

-- Optional playground-only labels (overrides seed_tenant_defaults subtitle/footer for demos).
update public.crm_org_settings
set
  header_subtitle = 'Demo — sample customers only',
  footer_text = coalesce(nullif(trim(footer_text), ''), 'Demo CRM'),
  updated_at = now()
where id = 'default';

commit;
