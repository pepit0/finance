import {
  authorizeKnownTwilioCall,
  corsHeaders,
  finalizeCallSession,
  functionUrl,
  getServiceSupabase,
  getTwilioConfig,
  parseTwilioForm,
  twimlResponse,
  validateTwilioSignature
} from "../_shared/twilio.ts";

const EMPTY_TWIML = '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';

const TERMINAL_STATUSES = new Set(["completed", "failed", "no-answer", "busy", "canceled"]);

function mapTwilioStatus(value: string | undefined): string {
  switch ((value ?? "").toLowerCase()) {
    case "queued":
    case "initiated":
      return "initiated";
    case "ringing":
      return "ringing";
    case "in-progress":
    case "answered":
      return "in-progress";
    case "completed":
      return "completed";
    case "busy":
      return "busy";
    case "no-answer":
      return "no-answer";
    case "canceled":
      return "canceled";
    case "failed":
      return "failed";
    default:
      return "initiated";
  }
}

function parseDialDuration(params: Record<string, string>): number | null {
  const raw = params.DialCallDuration ?? "";
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function parseParentDuration(params: Record<string, string>): number | null {
  const raw = params.CallDuration ?? "";
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function isTerminalStatus(status: string | null | undefined): boolean {
  return TERMINAL_STATUSES.has((status ?? "").toLowerCase());
}

function isBridgeConnected(dialStatus: string, dialDurationSeconds: number | null): boolean {
  return dialStatus === "completed" && dialDurationSeconds != null && dialDurationSeconds > 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  const config = getTwilioConfig();
  const serviceSupabase = getServiceSupabase();
  if (!config || !serviceSupabase) {
    return new Response("Not configured", { status: 500, headers: corsHeaders });
  }

  const params = await parseTwilioForm(req);
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("sessionId")?.trim() ?? "";
  const valid =
    (await validateTwilioSignature(req, params, config.authToken, config, {
      functionName: "twilio-call-status",
      sessionId: sessionId || undefined,
      knownWebhookUrl: sessionId
        ? `${functionUrl(config.webhookBaseUrl, "twilio-call-status")}?sessionId=${encodeURIComponent(sessionId)}`
        : null
    })) || (await authorizeKnownTwilioCall(serviceSupabase, params, sessionId || undefined));
  if (!valid) {
    return new Response("Invalid Twilio signature", { status: 403, headers: corsHeaders });
  }

  if (!sessionId) {
    return new Response("Missing sessionId", { status: 400, headers: corsHeaders });
  }

  const { data: session, error: sessionError } = await serviceSupabase
    .from("crm_phone_call_sessions")
    .select(
      "direction, agent_answered, dial_call_status, bridge_connected, status, call_duration_seconds, parent_call_duration_seconds"
    )
    .eq("id", sessionId)
    .maybeSingle();

  if (sessionError || !session) {
    return new Response("Session not found", { status: 404, headers: corsHeaders });
  }

  const dialLeg = url.searchParams.get("leg") === "dial" || Boolean(params.DialCallStatus);
  const dialStatusRaw = params.DialCallStatus;
  const callStatusRaw = params.CallStatus;
  const dialDuration = parseDialDuration(params);
  const parentDuration = parseParentDuration(params);
  const now = new Date().toISOString();

  if (dialLeg && params.DialCallSid?.trim()) {
    const { error: dialSidError } = await serviceSupabase
      .from("crm_phone_call_sessions")
      .update({
        twilio_dial_call_sid: params.DialCallSid.trim(),
        updated_at: now
      })
      .eq("id", sessionId);
    if (dialSidError) {
      console.warn(
        "twilio_dial_call_sid update failed (run sql/crm_phone_call_sessions_dial_call_sid.sql):",
        dialSidError.message
      );
    }
  }

  const sessionPatch: Record<string, unknown> = { updated_at: now };
  let finalizeStatus: string | null = null;
  let finalizeDuration: number | null = null;
  let finalizeFailureReason: string | null = null;

  if (dialLeg) {
    const mappedDial = mapTwilioStatus(dialStatusRaw);
    sessionPatch.dial_call_status = dialStatusRaw ?? mappedDial;
    const bridgeConnected = isBridgeConnected(mappedDial, dialDuration);
    sessionPatch.bridge_connected = bridgeConnected;
    sessionPatch.status = mappedDial;
    if (bridgeConnected) {
      sessionPatch.call_duration_seconds = dialDuration;
    } else {
      sessionPatch.call_duration_seconds = null;
    }
    if (session.direction === "inbound") {
      if (mappedDial === "in-progress" || bridgeConnected) {
        sessionPatch.agent_answered = true;
      }
    } else if (bridgeConnected) {
      sessionPatch.agent_answered = true;
    }
    finalizeStatus = mappedDial;
    finalizeDuration = bridgeConnected ? dialDuration : null;
    if (mappedDial === "failed" || mappedDial === "no-answer" || mappedDial === "busy") {
      finalizeFailureReason = dialStatusRaw ?? mappedDial;
    }
  } else {
    const mappedParent = mapTwilioStatus(callStatusRaw);
    sessionPatch.parent_call_status = callStatusRaw ?? mappedParent;
    if (parentDuration != null) {
      sessionPatch.parent_call_duration_seconds = parentDuration;
    }
    const dialAlreadyTerminal = isTerminalStatus(session.dial_call_status ? String(session.dial_call_status) : null);

    if (!dialAlreadyTerminal) {
      sessionPatch.status = mappedParent;
      if (parentDuration != null && !session.agent_answered) {
        sessionPatch.call_duration_seconds = parentDuration;
      }
      if (isTerminalStatus(mappedParent)) {
        if (session.agent_answered) {
          // Agent picked up Twilio but hung up before/alongside customer bridge — not customer talk time.
          finalizeStatus = session.dial_call_status ? mappedParent : "canceled";
          finalizeDuration = null;
        } else {
          finalizeStatus = mappedParent;
          finalizeDuration =
            parentDuration ??
            (typeof session.call_duration_seconds === "number" ? session.call_duration_seconds : null);
        }
        if (mappedParent === "failed" || mappedParent === "no-answer" || mappedParent === "busy") {
          finalizeFailureReason = callStatusRaw ?? mappedParent;
        }
      }
    }
  }

  const { error: patchError } = await serviceSupabase
    .from("crm_phone_call_sessions")
    .update(sessionPatch)
    .eq("id", sessionId);

  if (patchError) {
    console.warn("twilio-call-status session patch failed (run sql/crm_call_outcome.sql):", patchError.message);
  }

  if (finalizeStatus && isTerminalStatus(finalizeStatus)) {
    await finalizeCallSession(serviceSupabase, sessionId, {
      status: finalizeStatus,
      twilioCallSid: params.CallSid ?? params.ParentCallSid ?? null,
      durationSeconds: finalizeDuration,
      failureReason: finalizeFailureReason
    });
  }

  if (dialLeg) {
    return twimlResponse(EMPTY_TWIML);
  }

  return new Response("ok", { status: 200, headers: corsHeaders });
});
