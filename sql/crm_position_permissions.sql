-- Position-based CRM permissions. Run once in Supabase SQL Editor as postgres.
-- Requires: sql/crm_user_directory_positions.sql
--
-- Master always has every permission. Master can flag users as permissions admins
-- (is_permissions_admin) who may edit the permission matrix for each position.

-- ---------------------------------------------------------------------------
-- Catalog
-- ---------------------------------------------------------------------------

create table if not exists public.crm_permission_defs (
  key text primary key check (key ~ '^[a-z][a-z0-9_.]{0,63}$'),
  label text not null check (char_length(trim(label)) >= 1),
  description text not null default '',
  group_key text not null,
  group_label text not null,
  sort_order integer not null default 0
);

alter table public.crm_permission_defs drop constraint if exists crm_permission_defs_key_check;

alter table public.crm_permission_defs
  add constraint crm_permission_defs_key_check check (key ~ '^[a-z][a-z0-9_.]{0,63}$');

create table if not exists public.crm_position_permissions (
  position text not null,
  permission_key text not null references public.crm_permission_defs (key) on delete cascade,
  primary key (position, permission_key),
  constraint crm_position_permissions_position_check check (
    position in (
      'general_manager',
      'general_sales_manager',
      'sales_manager',
      'finance_manager',
      'sales'
    )
  )
);

create index if not exists crm_position_permissions_position_idx
  on public.crm_position_permissions (position);

-- ---------------------------------------------------------------------------
-- Permissions admin flag on directory users
-- ---------------------------------------------------------------------------

alter table public.crm_user_directory
  add column if not exists is_permissions_admin boolean not null default false;

-- ---------------------------------------------------------------------------
-- Permission definitions
-- ---------------------------------------------------------------------------

insert into public.crm_permission_defs (key, label, description, group_key, group_label, sort_order)
values
  ('admin.access', 'Admin access', 'Broad elevated access (delete, moderation, legacy admin features).', 'admin', 'Administration', 10),
  ('admin.manage_permissions', 'Manage permissions', 'Edit which permissions each position has.', 'admin', 'Administration', 20),
  ('admin.grant_permission_admins', 'Grant permission admins', 'Designate other users as permission administrators.', 'admin', 'Administration', 30),

  ('customers.view_all', 'View all customers', 'See every customer in the CRM, not only assigned leads.', 'customers', 'Customers', 110),
  ('customers.create', 'Create customers', 'Add new customer profiles.', 'customers', 'Customers', 120),
  ('customers.edit_any', 'Edit any customer', 'Edit profile and details for any customer.', 'customers', 'Customers', 130),
  ('customers.edit_assigned', 'Edit assigned customers', 'Edit customers assigned to you.', 'customers', 'Customers', 140),
  ('customers.delete', 'Delete customers', 'Permanently delete customer profiles.', 'customers', 'Customers', 150),
  ('customers.assign_any', 'Assign any customer', 'Change assignee to any team member.', 'customers', 'Customers', 160),
  ('customers.assign_team', 'Assign within team', 'Reassign customers among staff you manage.', 'customers', 'Customers', 170),
  ('customers.mark_lost', 'Mark lost', 'Move active customers to lost status.', 'customers', 'Customers', 180),
  ('customers.restore_lost', 'Restore lost', 'Restore lost customers back to active.', 'customers', 'Customers', 190),
  ('customers.change_pipeline', 'Change pipeline stage', 'Update customer pipeline stage.', 'customers', 'Customers', 200),
  ('customers.view_credit_app', 'View credit application', 'Open and read credit application info.', 'customers', 'Customers', 210),
  ('customers.edit_credit_app', 'Edit credit application', 'Update credit application fields and documents.', 'customers', 'Customers', 220),
  ('customers.upload_documents', 'Upload credit documents', 'Upload licence, paystubs, and trade registration files.', 'customers', 'Customers', 230),
  ('customers.view_edit_history', 'View edit history', 'See customer profile and credit app change history.', 'customers', 'Customers', 240),

  ('activities.log', 'Log activities', 'Log calls, texts, and comments on customers.', 'activities', 'Activities', 310),
  ('activities.delete_any', 'Delete any activity', 'Remove call, text, or comment entries for moderation.', 'activities', 'Activities', 320),
  ('activities.delete_own', 'Delete own activity', 'Remove your own activity entries.', 'activities', 'Activities', 330),

  ('tasks.view_all', 'View all tasks', 'See every customer task in the CRM.', 'tasks', 'Tasks', 410),
  ('tasks.view_team', 'View team tasks', 'See tasks for your team members.', 'tasks', 'Tasks', 420),
  ('tasks.create', 'Create tasks', 'Create call, appointment, and other tasks.', 'tasks', 'Tasks', 430),
  ('tasks.edit_any', 'Edit any task', 'Edit or complete tasks for any user.', 'tasks', 'Tasks', 440),
  ('tasks.complete_assigned', 'Complete assigned tasks', 'Complete tasks assigned to you.', 'tasks', 'Tasks', 450),

  ('lenders.view', 'View lender outcomes', 'See lender decision rail on customers.', 'lenders', 'Lenders & finance', 510),
  ('lenders.edit_outcomes', 'Edit lender outcomes', 'Set approved, conditional, declined, or pending per lender.', 'lenders', 'Lenders & finance', 520),

  ('leads.view', 'View system leads', 'Access the system leads inbox.', 'leads', 'System leads', 610),
  ('leads.assign', 'Assign system leads', 'Assign web and marketing leads to staff.', 'leads', 'System leads', 620),
  ('leads.delete', 'Delete system leads', 'Remove system lead records.', 'leads', 'System leads', 630),

  ('team.view_directory', 'View team directory', 'See the team members list.', 'team', 'Team', 710),
  ('team.edit_own_display_name', 'Edit own display name', 'Change your name shown in the CRM.', 'team', 'Team', 720),
  ('team.edit_any_display_name', 'Edit any display name', 'Change display names for team members.', 'team', 'Team', 730),
  ('team.assign_positions', 'Assign positions', 'Change job positions for team members below your rank.', 'team', 'Team', 740),

  ('todo.view_own', 'View own to-do list', 'Use your daily to-do checklist.', 'todo', 'To-do lists', 810),
  ('todo.admin_others', 'Manage others'' to-do', 'View and edit other users'' daily to-do lists.', 'todo', 'To-do lists', 820),
  ('todo.manage_templates', 'Manage to-do templates', 'Edit default to-do templates for the team.', 'todo', 'To-do lists', 830),

  ('settings.branding', 'CRM branding settings', 'Change accent color, watermark, and header icon.', 'settings', 'Settings', 910),
  ('settings.pipeline', 'Pipeline settings', 'Configure pipeline stages, colors, and order.', 'settings', 'Settings', 920),

  ('notifications.dismiss_any', 'Dismiss any notification', 'Clear alerts for any customer or assignee.', 'tools', 'Tools', 1010),
  ('reports.print_lead_sheet', 'Print lead sheets', 'Print lead sheets from customer activity.', 'tools', 'Tools', 1020)
