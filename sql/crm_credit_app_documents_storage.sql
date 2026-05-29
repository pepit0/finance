-- Private bucket for credit application document uploads (driver's licence, paystubs, trade registration).
-- Run once in the **CRM** Supabase project (same project as VITE_SUPABASE_URL in .env.local).
-- Requires public.user_has_crm_access() from sql/crm_security.sql.
--
-- PRIVACY (how access is blocked from the outside):
-- 1. Bucket public = false → no /storage/v1/object/public/... URLs; files are not web-visible.
-- 2. RLS on storage.objects → only role "authenticated" AND user_has_crm_access() may read/write/delete.
-- 3. No policies for anon or public → marketing site visitors / anonymous API keys cannot list or download.
-- 4. CRM app uses short-lived signed URLs (see src/lib/crmCreditAppDocuments.ts) created only while signed in.
-- 5. File paths include a random UUID; paths stored in crm_customers.profile_metadata (CRM RLS only).
--
-- After running, confirm in Dashboard → Storage → crm-credit-app-documents:
--   Public bucket = OFF. Do not enable "Public bucket" in the dashboard.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'crm-credit-app-documents',
  'crm-credit-app-documents',
  false,
  12582912,
  null
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Remove any non-CRM policies that might have been attached to this bucket (e.g. "public read" templates).
do $$
declare
  pol record;
begin
  for pol in
    select policyname
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname not like 'crm_credit_app_docs_%'
      and (
        coalesce(qual, '') ilike '%crm-credit-app-documents%'
        or coalesce(with_check, '') ilike '%crm-credit-app-documents%'
      )
  loop
    execute format('drop policy if exists %I on storage.objects', pol.policyname);
    raise notice 'Dropped storage policy % on crm-credit-app-documents bucket', pol.policyname;
  end loop;
end;
$$;

drop policy if exists crm_credit_app_docs_select on storage.objects;
drop policy if exists crm_credit_app_docs_insert on storage.objects;
drop policy if exists crm_credit_app_docs_update on storage.objects;
drop policy if exists crm_credit_app_docs_delete on storage.objects;

-- SELECT: required for signed download/view URLs; CRM staff only.
create policy crm_credit_app_docs_select on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'crm-credit-app-documents'
    and public.user_has_crm_access()
  );

create policy crm_credit_app_docs_insert on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'crm-credit-app-documents'
    and public.user_has_crm_access()
  );

create policy crm_credit_app_docs_update on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'crm-credit-app-documents'
    and public.user_has_crm_access()
  )
  with check (
    bucket_id = 'crm-credit-app-documents'
    and public.user_has_crm_access()
  );

create policy crm_credit_app_docs_delete on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'crm-credit-app-documents'
    and public.user_has_crm_access()
  );

-- Sanity check: bucket must stay private.
do $$
begin
  if exists (
    select 1
    from storage.buckets
    where id = 'crm-credit-app-documents'
      and public is true
  ) then
    raise exception 'crm-credit-app-documents must not be public. Turn off Public bucket in Storage settings.';
  end if;
end;
$$;

-- Optional verification (expect one row, public = false):
-- select id, name, public from storage.buckets where id = 'crm-credit-app-documents';
