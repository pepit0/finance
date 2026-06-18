import type { CrmPhoneCallSession } from "../types/crm";
import {
  isTerminalCallSessionStatus,
  type CrmOutboundCallProgressStep,
  type CrmOutboundCallProgressView,
  type CrmOutboundCallStepState
} from "./crmOutboundCallProgress";

function normalizeStatus(status: string | null | undefined): string {
  return (status ?? "").trim().toLowerCase();
}

function formatDuration(seconds: number | null | undefined): string | null {
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

function isOnCall(session: CrmPhoneCallSession): boolean {
  return (
    session.agent_answered &&
    !isTerminalCallSessionStatus(session.status) &&
    normalizeStatus(session.status) === "in-progress"
  );
}

function describeTerminalHeadline(
  session: CrmPhoneCallSession,
  customerName: string
): { headline: string; detail: string | null; isSuccess: boolean } {
  const dial = normalizeStatus(session.dial_call_status);
  const status = normalizeStatus(session.status);

  if (session.bridge_connected) {
    const talk = formatDuration(session.call_duration_seconds);
    return {
      headline: talk ? `Call ended · ${talk} with ${customerName}` : "Call ended",
      detail: null,
      isSuccess: true
    };
  }

  if (!session.agent_answered) {
    if (status === "no-answer" || dial === "no-answer") {
      return { headline: "Missed call — you didn't answer", detail: null, isSuccess: false };
    }
    if (status === "busy" || dial === "busy") {
      return { headline: "Missed call — your line was busy", detail: null, isSuccess: false };
    }
    if (status === "failed" || dial === "failed") {
      return {
        headline: "Inbound call failed",
        detail: session.failure_reason,
        isSuccess: false
      };
    }
    return { headline: "Caller hung up before you answered", detail: null, isSuccess: false };
  }

  return {
    headline: "Call ended before connecting",
    detail: session.failure_reason,
    isSuccess: false
  };
}

function buildSteps(
  session: CrmPhoneCallSession,
  customerName: string,
  terminal: boolean,
  isSuccess: boolean
): CrmOutboundCallProgressStep[] {
  const agentAnswered = session.agent_answered;
  const onCall = isOnCall(session);
  const status = normalizeStatus(session.status);
  const customerLabel = customerName.trim() || "Caller";

  let yourPhone: CrmOutboundCallStepState = "pending";
  if (terminal && !agentAnswered) {
    yourPhone = "failed";
  } else if (agentAnswered || onCall || session.bridge_connected) {
    yourPhone = "done";
  } else if (status === "ringing" || status === "initiated") {
    yourPhone = "active";
  }

  let connected: CrmOutboundCallStepState = "pending";
  if (terminal && agentAnswered && !session.bridge_connected) {
    connected = "failed";
  } else if (session.bridge_connected || onCall) {
    connected = "done";
  } else if (agentAnswered && !terminal) {
    connected = "active";
  }

  let complete: CrmOutboundCallStepState = "pending";
  if (terminal) {
    complete = isSuccess ? "done" : "failed";
  }

  return [
    { id: "start", label: "Incoming call", state: "done" },
    { id: "your_phone", label: "Your phone", state: yourPhone },
    { id: "customer", label: customerLabel, state: connected },
    { id: "complete", label: "Complete", state: complete }
  ];
}

export function describeInboundCallProgress(
  session: CrmPhoneCallSession,
  customerName: string
): CrmOutboundCallProgressView {
  const terminal = isTerminalCallSessionStatus(session.status);
  const agentAnswered = session.agent_answered;
  const onCall = isOnCall(session);
  const status = normalizeStatus(session.status);
  const name = customerName.trim() || "Caller";

  if (terminal) {
    const ended = describeTerminalHeadline(session, name);
    return {
      headline: ended.headline,
      detail: ended.detail,
      steps: buildSteps(session, customerName, true, ended.isSuccess),
      isTerminal: true,
      isSuccess: ended.isSuccess
    };
  }

  if (onCall || session.bridge_connected) {
    return {
      headline: `On call with ${name}`,
      detail: "Hang up your phone when you're finished.",
      steps: buildSteps(session, customerName, false, false),
      isTerminal: false,
      isSuccess: false
    };
  }

  if (agentAnswered) {
    return {
      headline: "You answered — connecting…",
      detail: `Linking you with ${name}.`,
      steps: buildSteps(session, customerName, false, false),
      isTerminal: false,
      isSuccess: false
    };
  }

  if (status === "ringing" || status === "initiated") {
    return {
      headline: `Incoming call from ${name}`,
      detail: "Your phone is ringing — answer to connect.",
      steps: buildSteps(session, customerName, false, false),
      isTerminal: false,
      isSuccess: false
    };
  }

  return {
    headline: "Incoming call…",
    detail: null,
    steps: buildSteps(session, customerName, false, false),
    isTerminal: false,
    isSuccess: false
  };
}
