import {
  getServiceSupabase,
  getTwilioConfig,
  parseTwilioForm,
  validateTwilioSignature
} from "../_shared/twilio.ts";

const KNOWN_STATUSES = new Set(["queued", "sent", "delivered", "failed", "undelivered", "received"]);

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
    return new Response(null, { status: 500 });
  }

  const params = await parseTwilioForm(req);
  const signatureValid = await validateTwilioSignature(req, params, config.authToken, config, {
    functionName: "twilio-sms-status"
  });
  if (!signatureValid) {
    return new Response(null, { status: 403 });
  }

  const messageSid = params.MessageSid?.trim() ?? params.SmsSid?.trim() ?? "";
  const messageStatus = params.MessageStatus?.trim().toLowerCase() ?? params.SmsStatus?.trim().toLowerCase() ?? "";

  if (!messageSid || !messageStatus || !KNOWN_STATUSES.has(messageStatus)) {
    return new Response(null, { status: 204 });
  }

  const { error } = await serviceSupabase
    .from("crm_activities")
    .update({ sms_status: messageStatus })
    .eq("twilio_message_sid", messageSid);

  if (error) {
    console.error("twilio-sms-status update failed:", error.message);
  }

  return new Response(null, { status: 204 });
});
