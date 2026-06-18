import type { CrmActivity } from "../types/crm";

/** Matches the last activity poll delay after placing a call (CrmCustomersTab). */
export const TWILIO_RECORDING_WAIT_MS = 240_000;

export type TwilioRecordingBadgeState = "recorded" | "processing" | "failed";

const FAILED_SESSION_STATUSES = new Set(["failed", "canceled", "no-answer", "busy"]);

function customerWasConnected(activity: Pick<CrmActivity, "call_bridge_connected" | "call_dial_status">): boolean {
  if (activity.call_bridge_connected === true) {
    const dial = (activity.call_dial_status ?? "").trim().toLowerCase();
    if (dial && dial !== "completed") {
      return false;
    }
    return true;
  }
  return false;
}

export function twilioRecordingBadgeState(
  activity: Pick<
    CrmActivity,
    | "source"
    | "kind"
    | "recording_storage_path"
    | "created_at"
    | "call_bridge_connected"
    | "call_session_status"
    | "call_dial_status"
  >,
  nowMs = Date.now()
): TwilioRecordingBadgeState | null {
  if (activity.source !== "twilio" || activity.kind !== "call") {
    return null;
  }

  if (activity.recording_storage_path) {
    return "recorded";
  }

  if (activity.call_bridge_connected === false) {
    return "failed";
  }

  const sessionStatus = (activity.call_session_status ?? "").trim().toLowerCase();
  if (sessionStatus && FAILED_SESSION_STATUSES.has(sessionStatus) && !customerWasConnected(activity)) {
    return "failed";
  }

  const ageMs = nowMs - new Date(activity.created_at).getTime();
  if (ageMs >= TWILIO_RECORDING_WAIT_MS) {
    return "failed";
  }

  return "processing";
}
