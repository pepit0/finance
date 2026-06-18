import {
  RECORDINGS_BUCKET,
  attachRecordingToSessionActivity,
  authorizeKnownTwilioRecording,
  buildRecordingWebhookUrl,
  corsHeaders,
  functionUrl,
  getServiceSupabase,
  getTwilioConfig,
  parseTwilioForm,
  resolveRecordingSession,
  validateTwilioSignature
} from "../_shared/twilio.ts";

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

  try {
    const params = await parseTwilioForm(req);
    const incoming = new URL(req.url);
    let sessionId = incoming.searchParams.get("sessionId")?.trim() ?? "";

    if (!sessionId && params.CallSid) {
      const resolved = await resolveRecordingSession(serviceSupabase, "", params);
      if (resolved) {
        sessionId = resolved.id;
      }
    }

    const knownWebhookUrl = sessionId ? buildRecordingWebhookUrl(config, sessionId) : null;
    const signatureValid = await validateTwilioSignature(req, params, config.authToken, config, {
      functionName: "twilio-recording",
      sessionId,
      knownWebhookUrl
    });
    const knownRecording =
      signatureValid || (await authorizeKnownTwilioRecording(serviceSupabase, params, sessionId));

    if (!knownRecording) {
      console.error("twilio-recording rejected", {
        sessionId: sessionId || null,
        callSid: params.CallSid ?? null,
        recordingSid: params.RecordingSid ?? null
      });
      return new Response("Invalid Twilio signature", { status: 403, headers: corsHeaders });
    }

    const recordingStatus = (params.RecordingStatus ?? "").toLowerCase();
    if (recordingStatus && recordingStatus !== "completed") {
      return new Response("ok", { status: 200, headers: corsHeaders });
    }

    const recordingUrl = params.RecordingUrl?.trim();
    const recordingSid = params.RecordingSid?.trim();
    if (!recordingUrl || !recordingSid) {
      return new Response("Missing recording", { status: 400, headers: corsHeaders });
    }

    const session = await resolveRecordingSession(serviceSupabase, sessionId, params);
    if (!session?.customer_id) {
      console.error("twilio-recording: session not found", { sessionId, callSid: params.CallSid ?? null });
      return new Response("Session not found", { status: 404, headers: corsHeaders });
    }

    const auth = btoa(`${config.accountSid}:${config.authToken}`);
    const downloadUrl = recordingUrl.endsWith(".mp3") ? recordingUrl : `${recordingUrl}.mp3`;
    const recordingResponse = await fetch(downloadUrl, {
      headers: { Authorization: `Basic ${auth}` }
    });

    if (!recordingResponse.ok) {
      console.error("recording download failed:", recordingResponse.status);
      return new Response("Download failed", { status: 422, headers: corsHeaders });
    }

    const bytes = new Uint8Array(await recordingResponse.arrayBuffer());
    const customerId = String(session.customer_id);
    const storagePath = `${customerId}/${session.id}/${recordingSid}.mp3`;

    const { error: uploadError } = await serviceSupabase.storage
      .from(RECORDINGS_BUCKET)
      .upload(storagePath, bytes, {
        contentType: "audio/mpeg",
        upsert: true
      });

    if (uploadError) {
      console.error("recording upload failed:", uploadError.message);
      return new Response("Upload failed", { status: 422, headers: corsHeaders });
    }

    await attachRecordingToSessionActivity(serviceSupabase, session, storagePath);
    console.log("twilio-recording stored", { sessionId: session.id, storagePath });

    return new Response("ok", { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("twilio-recording failed:", error);
    return new Response("Server error", { status: 500, headers: corsHeaders });
  }
});
