-- Configurable CRM finance lenders (display names + logos). Run once in Supabase SQL Editor as postgres.
-- Requires: sql/crm_security.sql, sql/crm_customer_lender_outcomes.sql, sql/crm_org_settings_branding.sql

create table if not exists public.crm_lenders (
  slug text primary key check (slug ~ '^[a-z][a-z0-9_]{0,47}$'),
  tier text not null check (tier in ('prime', 'subprime')),
  label text not null check (char_length(trim(label)) >= 1 and char_length(label) <= 80),
  icon_domain text not null check (char_length(trim(icon_domain)) >= 3 and char_length(icon_domain) <= 120),
  custom_icon_path text,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists crm_lenders_sort_idx
  on public.crm_lenders (tier, sort_order, slug);

insert into public.crm_lenders (slug, tier, label, icon_domain, sort_order)
values
  ('national_bank', 'prime', 'National Bank', 'nbc.ca', 10),
  ('desjardins', 'prime', 'Desjardins', 'desjardins.com', 20),
  ('td', 'prime', 'TD', 'td.com', 30),
  ('santander_prime', 'prime', 'Santander', 'santanderconsumer.ca', 40),
  ('lendcare', 'subprime', 'Lendcare', 'lendcare.ca', 10),
  ('prefera', 'subprime', 'Prefera', 'preferafinance.com', 20),
  ('santander_subprime', 'subprime', 'Santander', 'santanderconsumer.ca', 30)
on conflict (slug) do nothing;

alter table public.crm_lenders enable row level security;

revoke all on table public.crm_lenders from public;
revoke all on table public.crm_lenders from anon;

drop policy if exists crm_lenders_select on public.crm_lenders;
drop policy if exists crm_lenders_insert on public.crm_lenders;
drop policy if exists crm_lenders_update on public.crm_lenders;
drop policy if exists crm_lenders_delete on public.crm_lenders;

create policy crm_lenders_select on public.crm_lenders
  for select to authenticated
  using (public.user_has_crm_access());

create policy crm_lenders_insert on public.crm_lenders
  for insert to authenticated
  with check (public.crm_user_directory_master());

create policy crm_lenders_update on public.crm_lenders
  for update to authenticated
  using (public.crm_user_directory_master())
  with check (public.crm_user_directory_master());

create policy crm_lenders_delete on public.crm_lenders
  for delete to authenticated
  using (public.crm_user_directory_master());

grant select on public.crm_lenders to authenticated;
grant insert, update, delete on public.crm_lenders to authenticated;

notify pgrst, 'reload schema';
