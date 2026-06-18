import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import twilio from "npm:twilio@5.4.2";
import { sendWebPushToUser } from "./webPush.ts";

const { validateRequest: twilioValidateRequest } = twilio;

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-twilio-signature"
};

export const RECORDINGS_BUCKET = "crm-call-recordings";

export type TwilioConfig = {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
  webhookBaseUrl: string;
};

export function getTwilioConfig(): TwilioConfig | null {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID")?.trim();
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN")?.trim();
  const phoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER")?.trim();
  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
  if (!accountSid || !authToken || !phoneNumber || !supabaseUrl) {
    return null;
  }
  const webhookBaseUrl =
    Deno.env.get("TWILIO_WEBHOOK_BASE_URL")?.trim() ??
    `${supabaseUrl.replace(/\/$/, "")}/functions/v1`;
  return { accountSid, authToken, phoneNumber, webhookBaseUrl };
}

export function getServiceSupabase(): SupabaseClient | null {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

export function getUserSupabase(req: Request): SupabaseClient | null {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const authHeader = req.headers.get("Authorization");
  if (!supabaseUrl || !anonKey || !authHeader) {
    return null;
  }
  return createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}

export function twimlResponse(xml: string): Response {
  return new Response(xml, {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "text/xml; charset=utf-8" }
  });
}

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/** Normalize NANP to 10 digits or null. */
export function normalizeNanpTo10Digits(raw: string): string | null {
  const d = digitsOnly(raw.trim());
  if (!d) {
    return null;
  }
  let n = d;
  if (n.length === 11 && n.startsWith("1")) {
    n = n.slice(1);
  }
  if (n.length !== 10) {
    return null;
  }
  return n;
}

export function toE164Nanp(phone10: string): string {
  return `+1${phone10}`;
}

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function parseTwilioForm(req: Request): Promise<Record<string, string>> {
  const text = await req.text();
  const params = new URLSearchParams(text);
  const out: Record<string, string> = {};
  for (const [key, value] of params.entries()) {
    out[key] = value;
  }
  return out;
}

function sortSignatureParams(params: Record<string, string>): string {
  return Object.keys(params)
    .sort()
    .reduce((acc, key) => acc + key + params[key], "");
}

