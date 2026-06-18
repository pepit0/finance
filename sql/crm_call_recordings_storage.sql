-- Private bucket for Twilio call recordings (service-role writes; CRM staff read via signed URLs).
-- Run once after sql/crm_security.sql and sql/crm_activities_twilio_calls.sql.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'crm-call-recordings',
  'crm-call-recordings',
  false,
  52428800,
  array['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/mp3']::text[]
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists crm_call_recordings_select on storage.objects;
drop policy if exists crm_call_recordings_insert on storage.objects;
drop policy if exists crm_call_recordings_update on storage.objects;
drop policy if exists crm_call_recordings_delete on storage.objects;

create policy crm_call_recordings_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'crm-call-recordings'
    and public.user_has_crm_access()
  );

-- Inserts/updates/deletes are performed with the service role from Edge Functions only.

notify pgrst, 'reload schema';
