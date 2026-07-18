# SQL migrations manifest

Run files in **order** on a **fresh** Supabase project. For existing tenants, run only files not yet applied (see [UPGRADE.md](UPGRADE.md)).

Reference: [WHITE_LABEL_LICENSING_PLAN.md](WHITE_LABEL_LICENSING_PLAN.md)

**Quick workflow in Cursor:** keep this file open on the left. **Ctrl+click** a file link (or right-click → Open) → **Ctrl+A**, **Ctrl+C** → paste into Supabase SQL Editor → Run. Then the next row.

**Even faster:** **Ctrl+P**, type the filename (e.g. `crm_security`), Enter → copy → paste → Run.

## 1. Core security & CRM base

| Order | File | Purpose |
|------:|------|---------|
| 1 | [sql/crm_security.sql](../sql/crm_security.sql) | RLS, `user_has_crm_access`, allowlist |
| 2 | [sql/crm_install_rpc_and_reload.sql](../sql/crm_install_rpc_and_reload.sql) | PostgREST schema reload helper |
| 3 | [sql/crm_customers_extend.sql](../sql/crm_customers_extend.sql) | Extra customer columns |
| 4 | [sql/crm_customers_status_and_activity_author.sql](../sql/crm_customers_status_and_activity_author.sql) | Status, `last_call_at`, activity author |
| 5 | [sql/crm_customers_assign_directory_author_trigger.sql](../sql/crm_customers_assign_directory_author_trigger.sql) | Assignment, directory, author trigger |
| 6 | [sql/crm_user_directory_display_name_admin.sql](../sql/crm_user_directory_display_name_admin.sql) | Display names, directory admin RLS |
| 7 | [sql/crm_user_directory_positions.sql](../sql/crm_user_directory_positions.sql) | Team positions |
| 8 | [sql/crm_directory_set_master_email.sql](../sql/crm_directory_set_master_email.sql) | Set master email (edit before run) |
| 9 | [sql/crm_customers_delete_rpc.sql](../sql/crm_customers_delete_rpc.sql) | Customer delete RPC |
| 10 | [sql/crm_customers_admin_delete.sql](../sql/crm_customers_admin_delete.sql) | Admin delete RLS |
| 11 | [sql/crm_activities_admin_delete_comments.sql](../sql/crm_activities_admin_delete_comments.sql) | Admin delete comments |
| 12 | [sql/crm_activities_kind_text.sql](../sql/crm_activities_kind_text.sql) | Activity kind `text` |
| 13 | [sql/crm_customers_creator_assign_and_email.sql](../sql/crm_customers_creator_assign_and_email.sql) | Creator snapshot, default assignee |
| 14 | [sql/crm_user_has_crm_access_hotfix.sql](../sql/crm_user_has_crm_access_hotfix.sql) | Access RPC hotfix (if needed) |

## 2. Leads, marketing bridge, notifications

| Order | File | Purpose |
|------:|------|---------|
| 16 | [sql/crm_public_preapproval_leads.sql](../sql/crm_public_preapproval_leads.sql) | Web leads table (CRM project) |
| 17 | [sql/crm_marketing_ingest_bridge.sql](../sql/crm_marketing_ingest_bridge.sql) | Marketing ingest bridge |
| 18 | [sql/crm_customers_system_website_creator.sql](../sql/crm_customers_system_website_creator.sql) | Website lead creator label |
| 19 | [sql/crm_marketing_ingest_phone_optional.sql](../sql/crm_marketing_ingest_phone_optional.sql) | Optional phone on ingest |
| 20 | [sql/crm_marketing_ingest_hotfix.sql](../sql/crm_marketing_ingest_hotfix.sql) | Ingest hotfix (if needed) |
| 21 | [sql/crm_marketing_website_lead_comment.sql](../sql/crm_marketing_website_lead_comment.sql) | Website lead comment |
| 22 | [sql/crm_public_preapproval_leads_admin_delete.sql](../sql/crm_public_preapproval_leads_admin_delete.sql) | Admin delete leads |
| 23 | [sql/crm_public_preapproval_leads_clear_all.sql](../sql/crm_public_preapproval_leads_clear_all.sql) | Clear-all RPC |
| 24 | [sql/crm_notifications_delete.sql](../sql/crm_notifications_delete.sql) | Dismiss notifications |
| 25 | [sql/crm_stale_lead_notifications.sql](../sql/crm_stale_lead_notifications.sql) | Stale lead alerts |
| 26 | [sql/crm_customer_edit_history.sql](../sql/crm_customer_edit_history.sql) | Edit audit trail |
| 27 | [sql/crm_customer_pipeline_stage.sql](../sql/crm_customer_pipeline_stage.sql) | Pipeline stage column |
| 28 | [sql/crm_customer_pipeline_stage_lost.sql](../sql/crm_customer_pipeline_stage_lost.sql) | Lost stage |
| 29 | [sql/crm_pipeline_stages.sql](../sql/crm_pipeline_stages.sql) | Editable pipeline stages |
| 30 | [sql/crm_customer_tasks.sql](../sql/crm_customer_tasks.sql) | Customer tasks |
| 31 | [sql/crm_credit_app_documents_storage.sql](../sql/crm_credit_app_documents_storage.sql) | Document storage bucket |

