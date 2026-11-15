-- Subprime Tool — one paste for SQL Editor
-- https://supabase.com/dashboard/project/beezujpcoskusrbvsuka/sql/new

create table if not exists public.finance_access_allowlist (
  email text primary key check (length(trim(email)) > 0)
);

alter table public.finance_access_allowlist enable row level security;

revoke all on table public.finance_access_allowlist from public;
revoke all on table public.finance_access_allowlist from anon, authenticated;

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

insert into public.finance_access_allowlist (email)
values ('danielsharifian@gmail.com')
on conflict (email) do nothing;