async function hmacSha1Base64(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  const bytes = new Uint8Array(signature);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

export function functionUrl(base: string, name: string): string {
  return `${base.replace(/\/$/, "")}/${name}`;
}

export function buildVoiceWebhookUrl(config: TwilioConfig, sessionId: string): string {
  return `${functionUrl(config.webhookBaseUrl, "twilio-voice")}?sessionId=${encodeURIComponent(sessionId)}`;
}

export function buildInboundVoiceWebhookUrl(config: TwilioConfig): string {
  return functionUrl(config.webhookBaseUrl, "twilio-voice");
}

export function buildRecordingWebhookUrl(config: TwilioConfig, sessionId: string): string {
  return `${functionUrl(config.webhookBaseUrl, "twilio-recording")}?sessionId=${encodeURIComponent(sessionId)}`;
}

export type TwilioWebhookUrlOptions = {
  functionName?: string;
  sessionId?: string;
  knownWebhookUrl?: string | null;
};

/** Collect public URLs Twilio may have signed (proxy / Supabase path variants). */
export function collectTwilioWebhookUrlCandidates(
  req: Request,
  config?: TwilioConfig,
  options?: TwilioWebhookUrlOptions
): string[] {
  const incoming = new URL(req.url);
  const urls = new Set<string>();
  const sessionId = options?.sessionId?.trim() ?? incoming.searchParams.get("sessionId")?.trim() ?? "";
  const functionName =
    options?.functionName ?? incoming.pathname.match(/\/functions\/v1\/([^/?]+)/)?.[1] ?? "";
  const searchFromRequest = incoming.search;
  const searchWithSession = sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : searchFromRequest;

  if (options?.knownWebhookUrl?.trim()) {
    urls.add(options.knownWebhookUrl.trim());
  }

  if (config && functionName) {
    urls.add(`${functionUrl(config.webhookBaseUrl, functionName)}${searchWithSession}`);
    if (searchFromRequest && searchFromRequest !== searchWithSession) {
      urls.add(`${functionUrl(config.webhookBaseUrl, functionName)}${searchFromRequest}`);
    }
    if (config && sessionId && functionName === "twilio-voice") {
      urls.add(buildVoiceWebhookUrl(config, sessionId));
    }
  }

  const host = req.headers.get("host")?.trim();
  if (host) {
    const proto = req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ?? "https";
    urls.add(`${proto}://${host}${incoming.pathname}${searchWithSession}`);
    if (searchFromRequest && searchFromRequest !== searchWithSession) {
      urls.add(`${proto}://${host}${incoming.pathname}${searchFromRequest}`);
    }
  }

  const forwardedHost = req.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  if (forwardedHost) {
    const forwardedProto = req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ?? "https";
    urls.add(`${forwardedProto}://${forwardedHost}${incoming.pathname}${searchWithSession}`);
    if (searchFromRequest && searchFromRequest !== searchWithSession) {
      urls.add(`${forwardedProto}://${forwardedHost}${incoming.pathname}${searchFromRequest}`);
    }
  }

  urls.add(req.url);
  if (req.url.startsWith("http://")) {
    urls.add(req.url.replace(/^http:/, "https:"));
  }

  return [...urls];
}

/** Preferred public URL for logging/diagnostics. */
export function resolveTwilioWebhookUrl(req: Request, config: TwilioConfig): string {
  const candidates = collectTwilioWebhookUrlCandidates(req, config);
  for (const candidate of candidates) {
    if (candidate.startsWith("https://")) {
      return candidate;
    }
  }
  return candidates[0] ?? req.url;
}

function twilioSdkValidates(
  authToken: string,
  signature: string,
  webhookUrl: string,
  params: Record<string, string>
): boolean {
  try {
    return twilioValidateRequest(authToken, signature, webhookUrl, params);
  } catch {
    return false;
  }
}

async function twilioSignatureMatches(
  authToken: string,
  signature: string,
  webhookUrl: string,
  params: Record<string, string>
): Promise<boolean> {
  if (twilioSdkValidates(authToken, signature, webhookUrl, params)) {
    return true;
  }
  const expected = await hmacSha1Base64(authToken, webhookUrl + sortSignatureParams(params));
  return expected === signature;
}

export async function authorizeKnownTwilioCall(
  supabase: SupabaseClient,
  params: Record<string, string>,
  sessionId?: string
): Promise<boolean> {
  const callSid = params.CallSid?.trim();
  if (!callSid) {
    return false;
  }

  let query = supabase
    .from("crm_phone_call_sessions")
    .select("id, twilio_call_sid, direction, status")
    .eq("twilio_call_sid", callSid);

  if (sessionId) {
    query = query.eq("id", sessionId);
  }

  const { data: session } = await query.maybeSingle();
  if (!session) {
    console.error("authorizeKnownTwilioCall: no session for CallSid", callSid);
    return false;
  }

  if (String(session.twilio_call_sid) !== callSid) {
    console.error("authorizeKnownTwilioCall: CallSid mismatch", {
      callSid,
      sessionSid: session.twilio_call_sid
    });
    return false;
  }

  if (session.direction !== "outbound" && session.direction !== "inbound") {
    console.error("authorizeKnownTwilioCall: unexpected direction", session.direction);
    return false;
  }

  const allowedStatuses = [
    "initiated",
    "ringing",
    "in-progress",
    "completed",
    "failed",
    "no-answer",
    "busy",
    "canceled"
  ];
  if (!allowedStatuses.includes(String(session.status))) {
    console.error("authorizeKnownTwilioCall: unexpected status", session.status);
    return false;
  }

  console.warn("authorizeKnownTwilioCall: accepted outbound session via CallSid fallback", {
    sessionId: session.id,
    callSid,
    status: session.status
  });
  return true;
}

/** Inbound calls hit twilio-voice with no sessionId — accept when To matches our Twilio number. */
export function authorizeKnownTwilioInbound(
  config: TwilioConfig,
  params: Record<string, string>
): boolean {
  const callSid = params.CallSid?.trim();
  const from = params.From?.trim();
  const to = params.To?.trim();
  if (!callSid || !from || !to) {
    return false;
  }

  const ourDigits = digitsOnly(config.phoneNumber);
  const toDigits = digitsOnly(to);
  if (!ourDigits || toDigits !== ourDigits) {
    console.error("authorizeKnownTwilioInbound: To does not match TWILIO_PHONE_NUMBER", {
      to,
      expected: config.phoneNumber
    });
    return false;
  }

  console.warn("authorizeKnownTwilioInbound: accepted inbound call", { callSid });
  return true;
}

export type RecordingSessionRow = {
  id: string;
  customer_id: string;
  activity_id: string | null;
  twilio_call_sid: string | null;
  twilio_dial_call_sid: string | null;
};

async function fetchRecordingSessionById(
  supabase: SupabaseClient,
  sessionId: string
): Promise<RecordingSessionRow | null> {
  const { data, error } = await supabase
    .from("crm_phone_call_sessions")
    .select("id, customer_id, activity_id, twilio_call_sid, twilio_dial_call_sid")
    .eq("id", sessionId)
    .maybeSingle();

  if (!error && data?.customer_id) {
    return data as RecordingSessionRow;
  }

  if (error && /twilio_dial_call_sid|column|schema cache/i.test(error.message)) {
    const { data: legacy } = await supabase
      .from("crm_phone_call_sessions")
      .select("id, customer_id, activity_id, twilio_call_sid")
      .eq("id", sessionId)
      .maybeSingle();
    if (legacy?.customer_id) {
      return { ...(legacy as RecordingSessionRow), twilio_dial_call_sid: null };
    }
  } else if (error) {
    console.warn("fetchRecordingSessionById failed:", error.message);
  }

  return null;
}

export async function resolveRecordingSession(
  supabase: SupabaseClient,
  sessionId: string,
  params: Record<string, string>
): Promise<RecordingSessionRow | null> {
  if (sessionId) {
    const byId = await fetchRecordingSessionById(supabase, sessionId);
    if (byId) {
      return byId;
    }
  }

  const callSid = params.CallSid?.trim();
  if (!callSid) {
    return null;
  }

  const { data: byParent } = await supabase
    .from("crm_phone_call_sessions")
    .select("id, customer_id, activity_id, twilio_call_sid, twilio_dial_call_sid")
    .eq("twilio_call_sid", callSid)
    .maybeSingle();
  if (byParent?.customer_id) {
    return byParent as RecordingSessionRow;
  }

  const { data: byDial, error: dialError } = await supabase
    .from("crm_phone_call_sessions")
    .select("id, customer_id, activity_id, twilio_call_sid, twilio_dial_call_sid")
    .eq("twilio_dial_call_sid", callSid)
    .maybeSingle();
  if (!dialError && byDial?.customer_id) {
    return byDial as RecordingSessionRow;
  }

  return null;
}

export async function authorizeKnownTwilioRecording(
  supabase: SupabaseClient,
  params: Record<string, string>,
  sessionId: string
): Promise<boolean> {
  const recordingSid = params.RecordingSid?.trim();
  const recordingUrl = params.RecordingUrl?.trim();
  if (!recordingSid || !recordingUrl) {
    return false;
  }

  const session = await resolveRecordingSession(supabase, sessionId, params);
  if (!session) {
    console.error("authorizeKnownTwilioRecording: no session", {
      sessionId: sessionId || null,
      callSid: params.CallSid ?? null
    });
    return false;
  }

  if (sessionId && session.id === sessionId) {
    console.warn("authorizeKnownTwilioRecording: accepted via sessionId fallback", {
      sessionId: session.id
    });
    return true;
  }

  const callSid = params.CallSid?.trim();
  if (!callSid) {
    return false;
  }

  const knownSid =
    callSid === session.twilio_call_sid ||
    (session.twilio_dial_call_sid && callSid === session.twilio_dial_call_sid);
  if (!knownSid) {
    console.error("authorizeKnownTwilioRecording: CallSid not linked to session", {
      callSid,
      sessionId: session.id,
      parentSid: session.twilio_call_sid,
      dialSid: session.twilio_dial_call_sid
    });
    return false;
  }

  console.warn("authorizeKnownTwilioRecording: accepted via CallSid fallback", {
    sessionId: session.id,
    callSid
  });
  return true;
}

export async function attachRecordingToSessionActivity(
  supabase: SupabaseClient,
  session: RecordingSessionRow,
  storagePath: string
): Promise<void> {
  if (session.activity_id) {
    await supabase
      .from("crm_activities")
      .update({ recording_storage_path: storagePath })
      .eq("id", session.activity_id);
    return;
  }

  const { data: activityBySid } = await supabase
    .from("crm_activities")
    .select("id")
    .eq("twilio_call_sid", session.twilio_call_sid)
    .maybeSingle();

  if (activityBySid?.id) {
    await supabase
      .from("crm_activities")
      .update({ recording_storage_path: storagePath })
      .eq("id", activityBySid.id);
    await supabase
      .from("crm_phone_call_sessions")
      .update({ activity_id: activityBySid.id, updated_at: new Date().toISOString() })
      .eq("id", session.id);
    return;
  }

  const { data: recentActivity } = await supabase
    .from("crm_activities")
    .select("id")
    .eq("customer_id", session.customer_id)
    .eq("source", "twilio")
    .is("recording_storage_path", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (recentActivity?.id) {
    await supabase
      .from("crm_activities")
      .update({ recording_storage_path: storagePath })
      .eq("id", recentActivity.id);
    await supabase
      .from("crm_phone_call_sessions")
      .update({ activity_id: recentActivity.id, updated_at: new Date().toISOString() })
      .eq("id", session.id);
    return;
  }

  await supabase
    .from("crm_phone_call_sessions")
    .update({
      failure_reason: `recording:${storagePath}`,
      updated_at: new Date().toISOString()
    })
    .eq("id", session.id);
}

export async function validateTwilioSignature(
  req: Request,
  params: Record<string, string>,
  authToken: string,
  config?: TwilioConfig,
  options?: TwilioWebhookUrlOptions
): Promise<boolean> {
  const signature = req.headers.get("x-twilio-signature")?.trim();
  if (!signature) {
    console.error("Twilio signature validation failed: missing x-twilio-signature header");
    return false;
  }

  const urls = config
    ? collectTwilioWebhookUrlCandidates(req, config, options)
    : [req.url];

  for (const webhookUrl of urls) {
    if (await twilioSignatureMatches(authToken, signature, webhookUrl, params)) {
      return true;
    }
  }

  console.error("Twilio signature validation failed", {
    urls,
    sessionId: options?.sessionId ?? null,
    knownWebhookUrl: options?.knownWebhookUrl ?? null,
    callSid: params.CallSid ?? null
  });
  return false;
}

export function formatCallBody(direction: "inbound" | "outbound", durationSeconds: number | null): string {
  const label = direction === "inbound" ? "Inbound call" : "Outbound call";
  if (durationSeconds == null || durationSeconds <= 0) {
    return label;
  }
  const mins = Math.floor(durationSeconds / 60);
  const secs = durationSeconds % 60;
  if (mins <= 0) {
    return `${label} · ${secs}s`;
  }
  return `${label} · ${mins}m ${secs.toString().padStart(2, "0")}s`;
}

function buildCallOutcomeActivityFields(session: Record<string, unknown>, status: string) {
  const failureReason =
    typeof session.failure_reason === "string" && !session.failure_reason.startsWith("recording:")
      ? session.failure_reason
      : null;

  const parentDuration =
    typeof session.parent_call_duration_seconds === "number" ? session.parent_call_duration_seconds : null;

  return {
    call_session_status: status,
    call_parent_status: session.parent_call_status ? String(session.parent_call_status) : null,
    call_dial_status: session.dial_call_status ? String(session.dial_call_status) : null,
    call_agent_answered: Boolean(session.agent_answered),
    call_bridge_connected: Boolean(session.bridge_connected),
    call_failure_reason: failureReason,
    call_parent_duration_seconds: parentDuration
  };
}

export async function userHasPermission(
  supabase: SupabaseClient,
  permissionKey: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc("crm_user_has_permission", {
    p_permission_key: permissionKey
  });
  if (error) {
    console.error("crm_user_has_permission failed:", error.message);
    return false;
  }
  return Boolean(data);
}

export type OrgVoiceSettings = {
  inbound_fallback_callback_phone: string | null;
  twilio_recording_disclosure_enabled: boolean;
  twilio_recording_disclosure_text: string;
};

export async function fetchOrgVoiceSettings(
  supabase: SupabaseClient
): Promise<OrgVoiceSettings> {
  const { data } = await supabase
    .from("crm_org_settings")
    .select(
      "inbound_fallback_callback_phone, twilio_recording_disclosure_enabled, twilio_recording_disclosure_text"
    )
    .eq("id", "default")
    .maybeSingle();

  return {
    inbound_fallback_callback_phone: data?.inbound_fallback_callback_phone
      ? String(data.inbound_fallback_callback_phone)
      : null,
    twilio_recording_disclosure_enabled: data?.twilio_recording_disclosure_enabled !== false,
    twilio_recording_disclosure_text:
      data?.twilio_recording_disclosure_text?.trim() ||
      "This call may be recorded for quality and training purposes."
  };
}

export async function findCustomerByPhone(
  supabase: SupabaseClient,
  phone10: string
): Promise<{ id: string; assigned_to: string | null; phone: string | null } | null> {
  const { data, error } = await supabase
    .from("crm_customers")
    .select("id, assigned_to, phone, secondary_phone")
    .or(`phone.eq.${phone10},secondary_phone.eq.${phone10}`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }
  return {
    id: String(data.id),
    assigned_to: data.assigned_to ? String(data.assigned_to) : null,
    phone: data.phone ? String(data.phone) : null
  };
}

export async function fetchAgentCallbackPhone(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  const { data } = await supabase
    .from("crm_user_directory")
    .select("callback_phone, email")
    .eq("user_id", userId)
    .maybeSingle();
  const phone = data?.callback_phone ? normalizeNanpTo10Digits(String(data.callback_phone)) : null;
  return phone;
}

export async function findAgentUserIdByCallbackPhone(
  supabase: SupabaseClient,
  phone10: string
): Promise<string | null> {
  const { data: rows, error } = await supabase
    .from("crm_user_directory")
    .select("user_id, callback_phone")
    .not("callback_phone", "is", null);

  if (error) {
    console.warn("findAgentUserIdByCallbackPhone failed:", error.message);
    return null;
  }

  for (const row of rows ?? []) {
    const normalized = normalizeNanpTo10Digits(String(row.callback_phone ?? ""));
    if (normalized === phone10) {
      return String(row.user_id);
    }
  }
  return null;
}

const GENERIC_CALLER_NAME = /^(wireless caller|unknown|unavailable|private|restricted|anonymous|out of area)$/i;

function titleCaseWord(word: string): string {
  if (!word) {
    return word;
  }
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

export function parseInboundCallerDisplayName(rawCallerName?: string | null): {
  displayName: string;
  firstName: string;
  lastName: string;
} {
  const trimmed = rawCallerName?.trim() ?? "";
  if (!trimmed || GENERIC_CALLER_NAME.test(trimmed)) {
    return { displayName: "Unknown Caller", firstName: "Unknown", lastName: "Caller" };
  }

  const parts = trimmed.split(/\s+/).filter(Boolean).map(titleCaseWord);
  if (parts.length === 1) {
    return { displayName: parts[0], firstName: parts[0], lastName: "Caller" };
  }

  const firstName = parts[0];
  const lastName = parts.slice(1).join(" ");
  return { displayName: `${firstName} ${lastName}`, firstName, lastName };
}

export async function findOrCreateInboundUnknownCustomer(
  supabase: SupabaseClient,
  input: {
    phone10: string;
    callerName?: string | null;
    assignedTo: string | null;
  }
): Promise<{ id: string; created: boolean } | null> {
  const existing = await findCustomerByPhone(supabase, input.phone10);
  if (existing) {
    return { id: existing.id, created: false };
  }

  const { displayName, firstName, lastName } = parseInboundCallerDisplayName(input.callerName);
  const assignedEmail = input.assignedTo ? await fetchAgentEmail(supabase, input.assignedTo) : null;

  const { data, error } = await supabase
    .from("crm_customers")
    .insert({
      display_name: displayName,
      phone: input.phone10,
      email: null,
      secondary_phone: null,
      date_of_birth: null,
      status: "active",
      pipeline_stage: "fresh_lead",
      assigned_to: input.assignedTo,
      assigned_to_email: assignedEmail,
      profile_metadata: {
        source: "inbound_call",
        credit_application_info: {
          first_name: firstName,
          last_name: lastName,
          phone: input.phone10
        }
      }
    })
    .select("id")
    .single();

  if (error || !data) {
    if (error && /duplicate|unique|already exists/i.test(error.message)) {
      const retry = await findCustomerByPhone(supabase, input.phone10);
      if (retry) {
        return { id: retry.id, created: false };
      }
    }
    console.error("findOrCreateInboundUnknownCustomer failed:", error?.message);
    return null;
  }

  return { id: String(data.id), created: true };
}

function inboundCallWasAnswered(status: string, durationSeconds: number | null): boolean {
  return status === "completed" && durationSeconds != null && durationSeconds > 0;
}

function inboundCallWasMissed(status: string, durationSeconds: number | null): boolean {
  if (inboundCallWasAnswered(status, durationSeconds)) {
    return false;
  }
  return ["completed", "failed", "no-answer", "busy", "canceled"].includes(status);
}

export async function finalizeInboundAutoCustomerAssignment(
  supabase: SupabaseClient,
  session: Record<string, unknown>,
  status: string,
  durationSeconds: number | null
): Promise<void> {
  if (!session.inbound_auto_created_customer || !session.customer_id) {
    return;
  }

  const customerId = String(session.customer_id);
  const agentUserId = session.agent_user_id ? String(session.agent_user_id) : null;

  if (inboundCallWasMissed(status, durationSeconds)) {
    await supabase
      .from("crm_customers")
      .update({
        assigned_to: null,
        assigned_to_email: null
      })
      .eq("id", customerId);
    return;
  }

  if (inboundCallWasAnswered(status, durationSeconds) && agentUserId) {
    const assignedEmail = await fetchAgentEmail(supabase, agentUserId);
    await supabase
      .from("crm_customers")
      .update({
        assigned_to: agentUserId,
        assigned_to_email: assignedEmail
      })
      .eq("id", customerId);
  }
}

export async function fetchAgentEmail(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  const { data } = await supabase
    .from("crm_user_directory")
    .select("email")
    .eq("user_id", userId)
    .maybeSingle();
  return data?.email ? String(data.email) : null;
}

export async function twilioCreateCall(
  config: TwilioConfig,
  input: {
    toE164: string;
    url: string;
    statusCallback: string;
    statusCallbackEvent?: string[];
  }
): Promise<{ sid: string } | { error: string }> {
  const body = new URLSearchParams({
    To: input.toE164,
    From: config.phoneNumber,
    Url: input.url,
    Method: "POST",
    StatusCallback: input.statusCallback,
    StatusCallbackMethod: "POST"
  });
  for (const event of input.statusCallbackEvent ?? ["initiated", "ringing", "answered", "completed"]) {
    body.append("StatusCallbackEvent", event);
  }

  const auth = btoa(`${config.accountSid}:${config.authToken}`);
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Calls.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body
    }
  );

  const payload = await response.json();
  if (!response.ok) {
    const message =
      typeof payload?.message === "string" ? payload.message : `Twilio error (${response.status})`;
    return { error: message };
  }
  return { sid: String(payload.sid) };
}

export async function applyOutboundCallPipelineStage(
  supabase: SupabaseClient,
  customerId: string
): Promise<string | null> {
  const { data: settings, error: settingsError } = await supabase
    .from("crm_org_settings")
    .select("outbound_call_pipeline_stage_enabled, outbound_call_pipeline_stage")
    .eq("id", "default")
    .maybeSingle();

  if (settingsError) {
    console.warn("applyOutboundCallPipelineStage: settings lookup failed", settingsError.message);
    return null;
  }
  if (!settings?.outbound_call_pipeline_stage_enabled) {
    return null;
  }

  const stage = settings.outbound_call_pipeline_stage
    ? String(settings.outbound_call_pipeline_stage).trim()
    : "";
  if (!stage) {
    return null;
  }

  const { data: customer, error: customerError } = await supabase
    .from("crm_customers")
    .select("id, status, pipeline_stage")
    .eq("id", customerId)
    .maybeSingle();

  if (customerError || !customer) {
    console.warn("applyOutboundCallPipelineStage: customer lookup failed", customerError?.message);
    return null;
  }
  if (String(customer.status) === "lost") {
    return null;
  }

  const currentStageSlug = String(customer.pipeline_stage ?? "");
  if (currentStageSlug === stage) {
    return stage;
  }

  const { data: targetStageRow, error: stageError } = await supabase
    .from("crm_pipeline_stages")
    .select("slug, sort_order, is_selectable")
    .eq("slug", stage)
    .maybeSingle();

  if (stageError || !targetStageRow || targetStageRow.is_selectable !== true) {
    console.warn("applyOutboundCallPipelineStage: invalid stage", stage);
    return null;
  }

  const { data: currentStageRow } = await supabase
    .from("crm_pipeline_stages")
    .select("slug, sort_order")
    .eq("slug", currentStageSlug)
    .maybeSingle();

  const targetSortOrder = Number(targetStageRow.sort_order);
  const currentSortOrder = currentStageRow ? Number(currentStageRow.sort_order) : -1;

  if (Number.isFinite(currentSortOrder) && currentSortOrder >= targetSortOrder) {
    console.log("applyOutboundCallPipelineStage: skipped, customer already at equal or higher stage", {
      customerId,
      currentStage: currentStageSlug,
      targetStage: stage,
      currentSortOrder,
      targetSortOrder
    });
    return null;
  }

  const { error: updateError } = await supabase
    .from("crm_customers")
    .update({ pipeline_stage: stage })
    .eq("id", customerId);

  if (updateError) {
    console.error("applyOutboundCallPipelineStage: update failed", updateError.message);
    return null;
  }

  return stage;
}

export async function finalizeCallSession(
  supabase: SupabaseClient,
  sessionId: string,
  input: {
    status: string;
    twilioCallSid?: string | null;
    durationSeconds?: number | null;
    failureReason?: string | null;
  }
): Promise<void> {
  const { data: session, error: sessionError } = await supabase
    .from("crm_phone_call_sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();

  if (sessionError || !session) {
    console.error("finalizeCallSession: session not found", sessionId, sessionError?.message);
    return;
  }

  const duration =
    input.durationSeconds ??
    (typeof session.call_duration_seconds === "number" ? session.call_duration_seconds : null);

  const talkDuration = session.bridge_connected ? duration : null;

  const mergedSession = {
    ...session,
    status: input.status,
    twilio_call_sid: input.twilioCallSid ?? session.twilio_call_sid,
    call_duration_seconds: talkDuration,
    failure_reason: input.failureReason ?? session.failure_reason
  };

  await supabase
    .from("crm_phone_call_sessions")
    .update({
      status: input.status,
      twilio_call_sid: input.twilioCallSid ?? session.twilio_call_sid,
      call_duration_seconds: talkDuration,
      failure_reason: input.failureReason ?? session.failure_reason,
      updated_at: new Date().toISOString()
    })
    .eq("id", sessionId);

  const terminal = ["completed", "failed", "no-answer", "busy", "canceled"];
  if (terminal.includes(input.status)) {
    await finalizeInboundAutoCustomerAssignment(supabase, session, input.status, talkDuration);
  }

  if (!terminal.includes(input.status)) {
    return;
  }

  if (!session.customer_id) {
    return;
  }

  if (session.activity_id) {
    await supabase
      .from("crm_activities")
      .update({
        call_duration_seconds: talkDuration,
        body: formatCallBody(session.direction as "inbound" | "outbound", talkDuration),
        ...buildCallOutcomeActivityFields(mergedSession, input.status)
      })
      .eq("id", session.activity_id);
    return;
  }

  const direction = session.direction as "inbound" | "outbound";
  const agentUserId = session.agent_user_id as string | null;
  const authorEmail = agentUserId ? await fetchAgentEmail(supabase, agentUserId) : null;

  const { data: activity, error: activityError } = await supabase
    .from("crm_activities")
    .insert({
      customer_id: session.customer_id,
      author_id: agentUserId,
      author_email: authorEmail,
      kind: "call",
      body: formatCallBody(direction, talkDuration),
      source: "twilio",
      twilio_call_sid: input.twilioCallSid ?? session.twilio_call_sid,
      call_direction: direction,
      call_duration_seconds: talkDuration,
      call_from: session.call_from,
      call_to: session.call_to,
      ...buildCallOutcomeActivityFields(mergedSession, input.status)
    })
    .select("id")
    .single();

  if (activityError || !activity) {
    console.error("finalizeCallSession: activity insert failed", activityError?.message);
    return;
  }

  let recordingPath: string | null = null;
  if (typeof session.failure_reason === "string" && session.failure_reason.startsWith("recording:")) {
    recordingPath = session.failure_reason.slice("recording:".length);
  }

  await supabase
    .from("crm_phone_call_sessions")
    .update({
      activity_id: activity.id,
      failure_reason: recordingPath ? null : session.failure_reason,
      updated_at: new Date().toISOString()
    })
    .eq("id", sessionId);

  if (recordingPath) {
    await supabase
      .from("crm_activities")
      .update({ recording_storage_path: recordingPath })
      .eq("id", activity.id);
  }
}

export function buildDialTwiml(input: {
  dialE164: string;
  recordingCallbackUrl: string;
  statusCallbackUrl: string;
  sessionId: string;
  disclosure?: string | null;
}): string {
  const parts: string[] = ['<?xml version="1.0" encoding="UTF-8"?>', "<Response>"];
  if (input.disclosure?.trim()) {
    parts.push(`<Say voice="alice">${escapeXml(input.disclosure.trim())}</Say>`);
  }
  const dialActionUrl = `${input.statusCallbackUrl}?sessionId=${encodeURIComponent(input.sessionId)}&leg=dial`;
  parts.push(
    `<Dial record="record-from-answer" recordingStatusCallback="${escapeXml(input.recordingCallbackUrl)}" recordingStatusCallbackMethod="POST" action="${escapeXml(dialActionUrl)}" method="POST">`,
    `<Number>${escapeXml(input.dialE164)}</Number>`,
    "</Dial>",
    "</Response>"
  );
  return parts.join("");
}

export function buildInboundSmsWebhookUrl(config: TwilioConfig): string {
  return functionUrl(config.webhookBaseUrl, "twilio-inbound-sms");
}

export function buildSmsStatusWebhookUrl(config: TwilioConfig): string {
  return functionUrl(config.webhookBaseUrl, "twilio-sms-status");
}

export function truncateSmsPreview(body: string, maxLen = 120): string {
  const trimmed = body.trim().replace(/\s+/g, " ");
  if (trimmed.length <= maxLen) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxLen - 1)}…`;
}

export type TwilioPhoneIntelligence = {
  looked_up_at: string;
  valid: boolean;
  e164: string;
  national_format: string | null;
  country_code: string | null;
  line_type: string | null;
  carrier_name: string | null;
  caller_name: string | null;
  from_city: string | null;
  from_state: string | null;
  from_country: string | null;
};

const PLACEHOLDER_CUSTOMER_NAMES = /^(no name text|unknown caller)$/i;

export async function twilioLookupPhone(
  config: TwilioConfig,
  e164: string
): Promise<Omit<TwilioPhoneIntelligence, "looked_up_at" | "from_city" | "from_state" | "from_country"> | null> {
  const auth = btoa(`${config.accountSid}:${config.authToken}`);
  const url = `https://lookups.twilio.com/v2/PhoneNumbers/${encodeURIComponent(e164)}?Fields=${encodeURIComponent("line_type_intelligence,caller_name")}`;
  try {
    const response = await fetch(url, {
      headers: { Authorization: `Basic ${auth}` }
    });
    if (!response.ok) {
      const detail = await response.text();
      console.warn("twilioLookupPhone failed:", response.status, detail.slice(0, 240));
      return null;
    }
    const payload = await response.json();
    const lineIntel = payload?.line_type_intelligence ?? {};
    const callerIntel = payload?.caller_name ?? {};
    const callerNameRaw =
      typeof callerIntel?.caller_name === "string" ? callerIntel.caller_name.trim() : "";
    const callerName =
      callerNameRaw && !GENERIC_CALLER_NAME.test(callerNameRaw) ? callerNameRaw : null;

    return {
      valid: Boolean(payload?.valid),
      e164: typeof payload?.phone_number === "string" ? payload.phone_number : e164,
      national_format: typeof payload?.national_format === "string" ? payload.national_format : null,
      country_code: typeof payload?.country_code === "string" ? payload.country_code : null,
      line_type: typeof lineIntel?.type === "string" ? lineIntel.type : null,
      carrier_name: typeof lineIntel?.carrier_name === "string" ? lineIntel.carrier_name : null,
      caller_name: callerName
    };
  } catch (error) {
    console.warn("twilioLookupPhone error:", error);
    return null;
  }
}

