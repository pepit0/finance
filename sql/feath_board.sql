-- Feath Board shared state (product-site/feath-board)
-- Run in Supabase SQL Editor, then create a shared Auth user for the team.

create table if not exists public.feath_board_state (
  project_id text primary key,
  features jsonb not null default '[]'::jsonb,
  decisions jsonb not null default '[]'::jsonb,
  sprint_tasks jsonb not null default '[]'::jsonb,
  bugs jsonb not null default '[]'::jsonb,
  launch_items jsonb not null default '[]'::jsonb,
  tasks jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

alter table public.feath_board_state enable row level security;

drop policy if exists "feath_board_select" on public.feath_board_state;
drop policy if exists "feath_board_insert" on public.feath_board_state;
drop policy if exists "feath_board_update" on public.feath_board_state;

create policy "feath_board_select"
  on public.feath_board_state for select
  to authenticated
  using (true);

create policy "feath_board_insert"
  on public.feath_board_state for insert
  to authenticated
  with check (true);

create policy "feath_board_update"
  on public.feath_board_state for update
  to authenticated
  using (true)
  with check (true);

insert into public.feath_board_state (project_id)
values ('burd')
on conflict (project_id) do nothing;
