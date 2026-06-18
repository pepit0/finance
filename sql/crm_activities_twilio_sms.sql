-- Twilio SMS metadata on activity log rows. Run once after sql/crm_activities_twilio_calls.sql.

alter table public.crm_activities
  add column if not exists twilio_message_sid text,
  add column if not exists sms_direction text
    check (sms_direction is null or sms_direction in ('inbound', 'outbound')),
  add column if not exists sms_from text,
  add column if not exists sms_to text,
  add column if not exists sms_status text
    check (
      sms_status is null
      or sms_status in ('queued', 'sent', 'delivered', 'failed', 'undelivered', 'received')
    );

create unique index if not exists crm_activities_twilio_message_sid_uidx
  on public.crm_activities (twilio_message_sid)
  where twilio_message_sid is not null;

create index if not exists crm_activities_sms_thread_idx
  on public.crm_activities (customer_id, created_at desc)
  where kind = 'text' and source = 'twilio';

notify pgrst, 'reload schema';
