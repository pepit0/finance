import type { CrmCallLogEntry } from "../types/crm";

export type CrmCallOutcomeDetail = {
  label: string;
  value: string;
};

export type CrmCallOutcomeInfo = {
  headline: string;
  details: CrmCallOutcomeDetail[];
};

function normalizeTwilioStatus(status: string | null | undefined): string {
  return (status ?? "").trim().toLowerCase();
}

function formatTwilioStatusLabel(status: string | null | undefined): string | null {
  const normalized = normalizeTwilioStatus(status);
  if (!normalized) {
    return null;
  }
  switch (normalized) {
    case "completed":
      return "Completed";
    case "no-answer":
      return "No answer";
    case "busy":
      return "Busy";
    case "failed":
      return "Failed";
    case "canceled":
      return "Canceled";
    case "ringing":
      return "Ringing";
    case "in-progress":
      return "In progress";
    case "initiated":
      return "Initiated";
    default:
      return status?.trim() ?? null;
  }
}

function formatTalkDuration(seconds: number | null | undefined): string | null {
  if (seconds == null || seconds <= 0) {
    return null;
  }
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins <= 0) {
    return `${secs}s`;
  }
  return `${mins}m ${secs.toString().padStart(2, "0")}s`;
}

function yesNo(value: boolean | null | undefined): string {
  if (value === true) {
    return "Yes";
  }
  if (value === false) {
    return "No";
  }
  return "Unknown";
}

function customerWasConnected(
  entry: Pick<
    CrmCallLogEntry,
    | "call_bridge_connected"
    | "call_dial_status"
    | "call_duration_seconds"
    | "call_direction"
    | "call_agent_answered"
  >
): boolean {
  if (entry.call_bridge_connected !== true) {
    return false;
  }
  const dial = normalizeTwilioStatus(entry.call_dial_status);
  if (entry.call_direction === "outbound" && entry.call_agent_answered === true && dial !== "completed") {
    return false;
  }
  if (dial && dial !== "completed") {
    return false;
  }
  return (entry.call_duration_seconds ?? 0) > 0;
}

function hasOutcomeMetadata(
  entry: Pick<
    CrmCallLogEntry,
    | "call_session_status"
    | "call_parent_status"
    | "call_dial_status"
    | "call_agent_answered"
    | "call_bridge_connected"
    | "call_failure_reason"
    | "call_parent_duration_seconds"
  >
): boolean {
  return (
    entry.call_session_status != null ||
    entry.call_parent_status != null ||
    entry.call_dial_status != null ||
    entry.call_agent_answered != null ||
    entry.call_bridge_connected != null ||
    entry.call_failure_reason != null ||
    entry.call_parent_duration_seconds != null
  );
}

function timeOnAgentPhone(
  entry: Pick<
    CrmCallLogEntry,
    | "call_parent_duration_seconds"
    | "call_duration_seconds"
    | "call_agent_answered"
    | "call_bridge_connected"
    | "call_dial_status"
    | "call_direction"
  >
): number | null {
  if (entry.call_parent_duration_seconds != null && entry.call_parent_duration_seconds > 0) {
    return entry.call_parent_duration_seconds;
  }
  if (
    entry.call_direction === "outbound" &&
    entry.call_agent_answered === true &&
    !customerWasConnected(entry) &&
    entry.call_duration_seconds != null &&
    entry.call_duration_seconds > 0
  ) {
    return entry.call_duration_seconds;
  }
  return null;
}

function describeAgentHangupBeforeCustomer(
  entry: Pick<
    CrmCallLogEntry,
    | "call_parent_duration_seconds"
    | "call_dial_status"
    | "call_duration_seconds"
    | "call_agent_answered"
    | "call_bridge_connected"
    | "call_direction"
  >
): string {
  const onPhone = formatTalkDuration(timeOnAgentPhone(entry));
  const dial = normalizeTwilioStatus(entry.call_dial_status);

  if (dial === "canceled") {
    return onPhone
      ? `You hung up while ringing the customer (on the line for ${onPhone})`
      : "You hung up while ringing the customer";
  }

  return onPhone
    ? `You hung up before the customer connected (on the line for ${onPhone})`
    : "You hung up before the customer connected";
}

