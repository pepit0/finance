# Twilio Voice — CRM call logging + recordings

This guide wires your Twilio phone number to the CRM for **click-to-call outbound**, **inbound routing to assignees**, automatic **call activities**, and **recorded playback** in the customer history.

## 1. SQL (run on CRM Supabase as postgres)

Run once, in order:

1. `sql/crm_user_directory_callback_phone.sql`
2. `sql/crm_activities_twilio_calls.sql`
3. `sql/crm_phone_call_sessions.sql`
4. `sql/crm_org_settings_inbound_fallback_phone.sql`
5. `sql/crm_call_recordings_storage.sql`
6. `sql/crm_twilio_permissions.sql`
7. `sql/crm_phone_call_sessions_voice_webhook_url.sql` (stores exact outbound voice URL for webhook signature validation)
8. `sql/crm_phone_call_sessions_dial_call_sid.sql` (links Dial leg CallSid for recording webhooks)
9. `sql/crm_phone_call_sessions_inbound_auto_customer.sql` (tracks auto-created inbound caller profiles)

## 2. Edge Function secrets

From the **auto-finance-manager** repo root (Supabase CLI linked to the CRM project):

| Secret | Value |
|--------|--------|
| `TWILIO_ACCOUNT_SID` | Twilio Console → Account Info |
| `TWILIO_AUTH_TOKEN` | Twilio Console → Account Info |
| `TWILIO_PHONE_NUMBER` | Your Twilio number in E.164, e.g. `+15551234567` |

Optional:

| Secret | Value |
|--------|--------|
| `TWILIO_WEBHOOK_BASE_URL` | Defaults to `https://<project-ref>.supabase.co/functions/v1` |

Do **not** put Twilio credentials in `VITE_*` env vars.

## 3. Deploy Edge Functions

```bash
supabase functions deploy twilio-voice --no-verify-jwt
supabase functions deploy twilio-call-status --no-verify-jwt
supabase functions deploy twilio-recording --no-verify-jwt
supabase functions deploy twilio-initiate-call
supabase functions deploy twilio-recording-url
```

`verify_jwt` is configured in `supabase/config.toml`:

- Webhooks (`twilio-voice`, `twilio-call-status`, `twilio-recording`): JWT off, Twilio signature validated in code.
- CRM actions (`twilio-initiate-call`, `twilio-recording-url`): JWT on, permission checks in code.

## 4. Twilio Console — phone number

On your Twilio number → **Voice configuration**:

| Setting | Value |
|---------|--------|
| **A call comes in** | Webhook `POST` → `https://<project-ref>.supabase.co/functions/v1/twilio-voice` |

Save. Use Twilio’s **Debugger** if inbound calls fail.

## 5. CRM setup

1. **Team tab** — each user sets **Phone for calls** (their cell; Twilio rings this number for bridge calls).
2. **Settings → Twilio voice** (master) — set **Inbound fallback phone** for unknown callers or assignees without a callback phone.
3. Optional: toggle/edit the **recording disclosure** message played at the start of bridged calls.

## 6. Using calls in CRM

- Open a customer with a phone number → **Call** (requires `calls.place` permission).
- Twilio rings **your** callback phone first; when you answer, the customer is connected and the call is recorded.
- When the call ends, a **Call** activity appears with duration. After a few seconds, a **Recorded** badge and audio player appear (`calls.listen` permission).
- Manual “Log a call” entries still work for off-platform calls.

## 7. Inbound routing

When someone calls your Twilio number:

1. CRM matches the caller to a customer by `phone` / `secondary_phone`.
2. Routes to that customer’s **assigned** agent’s callback phone.
3. If no match or no agent phone → **inbound fallback** from Settings.
4. Logs a call activity on the matched customer (when known) with recording.
5. The routed agent sees a **live inbound call banner** at the top of CRM (ringing → answered → connected → ended) while the call is in progress, plus an in-app notification.

## 8. Troubleshooting

| Symptom | Check |
|---------|--------|
| “Set your phone for calls on the Team tab” | User has no `callback_phone` in directory |
| Call button missing | User lacks `calls.place` or customer has no phone |
| No recording player | Wait ~30s; recording webhook may lag behind call end. Activity list auto-refreshes for up to 4 minutes after outbound calls. Run `sql/crm_call_recordings_storage.sql` and `sql/crm_phone_call_sessions_dial_call_sid.sql`. Redeploy `twilio-recording`. Check Edge Function logs for `twilio-recording rejected` or `recording upload failed`. |
| Inbound goes nowhere | Fallback phone in Settings; assignee callback phone on Team tab |
| Twilio default “configure your number’s URL” then hangup | Phone number **Voice webhook not set** in Twilio Console. Set **A call comes in** → Webhook **POST** → `https://<project-ref>.supabase.co/functions/v1/twilio-voice`. Outbound click-to-call does **not** configure this automatically. |
| Inbound says “No agent is available” | Set **Inbound fallback phone** under Admin → Twilio voice, and/or assignee **Phone for calls** on Team tab |
| "An application error has occurred" after answering / pressing a key | Redeploy `twilio-voice` and `twilio-call-status` (signature URL + Dial action TwiML fix). Check Twilio **Monitor → Errors** for the failing webhook URL and HTTP status. Trial accounts play "press any key" before fetching your voice URL. |
| "Unable to verify this call request" after answering / pressing a key | Twilio signature did not match any reconstructed URL. Redeploy `twilio-voice`, `twilio-initiate-call`, `twilio-call-status`, and `twilio-recording`. Run `sql/crm_phone_call_sessions_voice_webhook_url.sql`. Confirm `TWILIO_AUTH_TOKEN` is the account **Auth Token** (not an API key secret). Set `TWILIO_WEBHOOK_BASE_URL` to `https://<project-ref>.supabase.co/functions/v1`. Check Edge Function logs for `Twilio signature validation failed` (lists URL candidates) or `authorizeKnownTwilioCall`. |
| 403 on webhooks | Twilio signature / URL mismatch — webhook URL must match the URL Twilio POSTs to (including query string). Set `TWILIO_WEBHOOK_BASE_URL` to `https://<project-ref>.supabase.co/functions/v1` if needed. |
| Edge Function 500 | Secrets `TWILIO_*` set; SQL migrations applied |

Check Supabase **Edge Functions → Logs** for `twilio-initiate-call`, `twilio-voice`, `twilio-call-status`, and `twilio-recording`.

## 9. Compliance note

Many jurisdictions require disclosure before recording calls. Confirm the disclosure text with your compliance advisor. The default message can be edited under **Settings → Twilio voice**.
