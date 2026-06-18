-- Track last SMS touch on customer profiles. Run once after sql/crm_activities_twilio_sms.sql.

alter table public.crm_customers
  add column if not exists last_text_at timestamptz;

create or replace function public.crm_activities_touch_last_text()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.kind = 'text' then
    update public.crm_customers
    set last_text_at = case
      when last_text_at is null or NEW.created_at > last_text_at then NEW.created_at
      else last_text_at
    end
    where id = NEW.customer_id;
  end if;
  return NEW;
end;
$$;

drop trigger if exists crm_activities_touch_last_text on public.crm_activities;
create trigger crm_activities_touch_last_text
  after insert on public.crm_activities
  for each row
  execute function public.crm_activities_touch_last_text();

notify pgrst, 'reload schema';
