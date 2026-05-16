-- Run once on the CRM Supabase project (after crm_public_preapproval_leads.sql and crm_directory_delegated_admins.sql).
-- Directory admins can remove web pre-approval audit rows from the Web leads tab.
-- Deleting a row also removes linked crm_system_leads rows (FK on preapproval_lead_id); customer profiles are kept.

grant delete on table public.crm_public_preapproval_leads to authenticated;

drop policy if exists crm_public_preapproval_leads_delete on public.crm_public_preapproval_leads;

create policy crm_public_preapproval_leads_delete on public.crm_public_preapproval_leads
  for delete to authenticated
  using (public.user_has_crm_access() and public.crm_user_directory_admin());

create or replace function public.delete_crm_public_preapproval_lead(p_lead_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted int;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'error', 'You must be signed in.');
  end if;

  if not public.user_has_crm_access() then
    return jsonb_build_object('ok', false, 'error', 'You do not have CRM access.');
  end if;

  if not public.crm_user_directory_admin() then
    return jsonb_build_object('ok', false, 'error', 'Only directory admins can remove web leads.');
  end if;

  if p_lead_id is null then
    return jsonb_build_object('ok', false, 'error', 'Lead id is required.');
  end if;

  delete from public.crm_public_preapproval_leads
  where id = p_lead_id;

  get diagnostics v_deleted = row_count;

  if v_deleted = 0 then
    return jsonb_build_object('ok', false, 'error', 'Web lead not found or already removed.');
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.clear_crm_public_preapproval_leads_admin()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted int;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'error', 'You must be signed in.');
  end if;

  if not public.user_has_crm_access() then
    return jsonb_build_object('ok', false, 'error', 'You do not have CRM access.');
  end if;

  if not public.crm_user_directory_admin() then
    return jsonb_build_object('ok', false, 'error', 'Only directory admins can clear web leads.');
  end if;

  delete from public.crm_public_preapproval_leads;

  get diagnostics v_deleted = row_count;

  return jsonb_build_object('ok', true, 'deleted', v_deleted);
end;
$$;

revoke all on function public.delete_crm_public_preapproval_lead(uuid) from public;
revoke all on function public.clear_crm_public_preapproval_leads_admin() from public;

grant execute on function public.delete_crm_public_preapproval_lead(uuid) to authenticated;
grant execute on function public.clear_crm_public_preapproval_leads_admin() to authenticated;

notify pgrst, 'reload schema';
