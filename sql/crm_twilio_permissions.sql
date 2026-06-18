-- Twilio voice permissions. Run once after sql/crm_position_permissions.sql.

insert into public.crm_permission_defs (key, label, description, group_key, group_label, sort_order)
values
  ('calls.place', 'Place Twilio calls', 'Start outbound click-to-call from a customer profile.', 'calls', 'Phone calls', 350),
  ('calls.listen', 'Play call recordings', 'Listen to recorded Twilio calls in the activity log.', 'calls', 'Phone calls', 360)
on conflict (key) do update
set
  label = excluded.label,
  description = excluded.description,
  group_key = excluded.group_key,
  group_label = excluded.group_label,
  sort_order = excluded.sort_order;

-- Grant to every position that already has activities.log
insert into public.crm_position_permissions (position, permission_key)
select pp.position, d.key
from public.crm_position_permissions pp
cross join (
  select unnest(array['calls.place', 'calls.listen']::text[]) as key
) d
where pp.permission_key = 'activities.log'
on conflict do nothing;

notify pgrst, 'reload schema';
