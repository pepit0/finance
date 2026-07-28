-- Feath Board bug report screenshots (product-site/feath-board)
-- Run in Supabase SQL Editor after sql/feath_board.sql

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'feath-board-bug-attachments',
  'feath-board-bug-attachments',
  true,
  4194304,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists feath_board_bug_attachments_select on storage.objects;
drop policy if exists feath_board_bug_attachments_insert on storage.objects;
drop policy if exists feath_board_bug_attachments_update on storage.objects;
drop policy if exists feath_board_bug_attachments_delete on storage.objects;

create policy feath_board_bug_attachments_select on storage.objects
  for select to authenticated
  using (bucket_id = 'feath-board-bug-attachments');

create policy feath_board_bug_attachments_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'feath-board-bug-attachments'
    and (storage.foldername(name))[1] = 'burd'
    and (storage.foldername(name))[2] = 'bugs'
  );

create policy feath_board_bug_attachments_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'feath-board-bug-attachments'
    and (storage.foldername(name))[1] = 'burd'
    and (storage.foldername(name))[2] = 'bugs'
  )
  with check (
    bucket_id = 'feath-board-bug-attachments'
    and (storage.foldername(name))[1] = 'burd'
    and (storage.foldername(name))[2] = 'bugs'
  );

create policy feath_board_bug_attachments_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'feath-board-bug-attachments'
    and (storage.foldername(name))[1] = 'burd'
    and (storage.foldername(name))[2] = 'bugs'
  );

notify pgrst, 'reload schema';
