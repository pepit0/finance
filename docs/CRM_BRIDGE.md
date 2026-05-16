# Marketing site → CRM bridge (CRM side)

## SQL (run on CRM Supabase as postgres)

1. `sql/crm_security.sql`
2. `sql/crm_public_preapproval_leads.sql`
3. **`sql/crm_marketing_ingest_bridge.sql`** (~470 lines) — system leads, notifications, `ingest_marketing_preapproval_lead`, `assign_crm_system_lead`. If the editor shows an empty file, close and reopen from disk, or use the duplicate at **site** `sql/crm/crm_marketing_ingest_bridge.sql`.

## Edge Function

From the **auto-finance-manager** repo root (with [Supabase CLI](https://supabase.com/docs/guides/cli) linked to the CRM project):

```bash
supabase functions deploy ingest-marketing-preapproval --no-verify-jwt
```

Set secrets on the CRM project:

| Secret | Value |
|--------|--------|
| `MARKETING_WEBHOOK_SECRET` | Same random string as the marketing DB webhook header |
| `SUPABASE_SERVICE_ROLE_KEY` | CRM service role key (Settings → API) |

Function path: `supabase/functions/ingest-marketing-preapproval/`

`verify_jwt = false` in `supabase/config.toml` so the marketing webhook can call it with only the shared secret header.

## Realtime (optional, for live alert badge)

In CRM Supabase → **Database** → **Publications**, ensure `supabase_realtime` includes `crm_notifications`. If not:

```sql
alter publication supabase_realtime add table public.crm_notifications;
```

## CRM UI

- **System leads** tab: unassigned leads from the marketing site; assign to a directory user.
- **Alerts** (header): unread notifications; click opens System leads.
- **Web leads** tab: raw `crm_public_preapproval_leads` rows (including ingested copies).

## Marketing webhook

See **site** repo `docs/CRM_BRIDGE.md` for configuring the INSERT webhook on `preapproval_leads`.

## Troubleshooting: webhook logs OK but no System lead

After adding the website auto-comment, ingest can fail if `crm_activities.author_id` is still `NOT NULL` (whole transaction rolls back).

1. CRM **Edge Function** logs → look for `ingest_marketing_preapproval_lead result:` or `failed:` with the Postgres error.
2. SQL Editor (postgres): run `sql/crm_marketing_ingest_hotfix.sql`, then **`sql/crm_marketing_ingest_bridge.sql`** again.
3. Redeploy `ingest-marketing-preapproval` if you pulled Edge Function logging/consent fixes.
4. Submit a **new** pre-approval (new `preapproval_leads.id`); retries on the same row return `duplicate: true` and do not create another lead.
