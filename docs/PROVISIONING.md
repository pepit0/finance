# Provisioning a new CRM licensee

Model A: **one Supabase + one Vercel + Twilio stack per tenant**. See [WHITE_LABEL_LICENSING_PLAN.md](WHITE_LABEL_LICENSING_PLAN.md).

## Prerequisites

- Supabase account
- Vercel account
- Twilio account (voice/SMS if enabled)
- Domain for the CRM app

## 1. Create Supabase project

1. Create a new project in the Supabase dashboard.
2. Save **Project URL** and **anon key** (Settings → API).
3. Run SQL from [MIGRATIONS.md](MIGRATIONS.md) in order (SQL editor or `psql`).
4. Edit `sql/crm_directory_set_master_email.sql` with the first admin email before running.
5. Run `sql/crm_install_rpc_and_reload.sql` after bulk migrations.

## 2. Deploy Edge Functions

From the repo root (with [Supabase CLI](https://supabase.com/docs/guides/cli) linked):

```bash
supabase functions deploy twilio-voice
supabase functions deploy twilio-call-status
supabase functions deploy twilio-initiate-call
supabase functions deploy twilio-recording
supabase functions deploy twilio-recording-url
# SMS (if used):
supabase functions deploy twilio-send-sms
supabase functions deploy twilio-inbound-sms
supabase functions deploy twilio-sms-status
# Marketing / stale leads (if used):
supabase functions deploy ingest-marketing-preapproval
supabase functions deploy check-stale-leads
```

Set secrets in Supabase → Edge Functions → Secrets. See `docs/TWILIO_VOICE.md`, `docs/TWILIO_SMS.md`, `docs/CRM_BRIDGE.md`.

## 3. Create Vercel project (CRM)

1. Import this GitHub repo.
2. **Build command:** `npm run build:crm`
3. **Output directory:** `dist`
4. **Environment variables:**

| Variable | Value |
|----------|-------|
| `VITE_PRODUCT` | `crm` |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key |
| `VITE_FINANCE_APP_URL` | Finance app URL (if split) or omit |
| `VITE_VAPID_PUBLIC_KEY` | Web push public key |

5. Add custom domain (e.g. `crm.dealer.com`).

## 4. Twilio

1. Buy a voice/SMS-capable number.
2. Configure voice webhook → `https://<project-ref>.supabase.co/functions/v1/twilio-voice`
3. Configure SMS webhooks per `docs/TWILIO_SMS.md`.
4. Set inbound fallback phone in CRM Settings → Call & Text after first login.

## 5. Auth URLs

Supabase → Authentication → URL configuration:

- **Site URL:** `https://crm.dealer.com`
- **Redirect URLs:** production CRM URL, `http://localhost:5173`, finance URL if shared auth

## 6. First master user

1. Create user in Supabase Auth (or invite).
2. Add to `crm_access_allowlist` or set `app_metadata.crm_access = true`.
3. Run `sql/crm_directory_set_master_email.sql` if not done.
4. Sign in and open CRM Settings → branding.

## 7. Branding

In Settings → CRM branding:

- Header title / subtitle (customer-facing name)
- Accent color, logo, background
- Footer text (optional; empty uses header title)

## Temptation split (tenant #1)

Use **one Supabase** for both apps; **two Vercel projects**:

### Finance project

| Variable | Value |
|----------|-------|
| `VITE_PRODUCT` | `finance` |
| `VITE_CRM_APP_URL` | `https://crm.sharifian.cfd` (your CRM domain) |
| `VITE_SUPABASE_*` | Same as today |

Build: `npm run build:finance`

### CRM project

| Variable | Value |
|----------|-------|
| `VITE_PRODUCT` | `crm` |
| `VITE_FINANCE_APP_URL` | `https://sharifian.cfd` (your finance domain) |
| `VITE_SUPABASE_*` | Same as today |

Build: `npm run build:crm`

### Auth

Add **both** Vercel production URLs to Supabase redirect allow list.

### DNS cutover

1. Validate on [playground](PLAYGROUND.md) first.
2. Deploy both projects without changing DNS.
3. Smoke test preview URLs.
4. Point DNS to new projects.
5. Run `sql/crm_org_settings_product_shell.sql` on prod if not applied; existing `header_title` is unchanged.

## Tenant registry

Copy `tenants.example.json` to `tenants.json` locally (do not commit secrets). Track `currentVersion` per tenant for upgrades.

## Related

- [PLAYGROUND.md](PLAYGROUND.md) — safe dev environment
- [UPGRADE.md](UPGRADE.md) — version upgrades
- [CLOUD_SETUP.md](CLOUD_SETUP.md) — step-by-step for playground, Test Dealer, and Temptation split
