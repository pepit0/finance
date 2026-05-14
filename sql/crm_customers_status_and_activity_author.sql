-- Run once in Supabase SQL Editor for existing CRM databases.
-- Adds: customer status (active/lost), lost_at, last_call_at; activity author_email; trigger to refresh last_call_at on calls.

alter table public.crm_customers add column if not exists status text default 'active';
update public.crm_customers set status = 'active' where status is null or trim(status) = '';

alter table public.crm_customers alter column status set default 'active';

do $$
begin
  alter table public.crm_customers add constraint crm_customers_status_check check (status in ('active', 'lost'));
exception
  when duplicate_object then null;
end $$;

alter table public.crm_customers alter column status set not null;

alter table public.crm_customers add column if not exists lost_at timestamptz;
alter table public.crm_customers add column if not exists last_call_at timestamptz;

alter table public.crm_activities add column if not exists author_email text;

create index if not exists crm_customers_status_idx on public.crm_customers (status);

create or replace function public.crm_activities_touch_last_call()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.kind = 'call' then
    update public.crm_customers
    set last_call_at = case
      when last_call_at is null or NEW.created_at > last_call_at then NEW.created_at
      else last_call_at
    end
    where id = NEW.customer_id;
  end if;
  return NEW;
end;
$$;

drop trigger if exists crm_activities_touch_last_call on public.crm_activities;
create trigger crm_activities_touch_last_call
  after insert on public.crm_activities
  for each row
  execute function public.crm_activities_touch_last_call();

notify pgrst, 'reload schema';
