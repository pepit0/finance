-- Tab idle style: empty (no border) or outline. Run once after sql/crm_org_settings_control_style.sql.
-- Drop the old check first so filled -> empty updates are allowed.

alter table public.crm_org_settings
  drop constraint if exists crm_org_settings_tab_idle_style_check;

update public.crm_org_settings
set tab_idle_style = 'empty'
where tab_idle_style = 'filled';

update public.crm_org_settings
set tab_idle_style = 'outline'
where tab_idle_style not in ('empty', 'outline');

alter table public.crm_org_settings
  alter column tab_idle_style set default 'outline';

alter table public.crm_org_settings
  add constraint crm_org_settings_tab_idle_style_check
    check (tab_idle_style in ('empty', 'outline'));

notify pgrst, 'reload schema';
