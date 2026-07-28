-- Public branding for the CRM login screen (no session required).
-- Run once after sql/crm_org_settings_header_copy.sql (or any migration that adds color_mode / header copy).

create or replace function public.crm_public_login_branding()
returns json
language sql
stable
security definer
set search_path = public
as $$
  select json_build_object(
    'accent_color', s.accent_color,
    'color_mode', coalesce(s.color_mode, 'dark'),
    'header_title', coalesce(nullif(trim(s.header_title), ''), 'CRM'),
    'header_subtitle', coalesce(s.header_subtitle, '')
  )
  from public.crm_org_settings s
  where s.id = 'default';
$$;

revoke all on function public.crm_public_login_branding() from public;
grant execute on function public.crm_public_login_branding() to anon, authenticated;

notify pgrst, 'reload schema';
