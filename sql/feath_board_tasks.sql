-- Feath Board team tasks (marketing, ops, etc.)
-- Run in Supabase SQL Editor on existing feath_board_state tables.

alter table public.feath_board_state
  add column if not exists tasks jsonb not null default '[]'::jsonb;

notify pgrst, 'reload schema';