function inferCallEndReason(
  entry: Pick<
    CrmCallLogEntry,
    | "call_direction"
    | "call_duration_seconds"
    | "call_parent_status"
    | "call_dial_status"
    | "call_agent_answered"
    | "call_bridge_connected"
    | "call_parent_duration_seconds"
    | "call_session_status"
  >
): string | null {
  const isOutbound = entry.call_direction === "outbound";
  const dial = normalizeTwilioStatus(entry.call_dial_status);
  const parent = normalizeTwilioStatus(entry.call_parent_status);
  const sessionStatus = normalizeTwilioStatus(entry.call_session_status);

  if (customerWasConnected(entry)) {
    const talkTime = formatTalkDuration(entry.call_duration_seconds);
    if (isOutbound) {
      return talkTime
        ? `You and the customer were connected for ${talkTime}`
        : "You and the customer were connected";
    }
    return talkTime
      ? `Caller and agent were connected for ${talkTime}`
      : "Caller and agent were connected";
  }

  if (isOutbound) {
    if (entry.call_agent_answered !== true) {
      if (parent === "no-answer") {
        return "Your phone rang but you did not answer";
      }
      if (parent === "canceled") {
        return "Your phone leg ended before you answered (likely hung up or declined)";
      }
      if (parent === "busy") {
        return "Your phone line was busy";
      }
      if (parent === "failed") {
        return "Twilio could not reach your phone";
      }
      return "Call ended before you answered";
    }

    if (dial === "no-answer") {
      const onPhone = formatTalkDuration(timeOnAgentPhone(entry));
      return onPhone
        ? `Customer did not answer (you were on the line for ${onPhone})`
        : "Customer did not answer";
    }
    if (dial === "canceled" || sessionStatus === "canceled" || parent === "completed" || parent === "canceled") {
      return describeAgentHangupBeforeCustomer(entry);
    }
    if (dial === "busy") {
      return "Customer line was busy";
    }
    if (dial === "failed") {
      return "Twilio could not connect to the customer";
    }
    return describeAgentHangupBeforeCustomer(entry);
  }

  if (dial === "no-answer") {
    return "Agent did not answer";
  }
  if (dial === "canceled") {
    return "Caller hung up before the agent answered";
  }
  if (dial === "busy") {
    return "Agent line was busy";
  }
  if (dial === "failed") {
    return "Twilio could not reach the agent";
  }
  if (parent === "canceled") {
    return "Caller hung up before the call could be routed";
  }
  return "Agent did not answer";
}

function buildHeadline(
  entry: Pick<
    CrmCallLogEntry,
    | "call_direction"
    | "call_duration_seconds"
    | "call_parent_status"
    | "call_dial_status"
    | "call_agent_answered"
    | "call_bridge_connected"
    | "call_session_status"
    | "call_parent_duration_seconds"
  >
): string {
  const endReason = inferCallEndReason(entry);
  if (endReason) {
    return endReason;
  }

  const statusLabel = formatTwilioStatusLabel(entry.call_session_status);
  if (statusLabel) {
    return statusLabel;
  }

  return "Call ended";
}

export function describeCallOutcome(
  entry: Pick<
    CrmCallLogEntry,
    | "call_direction"
    | "call_duration_seconds"
    | "call_session_status"
    | "call_parent_status"
    | "call_dial_status"
    | "call_agent_answered"
    | "call_bridge_connected"
    | "call_failure_reason"
    | "call_parent_duration_seconds"
  >
): CrmCallOutcomeInfo | null {
  if (!hasOutcomeMetadata(entry)) {
    if (customerWasConnected(entry) && entry.call_duration_seconds != null && entry.call_duration_seconds > 0) {
      const talkTime = formatTalkDuration(entry.call_duration_seconds);
      return {
        headline:
          entry.call_direction === "outbound"
            ? "You and the customer were connected"
            : "Caller and agent were connected",
        details: talkTime ? [{ label: "Talk time with customer", value: talkTime }] : []
      };
    }
    return null;
  }

  const isOutbound = entry.call_direction === "outbound";
  const dial = normalizeTwilioStatus(entry.call_dial_status);
  const details: CrmCallOutcomeDetail[] = [];

  if (customerWasConnected(entry)) {
    details.push({
      label: isOutbound ? "Customer connected" : "Agent connected",
      value: "Yes"
    });
  } else if (entry.call_agent_answered === true && isOutbound) {
    if (dial === "no-answer") {
      details.push({ label: "Customer answered", value: "No — rang out" });
    } else if (dial === "canceled") {
      details.push({ label: "Customer answered", value: "No — you hung up while ringing" });
    } else if (dial === "busy") {
      details.push({ label: "Customer answered", value: "No — line busy" });
    } else {
      details.push({ label: "Customer connected", value: "No — you hung up first" });
    }
  } else if (!isOutbound && !customerWasConnected(entry) && dial) {
    if (dial === "no-answer") {
      details.push({ label: "Agent answered", value: "No — rang out" });
    } else if (dial === "canceled") {
      details.push({ label: "Agent answered", value: "No — caller hung up while ringing" });
    }
  }

  const finalStatus = formatTwilioStatusLabel(entry.call_session_status);
  if (finalStatus) {
    details.push({ label: "Final status", value: finalStatus });
  }

  if (isOutbound) {
    details.push({ label: "You answered", value: yesNo(entry.call_agent_answered) });
  } else {
    details.push({ label: "Agent answered", value: yesNo(entry.call_agent_answered ?? entry.call_bridge_connected) });
  }

  const parentStatus = formatTwilioStatusLabel(entry.call_parent_status);
  if (parentStatus) {
    details.push({
      label: isOutbound ? "Your phone leg" : "Caller leg",
      value: parentStatus
    });
  }

  const dialStatus = formatTwilioStatusLabel(entry.call_dial_status);
  if (dialStatus) {
    details.push({
      label: isOutbound ? "Customer leg" : "Agent leg",
      value: dialStatus
    });
  }

  const onYourPhone = formatTalkDuration(timeOnAgentPhone(entry));
  if (onYourPhone && isOutbound && entry.call_agent_answered === true && !customerWasConnected(entry)) {
    details.push({ label: "Time on your phone", value: onYourPhone });
  }

  const talkTime = formatTalkDuration(entry.call_duration_seconds);
  if (talkTime && customerWasConnected(entry)) {
    details.push({ label: "Talk time with customer", value: talkTime });
  }

  if (entry.call_failure_reason?.trim()) {
    details.push({ label: "Failure reason", value: entry.call_failure_reason.trim() });
  }

  return {
    headline: buildHeadline(entry),
    details
  };
}
