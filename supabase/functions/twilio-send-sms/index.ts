import {
  buildSmsStatusWebhookUrl,
  corsHeaders,
  fetchAgentEmail,
  getServiceSupabase,
  getTwilioConfig,
  getUserSupabase,
  insertSmsActivity,
  jsonResponse,
  normalizeNanpTo10Digits,
  toE164Nanp,
  twilioSendMessage,
  userHasPermission
} from "../_shared/twilio.ts";

type SendSmsBody = {
  customer_id?: string;
  body?: string;
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

  const canSend = await userHasPermission(userSupabase, "texts.send");
  if (!canSend) {
    return jsonResponse({ ok: false, error: "You do not have permission to send texts." }, 403);
  }

  let body: SendSmsBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ ok: false, error: "Invalid JSON body." }, 400);
  }

  const customerId = body.customer_id?.trim();
  const messageBody = body.body?.trim();
  if (!customerId) {
    return jsonResponse({ ok: false, error: "customer_id is required." }, 400);
  }
  if (!messageBody) {
    return jsonResponse({ ok: false, error: "Message body is required." }, 400);
  }

  const config = getTwilioConfig();
  const serviceSupabase = getServiceSupabase();
  if (!config || !serviceSupabase) {
    return jsonResponse({ ok: false, error: "Twilio is not configured on the server." }, 500);
  }

  const { data: customer, error: customerError } = await serviceSupabase
    .from("crm_customers")
    .select("id, phone, secondary_phone, assigned_to")
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

  const statusCallback = buildSmsStatusWebhookUrl(config);
  const sendResult = await twilioSendMessage(config, {
    toE164: toE164Nanp(customerPhone),
    body: messageBody,
    statusCallbackUrl: statusCallback
  });

  if ("error" in sendResult) {
    return jsonResponse({ ok: false, error: sendResult.error }, 422);
  }

  const authorEmail = (await fetchAgentEmail(serviceSupabase, user.id)) ?? user.email ?? null;
  const activity = await insertSmsActivity(serviceSupabase, {
    customerId,
    authorId: user.id,
    authorEmail,
    body: messageBody,
    direction: "outbound",
    from: config.phoneNumber,
    to: toE164Nanp(customerPhone),
    messageSid: sendResult.sid,
    status: sendResult.status
  });

  if (!activity) {
    return jsonResponse(
      {
        ok: true,
        message_sid: sendResult.sid,
        warning: "Message sent but could not be logged in CRM."
      },
      200
    );
  }

  return jsonResponse({
    ok: true,
    activity_id: activity.id,
    message_sid: sendResult.sid
  });
});
