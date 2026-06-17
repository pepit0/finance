-- Configurable CRM pipeline stages (labels, colors, order). Run once in Supabase SQL Editor as postgres.
-- Requires: sql/crm_security.sql, sql/crm_user_directory_positions.sql, sql/crm_customer_pipeline_stage_lost.sql

create table if not exists public.crm_pipeline_stages (
  slug text primary key check (slug ~ '^[a-z][a-z0-9_]{0,47}$'),
  label text not null check (char_length(trim(label)) >= 1),
  color text not null check (color ~* '^#[0-9a-f]{6}$'),
  sort_order integer not null default 0,
  is_system boolean not null default false,
  is_selectable boolean not null default true,
  requires_credit_app boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists crm_pipeline_stages_sort_idx
  on public.crm_pipeline_stages (sort_order, slug);

insert into public.crm_pipeline_stages (slug, label, color, sort_order, is_system, is_selectable, requires_credit_app)
values
  ('fresh_lead', 'Fresh lead', '#2563eb', 10, true, true, false),
  ('contacted', 'Contacted', '#2563eb', 20, false, true, false),
  ('no_contact', 'No contact', '#dc2626', 30, false, true, false),
  ('apped', 'Apped', '#16a34a', 40, false, true, true),
  ('pending_fi', 'Pending F&I', '#ca8a04', 50, false, true, false),
  ('sold', 'Sold', '#166534', 60, false, true, false),
  ('lost', 'Lost', '#991b1b', 70, true, false, false)
on conflict (slug) do nothing;

alter table public.crm_customers drop constraint if exists crm_customers_pipeline_stage_check;

alter table public.crm_customers drop constraint if exists crm_customers_pipeline_stage_fkey;

alter table public.crm_customers
  add constraint crm_customers_pipeline_stage_fkey
  foreign key (pipeline_stage)
  references public.crm_pipeline_stages (slug)
  on update cascade
  on delete restrict;

alter table public.crm_pipeline_stages enable row level security;

revoke all on table public.crm_pipeline_stages from public;
revoke all on table public.crm_pipeline_stages from anon;

drop policy if exists crm_pipeline_stages_select on public.crm_pipeline_stages;
drop policy if exists crm_pipeline_stages_insert on public.crm_pipeline_stages;
drop policy if exists crm_pipeline_stages_update on public.crm_pipeline_stages;
drop policy if exists crm_pipeline_stages_delete on public.crm_pipeline_stages;

create policy crm_pipeline_stages_select on public.crm_pipeline_stages
  for select to authenticated
  using (public.user_has_crm_access());

create policy crm_pipeline_stages_insert on public.crm_pipeline_stages
  for insert to authenticated
  with check (public.crm_user_directory_master());

create policy crm_pipeline_stages_update on public.crm_pipeline_stages
  for update to authenticated
  using (public.crm_user_directory_master())
  with check (public.crm_user_directory_master());

create policy crm_pipeline_stages_delete on public.crm_pipeline_stages
  for delete to authenticated
  using (public.crm_user_directory_master() and not is_system);

notify pgrst, 'reload schema';
