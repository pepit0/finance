-- Run once in Supabase SQL Editor for existing CRM databases.
-- Lets directory admins (master + crm_directory_admins) delete any customer row for moderation.
-- Staff may still delete customers they created (existing policy behavior).
-- Requires crm_user_directory_admin() from sql/crm_directory_delegated_admins.sql.

drop policy if exists crm_customers_delete on public.crm_customers;

create policy crm_customers_delete on public.crm_customers
  for delete to authenticated
  using (
    public.user_has_crm_access()
    and (
      created_by = auth.uid()
      or public.crm_user_directory_admin()
    )
  );

-- Prefer delete_crm_customer() RPC (sql/crm_customers_delete_rpc.sql) for consistent permission checks.
-- This policy still helps direct table DELETE from the client.

notify pgrst, 'reload schema';
