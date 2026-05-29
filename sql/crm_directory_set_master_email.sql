-- Run once in the CRM Supabase project (SQL Editor).
-- Replace YOUR_SIGN_IN_EMAIL@example.com with the exact email you use to log into the CRM.
-- Must match VITE_CRM_DIRECTORY_MASTER_EMAIL in .env.local if you use that variable.

create or replace function public.crm_user_directory_master()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select lower(trim(coalesce(auth.jwt() ->> 'email', ''))) = lower('danielsharifian@gmail.com');
$$;

grant execute on function public.crm_user_directory_master() to authenticated;

notify pgrst, 'reload schema';
