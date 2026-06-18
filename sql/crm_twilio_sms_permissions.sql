-- Twilio SMS permissions. Run once after sql/crm_position_permissions.sql.

insert into public.crm_permission_defs (key, label, description, group_key, group_label, sort_order)
values
  ('texts.view', 'View SMS chat', 'Open the Chat tab and read SMS threads.', 'texts', 'Text messaging', 370),
  ('texts.send', 'Send SMS', 'Send outbound text messages to customers from the CRM.', 'texts', 'Text messaging', 380),
  ('texts.admin_inboxes', 'View team inboxes', 'Browse SMS inboxes for other CRM users.', 'texts', 'Text messaging', 390)
on conflict (key) do update
set
  label = excluded.label,
  description = excluded.description,
  group_key = excluded.group_key,
  group_label = excluded.group_label,
  sort_order = excluded.sort_order;

insert into public.crm_position_permissions (position, permission_key)
select pp.position, d.key
from public.crm_position_permissions pp
cross join (
  select unnest(array['texts.view', 'texts.send']::text[]) as key
) d
where pp.permission_key = 'activities.log'
on conflict do nothing;

insert into public.crm_position_permissions (position, permission_key)
select pp.position, 'texts.admin_inboxes'
from public.crm_position_permissions pp
where pp.permission_key = 'todo.admin_others'
on conflict do nothing;

notify pgrst, 'reload schema';
