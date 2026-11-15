-- Model B Phase 1 — seed two playground orgs (A/B). Members attached separately (see docs/MT_INVITE_USER.md).
-- Apply after mt_01 + mt_02 on crm-playground only. Safe to re-run (upsert by slug).

insert into public.crm_orgs (slug, display_name, has_crm, has_website, status)
values
  ('org-a', 'Playground Org A', true, true, 'active'),
  ('org-b', 'Playground Org B', true, false, 'active')
on conflict (slug) do update
set
  display_name = excluded.display_name,
  has_crm = excluded.has_crm,
  has_website = excluded.has_website,
  status = excluded.status;

insert into public.crm_org_domains (hostname, org_id, kind)
select 'org-a.localhost', o.id, 'crm'
from public.crm_orgs o where o.slug = 'org-a'
on conflict (hostname) do update set org_id = excluded.org_id, kind = excluded.kind;

insert into public.crm_org_domains (hostname, org_id, kind)
select 'org-b.localhost', o.id, 'crm'
from public.crm_orgs o where o.slug = 'org-b'
on conflict (hostname) do update set org_id = excluded.org_id, kind = excluded.kind;

insert into public.crm_org_domains (hostname, org_id, kind)
select 'demo.sharifian.cfd', o.id, 'crm'
from public.crm_orgs o where o.slug = 'org-a'
on conflict (hostname) do update set org_id = excluded.org_id, kind = excluded.kind;

-- Attach legacy settings row to Org A (Model A app still reads id='default')
update public.crm_org_settings s
set org_id = o.id
from public.crm_orgs o
where s.id = 'default'
  and o.slug = 'org-a'
  and s.org_id is null;

-- Placeholder settings row for Org B (id must remain 'default' only for the legacy row —
-- Org B gets a second row only after Phase 4 removes the id=default check.
-- Until then, Org B branding is not separately stored; membership/orgs still work.)

notify pgrst, 'reload schema';
