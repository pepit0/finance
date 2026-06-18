import { useEffect, useRef, useState } from "react";

import { fetchCallSession } from "../lib/crmApi";
import type { CrmPhoneCallSession } from "../types/crm";
import { isTerminalCallSessionStatus } from "../utils/crmOutboundCallProgress";

const POLL_MS = 1_500;
const MAX_TRACK_MS = 600_000;

export function useOutboundCallSession(sessionId: string | null): {
  session: CrmPhoneCallSession | null;
  error: string | null;
  isPolling: boolean;
} {
  const [session, setSession] = useState<CrmPhoneCallSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const startedAtRef = useRef<number>(0);

  useEffect(() => {
    if (!sessionId) {
      setSession(null);
      setError(null);
      setIsPolling(false);
      return;
    }

    let cancelled = false;
    let timer: number | null = null;
    startedAtRef.current = Date.now();
    setIsPolling(true);
    setError(null);

    const poll = async () => {
      const result = await fetchCallSession(sessionId);
      if (cancelled) {
        return;
      }
      if (result.error) {
        setError(result.error);
        setIsPolling(false);
        return;
      }
      if (!result.data) {
        setError("Call session not found.");
        setIsPolling(false);
        return;
      }

      setSession(result.data);

      const timedOut = Date.now() - startedAtRef.current >= MAX_TRACK_MS;
      if (isTerminalCallSessionStatus(result.data.status) || timedOut) {
        setIsPolling(false);
        return;
      }

      timer = window.setTimeout(() => {
        void poll();
      }, POLL_MS);
    };

    void poll();

    return () => {
      cancelled = true;
      if (timer != null) {
        window.clearTimeout(timer);
      }
    };
  }, [sessionId]);

  return { session, error, isPolling };
}
