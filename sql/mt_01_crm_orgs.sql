-- Model B Phase 1 — orgs, domains, members + helpers (additive; does not rewrite CRM RLS).
-- Apply on crm-playground first. Do NOT apply to Temptation prod until Phase 5.
-- Plan: docs/MULTI_TENANT_PLAN.md §9 / Phase 1

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tables (no cross-policies until all exist)
-- ---------------------------------------------------------------------------
create table if not exists public.crm_orgs (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  display_name text not null,
  has_crm boolean not null default true,
  has_website boolean not null default false,
  status text not null default 'active'
    check (status in ('provisioning', 'active', 'suspended')),
  created_at timestamptz not null default now(),
  constraint crm_orgs_slug_check check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint crm_orgs_slug_unique unique (slug)
);

create index if not exists crm_orgs_status_idx on public.crm_orgs (status);

create table if not exists public.crm_org_members (
  org_id uuid not null references public.crm_orgs (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'staff'
    check (role in ('owner', 'admin', 'staff')),
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

create index if not exists crm_org_members_user_idx on public.crm_org_members (user_id);

create table if not exists public.crm_org_domains (
  hostname text primary key,
  org_id uuid not null references public.crm_orgs (id) on delete cascade,
  kind text not null default 'crm'
    check (kind in ('crm', 'website', 'both')),
  created_at timestamptz not null default now(),
  constraint crm_org_domains_hostname_check check (
    length(trim(hostname)) > 0
    and hostname = lower(trim(hostname))
  )
);

create index if not exists crm_org_domains_org_idx on public.crm_org_domains (org_id);

-- ---------------------------------------------------------------------------
-- Grants + RLS
-- ---------------------------------------------------------------------------
alter table public.crm_orgs enable row level security;
alter table public.crm_org_members enable row level security;
alter table public.crm_org_domains enable row level security;

revoke all on table public.crm_orgs from public;
revoke all on table public.crm_orgs from anon;
revoke all on table public.crm_org_members from public;
revoke all on table public.crm_org_members from anon;
revoke all on table public.crm_org_domains from public;
revoke all on table public.crm_org_domains from anon;

grant select on table public.crm_orgs to authenticated;
grant select on table public.crm_org_members to authenticated;
grant select on table public.crm_org_domains to authenticated;

drop policy if exists crm_orgs_select on public.crm_orgs;
create policy crm_orgs_select on public.crm_orgs
  for select to authenticated
  using (
    public.user_has_crm_access()
    or exists (
      select 1 from public.crm_org_members m
      where m.org_id = crm_orgs.id and m.user_id = auth.uid()
    )
  );

drop policy if exists crm_org_members_select on public.crm_org_members;
create policy crm_org_members_select on public.crm_org_members
  for select to authenticated
  using (
    user_id = auth.uid()
    or public.user_has_crm_access()
  );

drop policy if exists crm_org_domains_select on public.crm_org_domains;
create policy crm_org_domains_select on public.crm_org_domains
  for select to authenticated
  using (
    public.user_has_crm_access()
    or exists (
      select 1 from public.crm_org_members m
      where m.org_id = crm_org_domains.org_id and m.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Helpers (JWT org_id; membership). Full CRM RLS cut is Phase 2.
-- ---------------------------------------------------------------------------
create or replace function public.current_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select nullif(trim(coalesce(auth.jwt() -> 'app_metadata' ->> 'org_id', '')), '')::uuid;
$$;

create or replace function public.user_in_org(p_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    p_org_id is not null
    and exists (
      select 1
      from public.crm_org_members m
      where m.org_id = p_org_id
        and m.user_id = auth.uid()
    );
$$;

create or replace function public.org_has_crm(p_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.crm_orgs o
    where o.id = p_org_id
      and o.has_crm
      and o.status = 'active'
  );
$$;

create or replace function public.user_org_role(p_org_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select m.role
  from public.crm_org_members m
  where m.org_id = p_org_id
    and m.user_id = auth.uid()
  limit 1;
$$;

revoke all on function public.current_org_id() from public;
revoke all on function public.user_in_org(uuid) from public;
revoke all on function public.org_has_crm(uuid) from public;
revoke all on function public.user_org_role(uuid) from public;

grant execute on function public.current_org_id() to authenticated;
grant execute on function public.user_in_org(uuid) to authenticated;
grant execute on function public.org_has_crm(uuid) to authenticated;
grant execute on function public.user_org_role(uuid) to authenticated;

notify pgrst, 'reload schema';
