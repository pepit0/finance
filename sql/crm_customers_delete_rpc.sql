-- Run once on the CRM Supabase project (after crm_security.sql and crm_directory_delegated_admins.sql).
-- Reliable customer delete: directory admins OR the user who created the row.
-- Works even if crm_customers_delete RLS was not updated yet (uses SECURITY DEFINER).

create or replace function public.delete_crm_customer(p_customer_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_deleted int;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'You must be signed in.');
  end if;

  if not public.user_has_crm_access() then
    return jsonb_build_object('ok', false, 'error', 'You do not have CRM access.');
  end if;

  if p_customer_id is null then
    return jsonb_build_object('ok', false, 'error', 'Customer id is required.');
  end if;

  delete from public.crm_customers c
  where c.id = p_customer_id
    and (
      public.crm_user_directory_admin()
      or c.created_by = v_uid
    );

  get diagnostics v_deleted = row_count;

  if v_deleted = 0 then
    if not exists (select 1 from public.crm_customers c where c.id = p_customer_id) then
      return jsonb_build_object('ok', false, 'error', 'Customer not found or already deleted.');
    end if;
    return jsonb_build_object(
      'ok',
      false,
      'error',
      'You do not have permission to delete this customer. Directory admins can delete any profile; others may only delete customers they created.'
    );
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.delete_crm_customer(uuid) from public;
grant execute on function public.delete_crm_customer(uuid) to authenticated;

notify pgrst, 'reload schema';
