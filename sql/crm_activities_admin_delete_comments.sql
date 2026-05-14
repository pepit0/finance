-- Run once in Supabase SQL Editor for existing CRM databases.
-- Lets directory admins (master + crm_directory_admins) delete call, comment, or text activities for moderation.
-- Requires crm_user_directory_admin() from sql/crm_directory_delegated_admins.sql (or full crm_security.sql).

drop policy if exists crm_activities_delete on public.crm_activities;

create policy crm_activities_delete on public.crm_activities
  for delete to authenticated
  using (
    public.user_has_crm_access()
    and (
      author_id = auth.uid()
      or public.crm_user_directory_admin()
    )
  );

notify pgrst, 'reload schema';
