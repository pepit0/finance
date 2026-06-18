# Twilio SMS — CRM Chat tab

This guide wires your Twilio phone number to the CRM **Chat** tab for outbound texts, inbound replies, and conversation history on customer profiles.

## 1. SQL (run on CRM Supabase as postgres)

Run once, in order (after voice migrations if you use calls too):

1. `sql/crm_activities_kind_text.sql` (if not already applied)
2. `sql/crm_activities_twilio_calls.sql` (if not already applied — adds `source = 'twilio'`)
3. `sql/crm_activities_twilio_sms.sql`
4. `sql/crm_sms_threads.sql`
5. `sql/crm_sms_read_cursors.sql`
6. `sql/crm_customers_last_text_at.sql`
7. `sql/crm_twilio_sms_permissions.sql`

## 2. Edge Function secrets

Same secrets as voice (no new vars required):

| Secret | Value |
|--------|--------|
| `TWILIO_ACCOUNT_SID` | Twilio Console → Account Info |
| `TWILIO_AUTH_TOKEN` | Twilio Console → Account Info |
| `TWILIO_PHONE_NUMBER` | Your Twilio number in E.164, e.g. `+15551234567` |

Optional: `TWILIO_WEBHOOK_BASE_URL` — defaults to `https://<project-ref>.supabase.co/functions/v1`

## 3. Deploy Edge Functions

```bash
supabase functions deploy twilio-send-sms
supabase functions deploy twilio-inbound-sms --no-verify-jwt
supabase functions deploy twilio-sms-status --no-verify-jwt
```

JWT settings are in `supabase/config.toml`:

- `twilio-send-sms`: JWT on, permission `texts.send`
- `twilio-inbound-sms`, `twilio-sms-status`: JWT off, Twilio signature validated in code

## 4. Twilio Console — phone number

On your Twilio number → **Messaging configuration**:

| Setting | Value |
|---------|--------|
| **A message comes in** | Webhook `POST` → `https://<project-ref>.supabase.co/functions/v1/twilio-inbound-sms` |

Confirm the number is **SMS-capable**. Voice and SMS can share the same number.

## 5. Permissions

Under **Admin → Groups & Permissions**:

- `texts.view` — open Chat tab and read threads
- `texts.send` — send outbound SMS

Both are granted by default to positions that already have `activities.log` when you run `sql/crm_twilio_sms_permissions.sql`.

## 6. Using Chat in CRM

- Open the **Chat** tab in the left nav.
- Select a conversation, type a message, click **Send**.
- From **Customers**, use **Text customer** next to the phone number to jump into that thread.
- Inbound texts from known numbers match existing customers; unknown numbers create a **No name text** customer profile.
- On a customer's **first inbound text** (or first text from an unknown number), the CRM runs **Twilio Lookup** and saves line type, carrier, location (when available), and US caller ID name (CNAM) on the customer profile. If CNAM matches and the profile still has a placeholder name, the display name is updated automatically.
- Assignees receive an in-app notification when their customer texts in (`type: inbound_sms`).

## 7. Troubleshooting

| Symptom | Check |
|---------|--------|
| Chat tab missing | Run `sql/crm_twilio_sms_permissions.sql`; confirm your role has `texts.view` |
| Send fails | `texts.send` permission; customer has phone; Twilio secrets set; deploy `twilio-send-sms` |
| Inbound not logged | Messaging webhook URL in Twilio Console; deploy `twilio-inbound-sms`; Edge Function logs |
| 403 on inbound webhook | Twilio signature mismatch — set `TWILIO_WEBHOOK_BASE_URL`; redeploy functions |
| Empty thread list after send | Run `sql/crm_sms_threads.sql`; check `crm_sms_threads` row inserted |
| Delivery status stuck on queued | Deploy `twilio-sms-status`; status callback URL passed on send |

Check Supabase **Edge Functions → Logs** for `twilio-send-sms`, `twilio-inbound-sms`, and `twilio-sms-status`.

## 8. Compliance note

Obtain consent before texting customers (CASL in Canada, TCPA in the US). The webhook recognizes `STOP` / `UNSUBSCRIBE` but does not yet persist opt-out flags — add that before marketing use. US business SMS may require **A2P 10DLC** registration.

## 9. Twilio Lookup (phone intelligence)

First inbound SMS triggers a **Twilio Lookup v2** request (`line_type_intelligence`, `caller_name`). This is billed per lookup by Twilio. CNAM is US-only and often empty on mobile numbers. Line type (mobile / landline / VoIP) and carrier name are shown on the customer profile under **Phone**.
