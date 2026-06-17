-- CRM branding uploads (background watermark + header icon PNGs).
-- Run once in Supabase SQL Editor as postgres after sql/crm_org_settings.sql.

alter table public.crm_org_settings
  add column if not exists background_image_path text,
  add column if not exists header_icon_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'crm-branding',
  'crm-branding',
  true,
  4194304,
  array['image/png']::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists crm_branding_read on storage.objects;
drop policy if exists crm_branding_master_insert on storage.objects;
drop policy if exists crm_branding_master_update on storage.objects;
drop policy if exists crm_branding_master_delete on storage.objects;

create policy crm_branding_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'crm-branding'
    and public.user_has_crm_access()
  );

create policy crm_branding_master_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'crm-branding'
    and public.crm_user_directory_master()
  );

create policy crm_branding_master_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'crm-branding'
    and public.crm_user_directory_master()
  )
  with check (
    bucket_id = 'crm-branding'
    and public.crm_user_directory_master()
  );

create policy crm_branding_master_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'crm-branding'
    and public.crm_user_directory_master()
  );

notify pgrst, 'reload schema';
