import {
  corsHeaders,
  getServiceSupabase,
  getUserSupabase,
  jsonResponse,
  userHasPermission
} from "../_shared/twilio.ts";

type RecordingUrlBody = {
  activity_id?: string;
};

const SIGNED_URL_TTL_SECONDS = 300;

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

  const canListen = await userHasPermission(userSupabase, "calls.listen");
  if (!canListen) {
    return jsonResponse({ ok: false, error: "You do not have permission to play recordings." }, 403);
  }

  let body: RecordingUrlBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ ok: false, error: "Invalid JSON body." }, 400);
  }

  const activityId = body.activity_id?.trim();
  if (!activityId) {
    return jsonResponse({ ok: false, error: "activity_id is required." }, 400);
  }

  const { data: activity, error: activityError } = await userSupabase
    .from("crm_activities")
    .select("id, recording_storage_path, customer_id")
    .eq("id", activityId)
    .maybeSingle();

  if (activityError) {
    return jsonResponse({ ok: false, error: activityError.message }, 422);
  }
  if (!activity?.recording_storage_path) {
    return jsonResponse({ ok: false, error: "Recording not available yet." }, 404);
  }

  const serviceSupabase = getServiceSupabase();
  if (!serviceSupabase) {
    return jsonResponse({ ok: false, error: "Server misconfigured." }, 500);
  }

  const { data: signed, error: signError } = await serviceSupabase.storage
    .from("crm-call-recordings")
    .createSignedUrl(String(activity.recording_storage_path), SIGNED_URL_TTL_SECONDS);

  if (signError || !signed?.signedUrl) {
    return jsonResponse({ ok: false, error: signError?.message ?? "Could not sign URL." }, 422);
  }

  return jsonResponse({ ok: true, url: signed.signedUrl });
});
