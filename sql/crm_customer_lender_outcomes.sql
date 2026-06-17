-- Run once in Supabase SQL Editor for existing CRM databases.
-- Stores per-customer lender approval tracking for CRM (prime / subprime icon rail).

create table if not exists public.crm_customer_lender_outcomes (
  customer_id uuid not null references public.crm_customers (id) on delete cascade,
  lender_slug text not null,
  outcome text not null check (outcome in ('approved', 'conditional', 'declined', 'pending')),
  reason text,
  updated_at timestamptz not null default now(),
  primary key (customer_id, lender_slug),
  constraint crm_customer_lender_outcomes_slug_check check (
    lender_slug in (
      'national_bank',
      'desjardins',
      'td',
      'santander_prime',
      'lendcare',
      'prefera',
      'santander_subprime'
    )
  )
);

create index if not exists crm_customer_lender_outcomes_customer_id_idx
  on public.crm_customer_lender_outcomes (customer_id);

alter table public.crm_customer_lender_outcomes enable row level security;

drop policy if exists crm_customer_lender_outcomes_select on public.crm_customer_lender_outcomes;
drop policy if exists crm_customer_lender_outcomes_insert on public.crm_customer_lender_outcomes;
drop policy if exists crm_customer_lender_outcomes_update on public.crm_customer_lender_outcomes;
drop policy if exists crm_customer_lender_outcomes_delete on public.crm_customer_lender_outcomes;

create policy crm_customer_lender_outcomes_select on public.crm_customer_lender_outcomes
  for select to authenticated
  using (
    public.user_has_crm_access()
    and exists (select 1 from public.crm_customers c where c.id = customer_id)
  );

create policy crm_customer_lender_outcomes_insert on public.crm_customer_lender_outcomes
  for insert to authenticated
  with check (
    public.user_has_crm_access()
    and exists (select 1 from public.crm_customers c where c.id = customer_id)
  );

create policy crm_customer_lender_outcomes_update on public.crm_customer_lender_outcomes
  for update to authenticated
  using (
    public.user_has_crm_access()
    and exists (select 1 from public.crm_customers c where c.id = customer_id)
  )
  with check (
    public.user_has_crm_access()
    and exists (select 1 from public.crm_customers c where c.id = customer_id)
  );

create policy crm_customer_lender_outcomes_delete on public.crm_customer_lender_outcomes
  for delete to authenticated
  using (
    public.user_has_crm_access()
    and exists (select 1 from public.crm_customers c where c.id = customer_id)
  );

grant select, insert, update, delete on public.crm_customer_lender_outcomes to authenticated;

alter table public.crm_customer_lender_outcomes
  add column if not exists reason text;

notify pgrst, 'reload schema';