export async function customerNeedsPhoneIntelligence(
  supabase: SupabaseClient,
  customerId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("crm_customers")
    .select("profile_metadata")
    .eq("id", customerId)
    .maybeSingle();
  const meta = (data?.profile_metadata ?? null) as Record<string, unknown> | null;
  return !meta?.phone_intelligence;
}

export async function enrichCustomerPhoneIntelligence(
  supabase: SupabaseClient,
  config: TwilioConfig,
  input: {
    customerId: string;
    phone10: string;
    webhookGeo?: {
      fromCity?: string | null;
      fromState?: string | null;
      fromCountry?: string | null;
    };
  }
): Promise<void> {
  const e164 = toE164Nanp(input.phone10);
  const lookup = await twilioLookupPhone(config, e164);
  const intelligence: TwilioPhoneIntelligence = {
    looked_up_at: new Date().toISOString(),
    valid: lookup?.valid ?? false,
    e164: lookup?.e164 ?? e164,
    national_format: lookup?.national_format ?? null,
    country_code: lookup?.country_code ?? input.webhookGeo?.fromCountry?.trim() ?? null,
    line_type: lookup?.line_type ?? null,
    carrier_name: lookup?.carrier_name ?? null,
    caller_name: lookup?.caller_name ?? null,
    from_city: input.webhookGeo?.fromCity?.trim() ?? null,
    from_state: input.webhookGeo?.fromState?.trim() ?? null,
    from_country: input.webhookGeo?.fromCountry?.trim() ?? null
  };

  const { data: customerRow } = await supabase
    .from("crm_customers")
    .select("display_name, profile_metadata")
    .eq("id", input.customerId)
    .maybeSingle();

  if (!customerRow) {
    return;
  }

  const existingMeta = (customerRow.profile_metadata ?? {}) as Record<string, unknown>;
  const creditInfo = (existingMeta.credit_application_info ?? {}) as Record<string, unknown>;
  const patch: Record<string, unknown> = {
    profile_metadata: {
      ...existingMeta,
      phone_intelligence: intelligence,
      credit_application_info: creditInfo
    }
  };

  const displayName = String(customerRow.display_name ?? "").trim();
  const cnam = intelligence.caller_name?.trim() ?? "";
  if (cnam && PLACEHOLDER_CUSTOMER_NAMES.test(displayName)) {
    const { displayName: parsedName, firstName, lastName } = parseInboundCallerDisplayName(cnam);
    patch.display_name = parsedName;
    patch.profile_metadata = {
      ...(patch.profile_metadata as Record<string, unknown>),
      credit_application_info: {
        ...creditInfo,
        first_name: firstName,
        last_name: lastName,
        phone: input.phone10
      }
    };
  }

  const { error } = await supabase.from("crm_customers").update(patch).eq("id", input.customerId);
  if (error) {
    console.error("enrichCustomerPhoneIntelligence failed:", error.message);
  }
}

