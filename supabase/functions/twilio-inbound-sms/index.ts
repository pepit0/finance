import {
  customerNeedsPhoneIntelligence,
  enrichCustomerPhoneIntelligence,
  findOrCreateInboundSmsCustomer,
  getServiceSupabase,
  getTwilioConfig,
  insertSmsActivity,
  isSmsOptOut,
  normalizeNanpTo10Digits,
  notifyInboundSms,
  parseTwilioForm,
  validateTwilioSignature
} from "../_shared/twilio.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*" } });
  }

  if (req.method !== "POST") {
    return new Response(null, { status: 405 });
  }

  const config = getTwilioConfig();
  const serviceSupabase = getServiceSupabase();
  if (!config || !serviceSupabase) {
    console.error("twilio-inbound-sms: Twilio or Supabase not configured");
    return new Response(null, { status: 500 });
  }

  const params = await parseTwilioForm(req);
  const signatureValid = await validateTwilioSignature(req, params, config.authToken, config, {
    functionName: "twilio-inbound-sms"
  });
  if (!signatureValid) {
    console.error("twilio-inbound-sms: signature validation failed");
    return new Response(null, { status: 403 });
  }

  const fromRaw = params.From?.trim() ?? "";
  const toRaw = params.To?.trim() ?? "";
  const messageBody = params.Body?.trim() ?? "";
  const messageSid = params.MessageSid?.trim() ?? "";

  if (!fromRaw || !messageSid) {
    return new Response(null, { status: 400 });
  }

  if (isSmsOptOut(messageBody)) {
    console.log("twilio-inbound-sms: opt-out received from", fromRaw);
    return new Response(null, { status: 204 });
  }

  const phone10 = normalizeNanpTo10Digits(fromRaw);
  if (!phone10) {
    console.error("twilio-inbound-sms: could not normalize From", fromRaw);
    return new Response(null, { status: 204 });
  }

  const customerResult = await findOrCreateInboundSmsCustomer(serviceSupabase, {
    phone10,
    assignedTo: null
  });

  if (!customerResult) {
    console.error("twilio-inbound-sms: could not resolve customer for", phone10);
    return new Response(null, { status: 204 });
  }

  const needsIntel = customerResult.created || (await customerNeedsPhoneIntelligence(serviceSupabase, customerResult.id));
  if (needsIntel) {
    await enrichCustomerPhoneIntelligence(serviceSupabase, config, {
      customerId: customerResult.id,
      phone10,
      webhookGeo: {
        fromCity: params.FromCity ?? null,
        fromState: params.FromState ?? null,
        fromCountry: params.FromCountry ?? null
      }
    });
  }

  const { data: customerRow } = await serviceSupabase
    .from("crm_customers")
    .select("display_name, assigned_to")
    .eq("id", customerResult.id)
    .maybeSingle();

  const activity = await insertSmsActivity(serviceSupabase, {
    customerId: customerResult.id,
    authorId: null,
    authorEmail: null,
    body: messageBody || "(empty message)",
    direction: "inbound",
    from: fromRaw,
    to: toRaw || config.phoneNumber,
    messageSid,
    status: "received"
  });

  if (activity) {
    await notifyInboundSms(serviceSupabase, {
      customerId: customerResult.id,
      assigneeUserId: customerRow?.assigned_to ? String(customerRow.assigned_to) : null,
      preview: messageBody,
      customerName: customerRow?.display_name ? String(customerRow.display_name) : null
    });
  }

  return new Response(null, { status: 204 });
});
