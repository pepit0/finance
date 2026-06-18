-- Twilio call metadata on activity log rows. Run once after sql/crm_security.sql.

alter table public.crm_activities
  add column if not exists source text not null default 'manual'
    check (source in ('manual', 'twilio')),
  add column if not exists twilio_call_sid text,
  add column if not exists call_direction text
    check (call_direction is null or call_direction in ('inbound', 'outbound')),
  add column if not exists call_duration_seconds integer
    check (call_duration_seconds is null or call_duration_seconds >= 0),
  add column if not exists call_from text,
  add column if not exists call_to text,
  add column if not exists recording_storage_path text;

create unique index if not exists crm_activities_twilio_call_sid_uidx
  on public.crm_activities (twilio_call_sid)
  where twilio_call_sid is not null;

create index if not exists crm_activities_source_idx
  on public.crm_activities (source);

notify pgrst, 'reload schema';
