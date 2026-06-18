import {
  authorizeKnownTwilioCall,
  authorizeKnownTwilioInbound,
  buildDialTwiml,
  buildInboundVoiceWebhookUrl,
  buildVoiceWebhookUrl,
  corsHeaders,
  customerNeedsPhoneIntelligence,
  enrichCustomerPhoneIntelligence,
  fetchAgentCallbackPhone,
  fetchOrgVoiceSettings,
  findAgentUserIdByCallbackPhone,
  findCustomerByPhone,
  findOrCreateInboundUnknownCustomer,
  functionUrl,
  getServiceSupabase,
  getTwilioConfig,
  normalizeNanpTo10Digits,
  notifyInboundCall,
  parseTwilioForm,
  toE164Nanp,
  twimlResponse,
  validateTwilioSignature
} from "../_shared/twilio.ts";

function mapInboundStatus(callStatus: string): string {
  switch (callStatus) {
    case "ringing":
      return "ringing";
    case "in-progress":
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

function scheduleInboundCallSideEffects(input: {
  serviceSupabase: NonNullable<ReturnType<typeof getServiceSupabase>>;
  config: NonNullable<ReturnType<typeof getTwilioConfig>>;
  customerId: string | null;
  customerDisplayName: string | null;
  caller10: string;
  agentUserId: string | null;
  inboundAutoCreatedCustomer: boolean;
  params: Record<string, string>;
}): void {
  const task = (async () => {
    let customerName = input.customerDisplayName;
    if (input.customerId) {
      const needsIntel =
        input.inboundAutoCreatedCustomer ||
        (await customerNeedsPhoneIntelligence(input.serviceSupabase, input.customerId));
      if (needsIntel) {
        await enrichCustomerPhoneIntelligence(input.serviceSupabase, input.config, {
          customerId: input.customerId,
          phone10: input.caller10,
          webhookGeo: {
            fromCity: input.params.FromCity ?? null,
            fromState: input.params.FromState ?? null,
            fromCountry: input.params.FromCountry ?? null
          }
        });
      }
      const { data: refreshed } = await input.serviceSupabase
        .from("crm_customers")
        .select("display_name")
        .eq("id", input.customerId)
        .maybeSingle();
      customerName = refreshed?.display_name ? String(refreshed.display_name) : customerName;
    }
    await notifyInboundCall(input.serviceSupabase, {
      customerId: input.customerId,
      agentUserId: input.agentUserId,
      customerName
    });
  })();

  const edge = (globalThis as { EdgeRuntime?: { waitUntil: (promise: Promise<unknown>) => void } }).EdgeRuntime;
  if (edge?.waitUntil) {
    edge.waitUntil(task);
  } else {
    void task;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return twimlResponse('<?xml version="1.0" encoding="UTF-8"?><Response><Say>Method not allowed.</Say></Response>');
  }

  try {
    const config = getTwilioConfig();
    const serviceSupabase = getServiceSupabase();
    if (!config || !serviceSupabase) {
      return twimlResponse(
        '<?xml version="1.0" encoding="UTF-8"?><Response><Say>Voice is not configured.</Say></Response>'
      );
    }

    const params = await parseTwilioForm(req);
    const incoming = new URL(req.url);
    let sessionId = incoming.searchParams.get("sessionId")?.trim() ?? "";
    let knownWebhookUrl: string | null = null;

    if (params.CallSid) {
      const { data: sessionByCall, error: sessionByCallError } = await serviceSupabase
        .from("crm_phone_call_sessions")
        .select("id")
        .eq("twilio_call_sid", params.CallSid)
        .maybeSingle();
      if (sessionByCallError) {
        console.warn("session lookup by CallSid failed:", sessionByCallError.message);
      } else if (sessionByCall) {
        if (!sessionId) {
          sessionId = String(sessionByCall.id);
        }
        const { data: voiceUrlRow } = await serviceSupabase
          .from("crm_phone_call_sessions")
          .select("voice_webhook_url")
          .eq("id", sessionByCall.id)
          .maybeSingle();
        knownWebhookUrl = voiceUrlRow?.voice_webhook_url
          ? String(voiceUrlRow.voice_webhook_url)
          : null;
      }
    }

    if (sessionId && !knownWebhookUrl) {
      const { data: sessionById } = await serviceSupabase
        .from("crm_phone_call_sessions")
        .select("voice_webhook_url")
        .eq("id", sessionId)
        .maybeSingle();
      knownWebhookUrl = sessionById?.voice_webhook_url ? String(sessionById.voice_webhook_url) : null;
    }

    if (!knownWebhookUrl && sessionId) {
      knownWebhookUrl = buildVoiceWebhookUrl(config, sessionId);
    }
    if (!knownWebhookUrl && !sessionId) {
      knownWebhookUrl = buildInboundVoiceWebhookUrl(config);
    }

    const signatureValid = await validateTwilioSignature(req, params, config.authToken, config, {
      functionName: "twilio-voice",
      sessionId,
      knownWebhookUrl
    });
    const knownCall = signatureValid
      ? true
      : sessionId
        ? await authorizeKnownTwilioCall(serviceSupabase, params, sessionId)
        : authorizeKnownTwilioInbound(config, params);

    if (!signatureValid && !knownCall) {
      return twimlResponse(
        '<?xml version="1.0" encoding="UTF-8"?><Response><Say>Unable to verify this call request.</Say></Response>'
      );
    }

  const voiceSettings = await fetchOrgVoiceSettings(serviceSupabase);
  const recordingCallbackUrl = functionUrl(config.webhookBaseUrl, "twilio-recording");
  const statusCallbackUrl = functionUrl(config.webhookBaseUrl, "twilio-call-status");
  const disclosure =
    voiceSettings.twilio_recording_disclosure_enabled
      ? voiceSettings.twilio_recording_disclosure_text
      : null;

  if (sessionId) {
    const { data: session } = await serviceSupabase
      .from("crm_phone_call_sessions")
      .select("*")
      .eq("id", sessionId)
      .maybeSingle();

    if (!session) {
      return twimlResponse(
        '<?xml version="1.0" encoding="UTF-8"?><Response><Say>Call session not found.</Say></Response>'
      );
    }

    const customerPhone = session.dial_target_phone
      ? normalizeNanpTo10Digits(String(session.dial_target_phone))
      : session.call_to
        ? normalizeNanpTo10Digits(String(session.call_to))
        : null;

    if (!customerPhone) {
      return twimlResponse(
        '<?xml version="1.0" encoding="UTF-8"?><Response><Say>Customer phone not available.</Say></Response>'
      );
    }

    await serviceSupabase
      .from("crm_phone_call_sessions")
      .update({
        status: "in-progress",
        agent_answered: true,
        twilio_call_sid: params.CallSid ?? session.twilio_call_sid,
        updated_at: new Date().toISOString()
      })
      .eq("id", sessionId);

    const xml = buildDialTwiml({
      dialE164: toE164Nanp(customerPhone),
      recordingCallbackUrl: `${recordingCallbackUrl}?sessionId=${encodeURIComponent(sessionId)}`,
      statusCallbackUrl,
      sessionId,
      disclosure
    });
    return twimlResponse(xml);
  }

  // Inbound call to the dealership Twilio number.
  const fromRaw = params.From ?? "";
  const caller10 = normalizeNanpTo10Digits(fromRaw);
  if (!caller10) {
    return twimlResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response><Say>Invalid caller number.</Say></Response>'
    );
  }

  const customer = await findCustomerByPhone(serviceSupabase, caller10);
  let agentUserId = customer?.assigned_to ?? null;
  let dialPhone10: string | null = null;

  if (agentUserId) {
    dialPhone10 = await fetchAgentCallbackPhone(serviceSupabase, agentUserId);
  }

  if (!dialPhone10) {
    dialPhone10 = voiceSettings.inbound_fallback_callback_phone
      ? normalizeNanpTo10Digits(voiceSettings.inbound_fallback_callback_phone)
      : null;
  }

  if (!dialPhone10) {
    return twimlResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response><Say>No agent is available to take your call. Please try again later.</Say></Response>'
    );
  }

  if (!agentUserId) {
    agentUserId = await findAgentUserIdByCallbackPhone(serviceSupabase, dialPhone10);
  }

  let customerId = customer?.id ?? null;
  let inboundAutoCreatedCustomer = false;
  if (!customerId) {
    const created = await findOrCreateInboundUnknownCustomer(serviceSupabase, {
      phone10: caller10,
      callerName: params.CallerName ?? null,
      assignedTo: agentUserId
    });
    if (created) {
      customerId = created.id;
      inboundAutoCreatedCustomer = created.created;
    }
  }

  const { data: inboundSession, error: inboundError } = await serviceSupabase
    .from("crm_phone_call_sessions")
    .insert({
      customer_id: customerId,
      agent_user_id: agentUserId,
      direction: "inbound",
      status: mapInboundStatus(params.CallStatus ?? "ringing"),
      twilio_call_sid: params.CallSid ?? null,
      call_from: caller10,
      call_to: dialPhone10,
      dial_target_phone: dialPhone10,
      ...(inboundAutoCreatedCustomer ? { inbound_auto_created_customer: true } : {})
    })
    .select("id")
    .single();

  if ((inboundError || !inboundSession) && inboundAutoCreatedCustomer) {
    console.warn("inbound session insert with auto-customer flag failed, retrying:", inboundError?.message);
    const { data: retrySession, error: retryError } = await serviceSupabase
      .from("crm_phone_call_sessions")
      .insert({
        customer_id: customerId,
        agent_user_id: agentUserId,
        direction: "inbound",
        status: mapInboundStatus(params.CallStatus ?? "ringing"),
        twilio_call_sid: params.CallSid ?? null,
        call_from: caller10,
        call_to: dialPhone10,
        dial_target_phone: dialPhone10
      })
      .select("id")
      .single();
    if (retryError || !retrySession) {
      console.error("inbound session insert failed:", retryError?.message ?? inboundError?.message);
      return twimlResponse(
        '<?xml version="1.0" encoding="UTF-8"?><Response><Say>Unable to route your call.</Say></Response>'
      );
    }
    const inboundSessionId = String(retrySession.id);
    scheduleInboundCallSideEffects({
      serviceSupabase,
      config,
      customerId,
      customerDisplayName: customer?.display_name ?? null,
      caller10,
      agentUserId,
      inboundAutoCreatedCustomer,
      params
    });
    const xml = buildDialTwiml({
      dialE164: toE164Nanp(dialPhone10),
      recordingCallbackUrl: `${recordingCallbackUrl}?sessionId=${encodeURIComponent(inboundSessionId)}`,
      statusCallbackUrl,
      sessionId: inboundSessionId,
      disclosure
    });
    return twimlResponse(xml);
  }

  if (inboundError || !inboundSession) {
    console.error("inbound session insert failed:", inboundError?.message);
    return twimlResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response><Say>Unable to route your call.</Say></Response>'
    );
  }

  const inboundSessionId = String(inboundSession.id);
  scheduleInboundCallSideEffects({
    serviceSupabase,
    config,
    customerId,
    customerDisplayName: customer?.display_name ?? null,
    caller10,
    agentUserId,
    inboundAutoCreatedCustomer,
    params
  });
  const xml = buildDialTwiml({
    dialE164: toE164Nanp(dialPhone10),
    recordingCallbackUrl: `${recordingCallbackUrl}?sessionId=${encodeURIComponent(inboundSessionId)}`,
    statusCallbackUrl,
    sessionId: inboundSessionId,
    disclosure
  });

  // Also set status callback on inbound parent via Twilio console; Dial action handles completion.
  return twimlResponse(xml);
  } catch (error) {
    console.error("twilio-voice failed:", error);
    return twimlResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response><Say>We could not connect your call. Please try again.</Say></Response>'
    );
  }
});