## 3. Pipeline, tasks, finance lenders

| Order | File | Purpose |
|------:|------|---------|
| 32 | [sql/crm_customer_lender_outcomes.sql](../sql/crm_customer_lender_outcomes.sql) | Lender outcomes |
| 32 | [sql/crm_customer_lender_outcome_pending.sql](../sql/crm_customer_lender_outcome_pending.sql) | Pending outcome state |
| 33 | [sql/crm_lenders.sql](../sql/crm_lenders.sql) | Lenders table |
| 34 | [sql/crm_lenders_dynamic.sql](../sql/crm_lenders_dynamic.sql) | Lender add/delete |

## 4. Permissions & directory

| Order | File | Purpose |
|------:|------|---------|
| 35 | [sql/crm_position_permissions.sql](../sql/crm_position_permissions.sql) | Position-based permissions |
| 36 | [sql/crm_directory_groups.sql](../sql/crm_directory_groups.sql) | Job-position groups |
| 37 | [sql/crm_directory_delegated_admins.sql](../sql/crm_directory_delegated_admins.sql) | Delegated admins |
| 38 | [sql/crm_team_avatars.sql](../sql/crm_team_avatars.sql) | Team avatars storage |

## 5. Org settings & branding

| Order | File | Purpose |
|------:|------|---------|
| 39 | [sql/crm_org_settings.sql](../sql/crm_org_settings.sql) | Base org settings row |
| 40 | [sql/crm_org_settings_branding.sql](../sql/crm_org_settings_branding.sql) | Accent, background, icon |
| 41 | [sql/crm_org_settings_color_mode.sql](../sql/crm_org_settings_color_mode.sql) | Light/dark mode |
| 42 | [sql/crm_org_settings_header_copy.sql](../sql/crm_org_settings_header_copy.sql) | Header title/subtitle |
| 43 | [sql/crm_org_settings_control_style.sql](../sql/crm_org_settings_control_style.sql) | Button/tab shapes |
| 44 | [sql/crm_org_settings_field_shape.sql](../sql/crm_org_settings_field_shape.sql) | Field shape |
| 45 | [sql/crm_org_settings_page_outline_shape.sql](../sql/crm_org_settings_page_outline_shape.sql) | Page outline |
| 46 | [sql/crm_org_settings_tab_idle_empty.sql](../sql/crm_org_settings_tab_idle_empty.sql) | Tab idle empty style |
| 47 | [sql/crm_org_settings_header_layout.sql](../sql/crm_org_settings_header_layout.sql) | Header layout |
| 48 | [sql/crm_org_settings_header_logo_align.sql](../sql/crm_org_settings_header_logo_align.sql) | Logo alignment |
| 49 | [sql/crm_org_settings_header_logo_align_default.sql](../sql/crm_org_settings_header_logo_align_default.sql) | Logo align default |
| 50 | [sql/crm_org_settings_header_title_align.sql](../sql/crm_org_settings_header_title_align.sql) | Title alignment |
| 51 | [sql/crm_org_settings_sidebar_panel_style.sql](../sql/crm_org_settings_sidebar_panel_style.sql) | Sidebar panel style |
| 52 | [sql/crm_org_settings_scrollbar_style.sql](../sql/crm_org_settings_scrollbar_style.sql) | Scrollbar style |
| 53 | [sql/crm_org_settings_scrollbar_shape.sql](../sql/crm_org_settings_scrollbar_shape.sql) | Scrollbar shape |
| 54 | [sql/crm_org_settings_scrollbar_width.sql](../sql/crm_org_settings_scrollbar_width.sql) | Scrollbar width |
| 55 | [sql/crm_org_settings_label_colors.sql](../sql/crm_org_settings_label_colors.sql) | Label/badge colors |
| 56 | [sql/crm_org_settings_finance_enabled.sql](../sql/crm_org_settings_finance_enabled.sql) | Finance tab toggle |
| 57 | [sql/crm_org_settings_admin_whitelist.sql](../sql/crm_org_settings_admin_whitelist.sql) | Admin whitelist |
| 58 | [sql/crm_org_settings_outbound_call_pipeline.sql](../sql/crm_org_settings_outbound_call_pipeline.sql) | Outbound call pipeline |
| 59 | [sql/crm_org_settings_inbound_fallback_phone.sql](../sql/crm_org_settings_inbound_fallback_phone.sql) | Inbound fallback phone |
| 60 | [sql/crm_org_settings_product_shell.sql](../sql/crm_org_settings_product_shell.sql) | Footer text, `app_version` |