export async function notifyInboundCall(
  supabase: SupabaseClient,
  input: {
    customerId: string | null;
    agentUserId: string | null;
    customerName: string | null;
  }
): Promise<void> {
  if (!input.agentUserId) {
    return;
  }

  const title = input.customerName?.trim() || "Incoming call";
  const { error } = await supabase.from("crm_notifications").insert({
    user_id: input.agentUserId,
    type: "inbound_call",
    title,
    body: "Your phone is ringing — answer to connect with the caller.",
    customer_id: input.customerId
  });

  if (error) {
    console.error("notifyInboundCall failed:", error.message);
    return;
  }

  const url = input.customerId ? `/crm?customer=${input.customerId}` : "/crm";
  void sendWebPushToUser(supabase, input.agentUserId, {
    title,
    body: "Your phone is ringing — answer to connect with the caller.",
    url,
    tag: input.customerId ? `inbound_call:${input.customerId}` : "inbound_call"
  }).catch((pushError) => console.error("notifyInboundCall web push failed:", pushError));
}

export async function twilioSendMessage(
  config: TwilioConfig,
  input: {
    toE164: string;
    body: string;
    statusCallbackUrl?: string;
  }
): Promise<{ sid: string; status: string } | { error: string }> {
  const body = new URLSearchParams({
    To: input.toE164,
    From: config.phoneNumber,
    Body: input.body
  });
  if (input.statusCallbackUrl?.trim()) {
    body.set("StatusCallback", input.statusCallbackUrl.trim());
  }

  const auth = btoa(`${config.accountSid}:${config.authToken}`);
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body
    }
  );

  const payload = await response.json();
  if (!response.ok) {
    const message =
      typeof payload?.message === "string" ? payload.message : `Twilio error (${response.status})`;
    return { error: message };
  }
  return { sid: String(payload.sid), status: String(payload.status ?? "queued") };
}