on conflict (key) do update
set
  label = excluded.label,
  description = excluded.description,
  group_key = excluded.group_key,
  group_label = excluded.group_label,
  sort_order = excluded.sort_order;

-- ---------------------------------------------------------------------------
-- Default grants (mirrors prior manager = admin behavior)
-- ---------------------------------------------------------------------------

insert into public.crm_position_permissions (position, permission_key)
select p.position, d.key
from (
  values
    ('general_manager'::text),
    ('general_sales_manager'),
    ('sales_manager'),
    ('finance_manager'),
    ('sales')
) as p (position)
cross join public.crm_permission_defs d
where p.position = 'general_manager'
on conflict do nothing;

insert into public.crm_position_permissions (position, permission_key)
select 'general_sales_manager', key
from public.crm_permission_defs
where key not in ('settings.branding', 'admin.grant_permission_admins')
on conflict do nothing;

insert into public.crm_position_permissions (position, permission_key)
select 'sales_manager', unnest(array[
  'admin.access',
  'customers.view_all', 'customers.create', 'customers.edit_any', 'customers.delete',
  'customers.assign_any', 'customers.assign_team', 'customers.mark_lost', 'customers.restore_lost',
  'customers.change_pipeline', 'customers.view_credit_app', 'customers.edit_credit_app',
  'customers.upload_documents', 'customers.view_edit_history',
  'activities.log', 'activities.delete_any', 'activities.delete_own',
  'tasks.view_all', 'tasks.view_team', 'tasks.create', 'tasks.edit_any', 'tasks.complete_assigned',
  'lenders.view', 'lenders.edit_outcomes',
  'leads.view', 'leads.assign',
  'team.view_directory', 'team.edit_own_display_name', 'team.edit_any_display_name', 'team.assign_positions',
  'todo.view_own', 'todo.admin_others',
  'settings.pipeline',
  'notifications.dismiss_any', 'reports.print_lead_sheet'
]::text[])
on conflict do nothing;

