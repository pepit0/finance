-- Subprime / finance tool — auth-only Supabase project (no CRM tables).
-- Project: beezujpcoskusrbvsuka (org: Subprime Tool)
-- One-paste bootstrap: sql/subprime_tool_bootstrap.sql
create table if not exists public.finance_access_allowlist (
  email text primary key check (length(trim(email)) > 0)
);

alter table public.finance_access_allowlist enable row level security;

revoke all on table public.finance_access_allowlist from public;
revoke all on table public.finance_access_allowlist from anon, authenticated;

-- Finance app calls this RPC (same name as CRM for compatibility).
-- Any signed-in allowlisted user gets admin extras (e.g. Open spreadsheet).
create or replace function public.user_has_crm_access()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  email_val text := lower(trim(coalesce(auth.jwt() ->> 'email', '')));
begin
  if auth.uid() is null or email_val = '' then
    return false;
  end if;

  return exists (
    select 1
    from public.finance_access_allowlist a
    where lower(a.email) = email_val
  );
end;
$$;

revoke all on function public.user_has_crm_access() from public;
grant execute on function public.user_has_crm_access() to authenticated;

-- Replace with your finance login email after creating the Auth user:
-- insert into public.finance_access_allowlist (email) values ('you@example.com');