export async function upsertSmsThread(
  supabase: SupabaseClient,
  input: {
    customerId: string;
    activityId: string;
    preview: string;
    direction: "inbound" | "outbound";
    assignedTo: string | null;
    messageAt: string;
  }
): Promise<void> {
  const { error } = await supabase.from("crm_sms_threads").upsert(
    {
      customer_id: input.customerId,
      last_message_at: input.messageAt,
      last_message_preview: truncateSmsPreview(input.preview),
      last_message_direction: input.direction,
      last_activity_id: input.activityId,
      assigned_to: input.assignedTo,
      updated_at: new Date().toISOString()
    },
    { onConflict: "customer_id" }
  );
  if (error) {
    console.error("upsertSmsThread failed:", error.message);
  }
}

export async function insertSmsActivity(
  supabase: SupabaseClient,
  input: {
    customerId: string;
    authorId: string | null;
    authorEmail: string | null;
    body: string;
    direction: "inbound" | "outbound";
    from: string;
    to: string;
    messageSid: string;
    status: string;
  }
): Promise<{ id: string } | null> {
  const { data: existing } = await supabase
    .from("crm_activities")
    .select("id")
    .eq("twilio_message_sid", input.messageSid)
    .maybeSingle();

  if (existing?.id) {
    return { id: String(existing.id) };
  }

  const { data, error } = await supabase
    .from("crm_activities")
    .insert({
      customer_id: input.customerId,
      author_id: input.authorId,
      author_email: input.authorEmail,
      kind: "text",
      body: input.body.trim(),
      source: "twilio",
      twilio_message_sid: input.messageSid,
      sms_direction: input.direction,
      sms_from: input.from,
      sms_to: input.to,
      sms_status: input.status
    })
    .select("id, created_at")
    .single();

  if (error || !data) {
    console.error("insertSmsActivity failed:", error?.message);
    return null;
  }

  const { data: customer } = await supabase
    .from("crm_customers")
    .select("assigned_to")
    .eq("id", input.customerId)
    .maybeSingle();

  await upsertSmsThread(supabase, {
    customerId: input.customerId,
    activityId: String(data.id),
    preview: input.body,
    direction: input.direction,
    assignedTo: customer?.assigned_to ? String(customer.assigned_to) : null,
    messageAt: String(data.created_at)
  });

  return { id: String(data.id) };
}