insert into public.crm_position_permissions (position, permission_key)
select 'finance_manager', unnest(array[
  'admin.access',
  'customers.view_all', 'customers.create', 'customers.edit_any', 'customers.delete',
  'customers.assign_team', 'customers.mark_lost', 'customers.restore_lost', 'customers.change_pipeline',
  'customers.view_credit_app', 'customers.edit_credit_app', 'customers.upload_documents', 'customers.view_edit_history',
  'activities.log', 'activities.delete_any', 'activities.delete_own',
  'tasks.view_all', 'tasks.view_team', 'tasks.create', 'tasks.edit_any', 'tasks.complete_assigned',
  'lenders.view', 'lenders.edit_outcomes',
  'leads.view',
  'team.view_directory', 'team.edit_own_display_name', 'team.edit_any_display_name',
  'todo.view_own', 'todo.admin_others',
  'notifications.dismiss_any', 'reports.print_lead_sheet'
]::text[])
on conflict do nothing;

insert into public.crm_position_permissions (position, permission_key)
select 'sales', unnest(array[
  'customers.edit_assigned', 'customers.change_pipeline', 'customers.view_credit_app',
  'customers.mark_lost',
  'activities.log', 'activities.delete_own',
  'tasks.view_team', 'tasks.create', 'tasks.complete_assigned',
  'lenders.view',
  'team.view_directory', 'team.edit_own_display_name',
  'todo.view_own',
  'reports.print_lead_sheet'
]::text[])
on conflict do nothing;

-- General managers may manage permissions by default
insert into public.crm_position_permissions (position, permission_key)
values ('general_manager', 'admin.manage_permissions')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.crm_user_is_permissions_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.crm_user_directory_master()
    or coalesce(
      (
        select d.is_permissions_admin
        from public.crm_user_directory d
        where d.user_id = auth.uid()
      ),
      false
    );
$$;

grant execute on function public.crm_user_is_permissions_admin() to authenticated;

create or replace function public.crm_user_has_permission(p_permission_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.crm_user_directory_master()
    or exists (
      select 1
      from public.crm_user_directory d
      inner join public.crm_position_permissions pp
        on pp.position = d.position
       and pp.permission_key = p_permission_key
      where d.user_id = auth.uid()
    );
$$;

grant execute on function public.crm_user_has_permission(text) to authenticated;

create or replace function public.crm_user_permission_keys()
returns text[]
language sql
stable
security definer
set search_path = public
as $$
  select case
    when public.crm_user_directory_master() then
      array(select key from public.crm_permission_defs order by sort_order, key)
    else coalesce(
      (
        select array_agg(pp.permission_key order by pd.sort_order, pd.key)
        from public.crm_user_directory d
        inner join public.crm_position_permissions pp on pp.position = d.position
        inner join public.crm_permission_defs pd on pd.key = pp.permission_key
        where d.user_id = auth.uid()
      ),
      array[]::text[]
    )
  end;
$$;

grant execute on function public.crm_user_permission_keys() to authenticated;

-- Replace flat manager check with permission-based admin access
create or replace function public.crm_user_directory_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.crm_user_directory_master()
    or public.crm_user_has_permission('admin.access');
$$;

grant execute on function public.crm_user_directory_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.crm_permission_defs enable row level security;
alter table public.crm_position_permissions enable row level security;

revoke all on table public.crm_permission_defs from public, anon;
revoke all on table public.crm_position_permissions from public, anon;

drop policy if exists crm_permission_defs_select on public.crm_permission_defs;
drop policy if exists crm_position_permissions_select on public.crm_position_permissions;
drop policy if exists crm_position_permissions_insert on public.crm_position_permissions;
drop policy if exists crm_position_permissions_delete on public.crm_position_permissions;

create policy crm_permission_defs_select on public.crm_permission_defs
  for select to authenticated
  using (public.user_has_crm_access());

create policy crm_position_permissions_select on public.crm_position_permissions
  for select to authenticated
  using (public.user_has_crm_access());

create policy crm_position_permissions_insert on public.crm_position_permissions
  for insert to authenticated
  with check (
    public.user_has_crm_access()
    and public.crm_user_is_permissions_admin()
  );

create policy crm_position_permissions_delete on public.crm_position_permissions
  for delete to authenticated
  using (
    public.user_has_crm_access()
    and public.crm_user_is_permissions_admin()
  );

grant select on table public.crm_permission_defs to authenticated;
grant select, insert, delete on table public.crm_position_permissions to authenticated;

-- ---------------------------------------------------------------------------
-- Protect is_permissions_admin (master only)
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

  if new.is_permissions_admin is distinct from old.is_permissions_admin then
    if not public.crm_user_directory_master() then
      raise exception 'Only the master account can change permission admin status';
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
