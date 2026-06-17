-- Customer-linked tasks (run once on CRM Supabase as postgres).
-- Requires: sql/crm_security.sql, sql/crm_directory_delegated_admins.sql (crm_user_directory_admin).

create table if not exists public.crm_customer_tasks (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.crm_customers (id) on delete cascade,
  task_type text not null check (task_type in ('call', 'appointment', 'other')),
  task_date date not null,
  task_time time not null,
  title text not null check (length(trim(title)) > 0),
  notes text,
  assigned_to uuid not null references auth.users (id) on delete restrict,
  assigned_to_email text,
  created_by uuid not null default auth.uid() references auth.users (id) on delete restrict,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists crm_customer_tasks_assigned_date_idx
  on public.crm_customer_tasks (assigned_to, task_date, task_time);

create index if not exists crm_customer_tasks_customer_date_idx
  on public.crm_customer_tasks (customer_id, task_date desc, task_time);

create index if not exists crm_customer_tasks_created_by_idx
  on public.crm_customer_tasks (created_by, created_at desc);

alter table public.crm_customer_tasks enable row level security;

revoke all on table public.crm_customer_tasks from public;
revoke all on table public.crm_customer_tasks from anon;

drop policy if exists crm_customer_tasks_select on public.crm_customer_tasks;
drop policy if exists crm_customer_tasks_insert on public.crm_customer_tasks;
drop policy if exists crm_customer_tasks_update on public.crm_customer_tasks;
drop policy if exists crm_customer_tasks_delete on public.crm_customer_tasks;

create policy crm_customer_tasks_select on public.crm_customer_tasks
  for select to authenticated
  using (public.user_has_crm_access());

create policy crm_customer_tasks_insert on public.crm_customer_tasks
  for insert to authenticated
  with check (
    public.user_has_crm_access()
    and created_by = auth.uid()
    and exists (select 1 from public.crm_customers c where c.id = customer_id)
  );

create policy crm_customer_tasks_update on public.crm_customer_tasks
  for update to authenticated
  using (
    public.user_has_crm_access()
    and (
      created_by = auth.uid()
      or assigned_to = auth.uid()
      or public.crm_user_directory_admin()
    )
  )
  with check (public.user_has_crm_access());

create policy crm_customer_tasks_delete on public.crm_customer_tasks
  for delete to authenticated
  using (
    public.user_has_crm_access()
    and (
      created_by = auth.uid()
      or public.crm_user_directory_admin()
    )
  );

notify pgrst, 'reload schema';
