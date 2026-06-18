-- Team profile photos (self-upload only). Run once in the CRM Supabase SQL Editor.
-- Requires: sql/crm_security.sql, sql/crm_user_directory_positions.sql

alter table public.crm_user_directory
  add column if not exists avatar_path text;

-- ---------------------------------------------------------------------------
-- Storage bucket (public URLs; paths are user UUIDs — not guessable)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'crm-team-avatars',
  'crm-team-avatars',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists crm_team_avatars_select on storage.objects;
drop policy if exists crm_team_avatars_insert on storage.objects;
drop policy if exists crm_team_avatars_update on storage.objects;
drop policy if exists crm_team_avatars_delete on storage.objects;

create policy crm_team_avatars_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'crm-team-avatars'
    and public.user_has_crm_access()
  );

create policy crm_team_avatars_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'crm-team-avatars'
    and public.user_has_crm_access()
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy crm_team_avatars_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'crm-team-avatars'
    and public.user_has_crm_access()
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'crm-team-avatars'
    and public.user_has_crm_access()
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy crm_team_avatars_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'crm-team-avatars'
    and public.user_has_crm_access()
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------------
-- Only the signed-in user may change their own avatar_path column
-- ---------------------------------------------------------------------------

create or replace function public.crm_user_directory_protect_identifiers()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if tg_op <> 'UPDATE' then
    return new;
  end if;

  if new.user_id is distinct from old.user_id or new.email is distinct from old.email then
    raise exception 'Cannot change user_id or email';
  end if;

  if new.avatar_path is distinct from old.avatar_path then
    if old.user_id is distinct from auth.uid() then
      raise exception 'You can only change your own profile photo';
    end if;
  end if;

  if new.position is distinct from old.position then
    if public.crm_user_directory_master() then
      null;
    elsif old.user_id = auth.uid() then
      raise exception 'Cannot change your own position';
    elsif public.crm_user_directory_caller_rank() <= public.crm_user_directory_position_rank(old.position) then
      raise exception 'Insufficient authority to change this user''s position';
    elsif public.crm_user_directory_position_rank(new.position) >= public.crm_user_directory_caller_rank() then
      raise exception 'Cannot assign a position equal to or above your own';
    end if;
  end if;

  return new;
end;
$$;

notify pgrst, 'reload schema';
