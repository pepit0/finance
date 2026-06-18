import { useEffect, useRef, useState } from "react";

import { useOutboundCallSession } from "../../hooks/useOutboundCallSession";
import type { CrmCallDirection } from "../../types/crm";
import { describeInboundCallProgress } from "../../utils/crmInboundCallProgress";
import { describeOutboundCallProgress } from "../../utils/crmOutboundCallProgress";

type CrmOutboundCallProgressProps = {
  sessionId: string;
  customerName: string;
  direction?: CrmCallDirection;
  onComplete?: () => void;
};

function stepIcon(state: "pending" | "active" | "done" | "failed"): string {
  switch (state) {
    case "done":
      return "✓";
    case "active":
      return "●";
    case "failed":
      return "✕";
    default:
      return "○";
  }
}

export function CrmOutboundCallProgress({
  sessionId,
  customerName,
  direction = "outbound",
  onComplete
}: CrmOutboundCallProgressProps) {
  const { session, error, isPolling } = useOutboundCallSession(sessionId);
  const completedRef = useRef(false);

  useEffect(() => {
    completedRef.current = false;
  }, [sessionId]);

  useEffect(() => {
    if (!session || isPolling || completedRef.current) {
      return;
    }
    completedRef.current = true;
    onComplete?.();
  }, [session, isPolling, onComplete]);

  if (error) {
    return (
      <div className="crmOutboundCallProgress crmOutboundCallProgressFailed" role="status">
        <p className="crmOutboundCallProgressHeadline">{error}</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="crmOutboundCallProgress" role="status" aria-live="polite">
        <p className="crmOutboundCallProgressHeadline">Starting call…</p>
      </div>
    );
  }

  const progress =
    direction === "inbound"
      ? describeInboundCallProgress(session, customerName)
      : describeOutboundCallProgress(session, customerName);

  return (
    <div
      className={`crmOutboundCallProgress${progress.isTerminal ? (progress.isSuccess ? " crmOutboundCallProgressSuccess" : " crmOutboundCallProgressFailed") : " crmOutboundCallProgressLive"}`}
      role="status"
      aria-live="polite"
    >
      <div className="crmOutboundCallProgressLead">
        <p className="crmOutboundCallProgressHeadline">{progress.headline}</p>
        {progress.detail ? <p className="crmOutboundCallProgressDetail">{progress.detail}</p> : null}
      </div>
      <ol className="crmOutboundCallProgressSteps">
        {progress.steps.map((step) => (
          <li
            key={step.id}
            className={`crmOutboundCallProgressStep crmOutboundCallProgressStep--${step.state}`}
          >
            <span className="crmOutboundCallProgressStepIcon" aria-hidden="true">
              {stepIcon(step.state)}
            </span>
            <span className="crmOutboundCallProgressStepLabel">{step.label}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