export async function findOrCreateInboundSmsCustomer(
  supabase: SupabaseClient,
  input: {
    phone10: string;
    assignedTo: string | null;
  }
): Promise<{ id: string; created: boolean; assigned_to: string | null } | null> {
  const existing = await findCustomerByPhone(supabase, input.phone10);
  if (existing) {
    return { id: existing.id, created: false, assigned_to: existing.assigned_to };
  }

  const displayName = "No name text";
  const assignedEmail = input.assignedTo ? await fetchAgentEmail(supabase, input.assignedTo) : null;

  const { data, error } = await supabase
    .from("crm_customers")
    .insert({
      display_name: displayName,
      phone: input.phone10,
      email: null,
      secondary_phone: null,
      date_of_birth: null,
      status: "active",
      pipeline_stage: "fresh_lead",
      assigned_to: input.assignedTo,
      assigned_to_email: assignedEmail,
      profile_metadata: {
        source: "inbound_sms",
        credit_application_info: {
          first_name: "No name",
          last_name: "text",
          phone: input.phone10
        }
      }
    })
    .select("id, assigned_to")
    .single();

  if (error || !data) {
    if (error && /duplicate|unique|already exists/i.test(error.message)) {
      const retry = await findCustomerByPhone(supabase, input.phone10);
      if (retry) {
        return { id: retry.id, created: false, assigned_to: retry.assigned_to };
      }
    }
    console.error("findOrCreateInboundSmsCustomer failed:", error?.message);
    return null;
  }

  return {
    id: String(data.id),
    created: true,
    assigned_to: data.assigned_to ? String(data.assigned_to) : null
  };
}

export async function notifyInboundSms(
  supabase: SupabaseClient,
  input: {
    customerId: string;
    assigneeUserId: string | null;
    preview: string;
    customerName: string | null;
  }
): Promise<void> {
  if (!input.assigneeUserId) {
    return;
  }

  const title = input.customerName?.trim() || "New text message";
  const body = truncateSmsPreview(input.preview, 200);

  const { error } = await supabase.from("crm_notifications").insert({
    user_id: input.assigneeUserId,
    type: "inbound_sms",
    title,
    body,
    customer_id: input.customerId
  });

  if (error) {
    console.error("notifyInboundSms failed:", error.message);
    return;
  }

  void sendWebPushToUser(supabase, input.assigneeUserId, {
    title,
    body,
    url: `/crm?chat=${input.customerId}`,
    tag: `inbound_sms:${input.customerId}`
  }).catch((pushError) => console.error("notifyInboundSms web push failed:", pushError));
}

const SMS_OPT_OUT_PATTERN = /^(stop|stopall|unsubscribe|cancel|end|quit)$/i;

export function isSmsOptOut(body: string): boolean {
  return SMS_OPT_OUT_PATTERN.test(body.trim());
}
