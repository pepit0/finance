-- Agent callback phone for Twilio click-to-call bridge. Run once on CRM Supabase.
-- Requires: sql/crm_user_directory_positions.sql

alter table public.crm_user_directory
  add column if not exists callback_phone text;

comment on column public.crm_user_directory.callback_phone is
  '10-digit NANP phone where Twilio rings this user for outbound/inbound bridge calls.';

notify pgrst, 'reload schema';
