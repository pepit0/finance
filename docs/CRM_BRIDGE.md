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

Set secrets on the CRM project (only **custom** secrets — Supabase already injects `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`; do **not** add those manually):

| Secret | Value |
|--------|--------|
| `MARKETING_WEBHOOK_SECRET` | Same random string as the marketing DB webhook header |

### Email alerts on new leads (optional, Resend)

When a **new** website lead is ingested (not duplicates), the Edge Function can email your team via [Resend](https://resend.com).

1. Create a Resend account and add/verify your sending domain (or use their sandbox for testing).
2. Create an API key in Resend → **API Keys**.
3. Add **two** more Edge Function secrets (three custom secrets total):

| Secret | Value |
|--------|--------|
| `RESEND_API_KEY` | Resend API key (`re_…`) |
| `LEAD_NOTIFY_CONFIG` | JSON — **copy exactly** (one line): `{"from":"Temptation Leads <onboarding@resend.dev>","to":"you@gmail.com"}` |

Optional: include `"api_key":"re_…"` in the same JSON if you want only **two** secrets total (`MARKETING_WEBHOOK_SECRET` + `LEAD_NOTIFY_CONFIG`).

`crm_url` is optional inside the JSON. For Resend **sandbox/testing**, `from` must be `onboarding@resend.dev` and `to` must be an address verified in Resend.

You can also use separate secrets `LEAD_NOTIFY_FROM`, `LEAD_NOTIFY_EMAILS`, and `LEAD_NOTIFY_CRM_URL` instead of `LEAD_NOTIFY_CONFIG` if your plan allows more secrets.

4. Redeploy the function (see command above).

If `RESEND_API_KEY` or recipients are missing, ingest still works — email is skipped. A failed send is logged but does **not** roll back the lead. Check Edge Function logs for `Lead notification email sent` or `Lead notification email failed`.

Function path: `supabase/functions/ingest-marketing-preapproval/`

## Troubleshooting: logs show 200 but no System lead / no email

HTTP **200 only means the function finished** — open the log line `ingest-marketing-preapproval response:` and check the JSON:

| Field | Meaning |
|--------|---------|
| `"duplicate": true` | Same marketing `record.id` was already ingested. Webhook retries and re-tests do **not** create another System lead or send email. Submit a **brand-new** pre-approval. |
| `"email_sent": false` | Email skipped or failed — see `"email_error"` in the same JSON. |
| `"system_lead_id": "…"` | Lead was created — open CRM **System leads** (unassigned only). If already assigned or customer is **Lost**, it will not appear there; check **Customers**. |
| `"ok": false` | Ingest failed (would be HTTP 422, not 200). |

**Secrets:** Use only three custom secrets: `MARKETING_WEBHOOK_SECRET`, `RESEND_API_KEY`, `LEAD_NOTIFY_CONFIG`. Do **not** add `SUPABASE_SERVICE_ROLE_KEY` manually — Supabase injects it.

**Resend sandbox:** `from` must be `onboarding@resend.dev` and `to` must be an address you verified in Resend.

`verify_jwt = false` in `supabase/config.toml` so the marketing webhook can call it with only the shared secret header.

## Realtime (optional, for live alert badge)

In CRM Supabase → **Database** → **Publications**, ensure `supabase_realtime` includes `crm_notifications`. If not:

```sql
alter publication supabase_realtime add table public.crm_notifications;
```

## CRM UI

- **System leads** tab: unassigned leads from the marketing site; assign to a directory user or move to lost.
- **Alerts** (header): unread notifications; click opens System leads or the customer (stale-lead alerts).
- **Overview** tab: active customer count and website pre-approval lead count.

## Stale active lead alerts (12 hours)

When an **active** customer has no call, comment, or text activity for 12+ hours, CRM users get an in-app alert:

- **Assignee** (if set)
- **Directory admins** (`crm_directory_admins` + master email in `sql/crm_stale_lead_notifications.sql`)

Lost customers are excluded. The same customer is not re-alerted until another 12 hours pass without activity (or until staff log new activity and the cycle resets after the next 12h idle window).

### SQL

Run on CRM Supabase (postgres), after `crm_marketing_ingest_bridge.sql` and `crm_directory_delegated_admins.sql`:

1. **`sql/crm_stale_lead_notifications.sql`** — replace `CHANGE_ME_DIRECTORY_MASTER_EMAIL@yourdomain.com` with the same email as `sql/crm_directory_set_master_email.sql`.

### Edge Function + schedule

```bash
npx supabase functions deploy check-stale-leads --no-verify-jwt
```

Set Edge Function secret:

| Secret | Value |
|--------|--------|
| `STALE_LEAD_CRON_SECRET` | Random string (required) |
| `STALE_LEAD_HOURS` | Optional; default `12` |

Schedule an **hourly** POST to the function URL with header `x-cron-secret: <STALE_LEAD_CRON_SECRET>`.

Options:

- **Supabase Dashboard** → Edge Functions → `check-stale-leads` → Schedules (cron e.g. `5 * * * *`)
- **pg_cron** (Pro): uncomment the schedule at the bottom of `sql/crm_stale_lead_notifications.sql`

Manual test:

```bash
curl -X POST "https://YOUR_PROJECT.supabase.co/functions/v1/check-stale-leads" \
  -H "x-cron-secret: YOUR_SECRET"
```

Response example: `{"ok":true,"result":{"customers_alerted":2,"notifications_created":5,"stale_hours":12}}`

## Marketing webhook

See **site** repo `docs/CRM_BRIDGE.md` for configuring the INSERT webhook on `preapproval_leads`.

## Troubleshooting: webhook logs OK but no System lead

After adding the website auto-comment, ingest can fail if `crm_activities.author_id` is still `NOT NULL` (whole transaction rolls back).

1. CRM **Edge Function** logs → look for `ingest_marketing_preapproval_lead result:` or `failed:` with the Postgres error.
2. SQL Editor (postgres): run `sql/crm_marketing_ingest_hotfix.sql`, then **`sql/crm_marketing_ingest_bridge.sql`** again.
3. Redeploy `ingest-marketing-preapproval` if you pulled Edge Function logging/consent fixes.
4. Submit a **new** pre-approval (new `preapproval_leads.id`); retries on the same row return `duplicate: true` and do not create another lead.

## Optional phone on website leads

If the marketing form no longer requires phone, run on **CRM** Supabase (SQL Editor, as postgres):

1. `sql/crm_marketing_ingest_phone_optional.sql`
2. Re-run **`sql/crm_marketing_ingest_bridge.sql`** (refreshes `ingest_marketing_preapproval_lead` — phone optional when blank; still validated if provided)

No Edge Function redeploy needed for this change.