## 6. Twilio voice & SMS

| Order | File | Purpose |
|------:|------|---------|
| 61 | [sql/crm_user_directory_callback_phone.sql](../sql/crm_user_directory_callback_phone.sql) | Callback phone per user |
| 62 | [sql/crm_activities_twilio_calls.sql](../sql/crm_activities_twilio_calls.sql) | Call activities |
| 63 | [sql/crm_phone_call_sessions.sql](../sql/crm_phone_call_sessions.sql) | Call sessions |
| 64 | [sql/crm_phone_call_sessions_dial_call_sid.sql](../sql/crm_phone_call_sessions_dial_call_sid.sql) | Dial call SID |
| 65 | [sql/crm_phone_call_sessions_inbound_auto_customer.sql](../sql/crm_phone_call_sessions_inbound_auto_customer.sql) | Inbound auto-customer |
| 66 | [sql/crm_phone_call_sessions_voice_webhook_url.sql](../sql/crm_phone_call_sessions_voice_webhook_url.sql) | Voice webhook URL |
| 67 | [sql/crm_call_outcome.sql](../sql/crm_call_outcome.sql) | Call outcome |
| 68 | [sql/crm_call_recordings_storage.sql](../sql/crm_call_recordings_storage.sql) | Recordings bucket |
| 69 | [sql/crm_twilio_permissions.sql](../sql/crm_twilio_permissions.sql) | Voice permissions |
| 70 | [sql/crm_activities_twilio_sms.sql](../sql/crm_activities_twilio_sms.sql) | SMS activities |
| 71 | [sql/crm_sms_threads.sql](../sql/crm_sms_threads.sql) | SMS threads |
| 72 | [sql/crm_sms_read_cursors.sql](../sql/crm_sms_read_cursors.sql) | Read cursors |
| 73 | [sql/crm_customers_last_text_at.sql](../sql/crm_customers_last_text_at.sql) | `last_text_at` |
| 74 | [sql/crm_twilio_sms_permissions.sql](../sql/crm_twilio_sms_permissions.sql) | SMS permissions |

## 7. Todo & push

| Order | File | Purpose |
|------:|------|---------|
| 75 | [sql/crm_todo_daily.sql](../sql/crm_todo_daily.sql) | Daily todos |
| 76 | [sql/crm_todo_daily_team_access.sql](../sql/crm_todo_daily_team_access.sql) | Team todo access |
| 77 | [sql/crm_todo_default_templates.sql](../sql/crm_todo_default_templates.sql) | Todo templates |
| 78 | [sql/crm_push_subscriptions.sql](../sql/crm_push_subscriptions.sql) | Web push subscriptions |

## 8. Seeds (optional)

| File | Purpose |
|------|---------|
| [sql/seed_tenant_defaults.sql](../sql/seed_tenant_defaults.sql) | **New tenant branding** (colors, title, logo paths) — run after migrations |
| [sql/export_tenant_defaults.sql](../sql/export_tenant_defaults.sql) | Generate SQL from styled playground → paste into `seed_tenant_defaults.sql` |
| `assets/tenant-default-branding/*.png` | Default watermark + header icon (commit to Git) |
| [scripts/Export-TenantDefaultBranding.ps1](../scripts/Export-TenantDefaultBranding.ps1) | Download PNGs from playground Supabase into `assets/` |
| [scripts/Seed-TenantDefaultBranding.ps1](../scripts/Seed-TenantDefaultBranding.ps1) | Upload PNGs to new tenant Supabase (service role) |
| [sql/seed_playground.sql](../sql/seed_playground.sql) | Fake customers — **playground only** |

**New dealer install order:** 78 migrations → `seed_tenant_defaults.sql` → `Seed-TenantDefaultBranding.ps1` → Auth user + allowlist.

## Marketing site (separate Supabase)

If the marketing site uses a different Supabase project:

- [sql/crm_public_preapproval_leads_marketing_project.sql](../sql/crm_public_preapproval_leads_marketing_project.sql)
- [sql/feath_board.sql](../sql/feath_board.sql) — Feath Board shared state
- [sql/feath_prototype_shares.sql](../sql/feath_prototype_shares.sql) — short `/v/:id` Figma prototype share links
- [sql/feath_prototype_shares_make_sites.sql](../sql/feath_prototype_shares_make_sites.sql) — allow Make + `*.figma.site` (if you already ran the table once)

## Edge functions

Deploy all functions under `supabase/functions/` and set secrets per `docs/TWILIO_VOICE.md`, `docs/TWILIO_SMS.md`, and `docs/CRM_BRIDGE.md`.

After bulk SQL on a new project, run [sql/crm_install_rpc_and_reload.sql](../sql/crm_install_rpc_and_reload.sql) or reload the API schema from the Supabase dashboard.
