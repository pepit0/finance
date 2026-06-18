-- White-label shell: footer text and tenant-reported app version (additive).
-- Safe for existing rows: empty footer falls back to header title / "CRM" in the UI.

alter table public.crm_org_settings
  add column if not exists footer_text text not null default '',
  add column if not exists app_version text not null default '0.0.0';

comment on column public.crm_org_settings.footer_text is
  'Optional footer brand line; empty uses header_title then generic CRM.';
comment on column public.crm_org_settings.app_version is
  'Last applied release version for this tenant (see docs/UPGRADE.md).';
