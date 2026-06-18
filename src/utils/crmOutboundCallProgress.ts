import type { CrmPhoneCallSession } from "../types/crm";

export type CrmOutboundCallStepState = "pending" | "active" | "done" | "failed";

export type CrmOutboundCallProgressStep = {
  id: "start" | "your_phone" | "customer" | "complete";
  label: string;
  state: CrmOutboundCallStepState;
};

export type CrmOutboundCallProgressView = {
  headline: string;
  detail: string | null;
  steps: CrmOutboundCallProgressStep[];
  isTerminal: boolean;
  isSuccess: boolean;
};

const TERMINAL_STATUSES = new Set(["completed", "failed", "no-answer", "busy", "canceled"]);

function normalizeStatus(status: string | null | undefined): string {
  return (status ?? "").trim().toLowerCase();
}

export function isTerminalCallSessionStatus(status: string | null | undefined): boolean {
  return TERMINAL_STATUSES.has(normalizeStatus(status));
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
  const parent = normalizeStatus(session.parent_call_status);
  const status = normalizeStatus(session.status);

  if (session.bridge_connected) {
    const talk = formatDuration(session.call_duration_seconds);
    return {
      headline: talk ? `Call ended · ${talk} with customer` : "Call ended",
      detail: null,
      isSuccess: true
    };
  }

  if (!session.agent_answered) {
    if (status === "no-answer" || parent === "no-answer") {
      return { headline: "Your phone rang but was not answered", detail: null, isSuccess: false };
    }
    if (status === "busy" || parent === "busy") {
      return { headline: "Your phone line was busy", detail: null, isSuccess: false };
    }
    if (status === "failed" || parent === "failed") {
      return { headline: "Could not reach your phone", detail: session.failure_reason, isSuccess: false };
    }
    return { headline: "Call ended before you answered", detail: null, isSuccess: false };
  }

  if (dial === "no-answer") {
    return { headline: `${customerName} did not answer`, detail: null, isSuccess: false };
  }
  if (dial === "busy") {
    return { headline: `${customerName}'s line was busy`, detail: null, isSuccess: false };
  }
  if (dial === "canceled" || status === "canceled") {
    return {
      headline: "Call ended before customer connected",
      detail: "You likely hung up while the customer was ringing.",
      isSuccess: false
    };
  }
  if (status === "failed" || dial === "failed") {
    return {
      headline: "Could not connect to customer",
      detail: session.failure_reason,
      isSuccess: false
    };
  }

  return { headline: "Call ended", detail: null, isSuccess: false };
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
  const customerLabel = customerName.trim() || "Customer";

  let yourPhone: CrmOutboundCallStepState = "pending";
  if (terminal && !agentAnswered) {
    yourPhone = "failed";
  } else if (agentAnswered || onCall || session.bridge_connected) {
    yourPhone = "done";
  } else if (status === "ringing" || status === "initiated") {
    yourPhone = "active";
  }

  let customer: CrmOutboundCallStepState = "pending";
  if (terminal && agentAnswered && !session.bridge_connected) {
    customer = "failed";
  } else if (session.bridge_connected || onCall) {
    customer = "done";
  } else if (agentAnswered && !terminal) {
    customer = "active";
  }

  let complete: CrmOutboundCallStepState = "pending";
  if (terminal) {
    complete = isSuccess ? "done" : "failed";
  }

  return [
    { id: "start", label: "Call started", state: "done" },
    { id: "your_phone", label: "Your phone", state: yourPhone },
    { id: "customer", label: customerLabel, state: customer },
    { id: "complete", label: "Complete", state: complete }
  ];
}

export function describeOutboundCallProgress(
  session: CrmPhoneCallSession,
  customerName: string
): CrmOutboundCallProgressView {
  const terminal = isTerminalCallSessionStatus(session.status);
  const agentAnswered = session.agent_answered;
  const onCall = isOnCall(session);
  const status = normalizeStatus(session.status);

  if (terminal) {
    const ended = describeTerminalHeadline(session, customerName);
    return {
      headline: ended.headline,
      detail: ended.detail,
      steps: buildSteps(session, customerName, true, ended.isSuccess),
      isTerminal: true,
      isSuccess: ended.isSuccess
    };
  }

  if (onCall) {
    return {
      headline: `On call with ${customerName}`,
      detail: "Hang up your phone when you're finished.",
      steps: buildSteps(session, customerName, false, false),
      isTerminal: false,
      isSuccess: false
    };
  }

  if (agentAnswered) {
    return {
      headline: "You answered · calling customer…",
      detail: `Connecting you to ${customerName}.`,
      steps: buildSteps(session, customerName, false, false),
      isTerminal: false,
      isSuccess: false
    };
  }

  if (status === "ringing" || status === "initiated") {
    return {
      headline: "Calling your phone…",
      detail: "Answer to connect to the customer.",
      steps: buildSteps(session, customerName, false, false),
      isTerminal: false,
      isSuccess: false
    };
  }

  return {
    headline: "Starting call…",
    detail: null,
    steps: buildSteps(session, customerName, false, false),
    isTerminal: false,
    isSuccess: false
  };
}
