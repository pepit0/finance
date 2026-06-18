import {
  applyOutboundCallPipelineStage,
  buildVoiceWebhookUrl,
  corsHeaders,
  fetchOrgVoiceSettings,
  functionUrl,
  getServiceSupabase,
  getTwilioConfig,
  getUserSupabase,
  jsonResponse,
  normalizeNanpTo10Digits,
  toE164Nanp,
  twilioCreateCall,
  userHasPermission
} from "../_shared/twilio.ts";

type InitiateBody = {
  customer_id?: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ ok: false, error: "Method not allowed" }, 405);
  }

  const userSupabase = getUserSupabase(req);
  if (!userSupabase) {
    return jsonResponse({ ok: false, error: "Unauthorized" }, 401);
  }

  const {
    data: { user }
  } = await userSupabase.auth.getUser();
  if (!user?.id) {
    return jsonResponse({ ok: false, error: "Unauthorized" }, 401);
  }

  const canPlace = await userHasPermission(userSupabase, "calls.place");
  if (!canPlace) {
    return jsonResponse({ ok: false, error: "You do not have permission to place calls." }, 403);
  }

  let body: InitiateBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ ok: false, error: "Invalid JSON body." }, 400);
  }

  const customerId = body.customer_id?.trim();
  if (!customerId) {
    return jsonResponse({ ok: false, error: "customer_id is required." }, 400);
  }

  const config = getTwilioConfig();
  const serviceSupabase = getServiceSupabase();
  if (!config || !serviceSupabase) {
    return jsonResponse({ ok: false, error: "Twilio is not configured on the server." }, 500);
  }

  const { data: agentRow, error: agentError } = await serviceSupabase
    .from("crm_user_directory")
    .select("callback_phone, email")
    .eq("user_id", user.id)
    .maybeSingle();

  if (agentError) {
    return jsonResponse({ ok: false, error: agentError.message }, 422);
  }

  const agentPhone = agentRow?.callback_phone
    ? normalizeNanpTo10Digits(String(agentRow.callback_phone))
    : null;
  if (!agentPhone) {
    return jsonResponse(
      {
        ok: false,
        error: "Set your phone for calls on the Team tab before placing calls."
      },
      422
    );
  }

  const { data: customer, error: customerError } = await serviceSupabase
    .from("crm_customers")
    .select("id, phone, secondary_phone")
    .eq("id", customerId)
    .maybeSingle();

  if (customerError || !customer) {
    return jsonResponse({ ok: false, error: "Customer not found." }, 404);
  }

  const customerPhone =
    (customer.phone ? normalizeNanpTo10Digits(String(customer.phone)) : null) ??
    (customer.secondary_phone ? normalizeNanpTo10Digits(String(customer.secondary_phone)) : null);

  if (!customerPhone) {
    return jsonResponse({ ok: false, error: "Customer has no phone number on file." }, 422);
  }

  const { data: session, error: sessionError } = await serviceSupabase
    .from("crm_phone_call_sessions")
    .insert({
      customer_id: customerId,
      agent_user_id: user.id,
      direction: "outbound",
      status: "initiated",
      call_from: agentPhone,
      call_to: customerPhone,
      dial_target_phone: customerPhone
    })
    .select("id")
    .single();

  if (sessionError || !session) {
    return jsonResponse({ ok: false, error: sessionError?.message ?? "Could not start call session." }, 422);
  }

  const sessionId = String(session.id);
  const voiceUrl = buildVoiceWebhookUrl(config, sessionId);
  const statusUrl = `${functionUrl(config.webhookBaseUrl, "twilio-call-status")}?sessionId=${encodeURIComponent(sessionId)}`;

  const callResult = await twilioCreateCall(config, {
    toE164: toE164Nanp(agentPhone),
    url: voiceUrl,
    statusCallback: statusUrl
  });

  if ("error" in callResult) {
    await serviceSupabase
      .from("crm_phone_call_sessions")
      .update({
        status: "failed",
        failure_reason: callResult.error,
        updated_at: new Date().toISOString()
      })
      .eq("id", sessionId);
    return jsonResponse({ ok: false, error: callResult.error }, 422);
  }

  const { error: sidUpdateError } = await serviceSupabase
    .from("crm_phone_call_sessions")
    .update({
      twilio_call_sid: callResult.sid,
      status: "ringing",
      updated_at: new Date().toISOString()
    })
    .eq("id", sessionId);

  if (sidUpdateError) {
    console.error("twilio_call_sid update failed:", sidUpdateError.message);
    return jsonResponse({ ok: false, error: "Call started but session could not be saved." }, 500);
  }

  const { error: voiceUrlError } = await serviceSupabase
    .from("crm_phone_call_sessions")
    .update({
      voice_webhook_url: voiceUrl,
      updated_at: new Date().toISOString()
    })
    .eq("id", sessionId);

  if (voiceUrlError) {
    console.warn("voice_webhook_url update failed (run sql/crm_phone_call_sessions_voice_webhook_url.sql):", voiceUrlError.message);
  }

  // Warm org settings cache path (disclosure used when agent answers).
  await fetchOrgVoiceSettings(serviceSupabase);

  const pipelineStage = await applyOutboundCallPipelineStage(serviceSupabase, customerId);

  return jsonResponse({
    ok: true,
    session_id: sessionId,
    call_sid: callResult.sid,
    pipeline_stage: pipelineStage,
    message: "Calling your phone now. Answer to connect to the customer."
  });
});
