import { useEffect, useRef, useState } from "react";

import { fetchLatestInboundCallSessionForAgent } from "../lib/crmApi";
import type { CrmPhoneCallSession } from "../types/crm";
import { isTerminalCallSessionStatus } from "../utils/crmOutboundCallProgress";

const POLL_MS = 1_500;
const TERMINAL_DISMISS_MS = 12_000;

export function useActiveInboundCallSession(userId: string | null): {
  session: CrmPhoneCallSession | null;
  customerId: string | null;
  customerName: string | null;
  error: string | null;
  visible: boolean;
} {
  const [session, setSession] = useState<CrmPhoneCallSession | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const terminalSinceRef = useRef<number | null>(null);
  const lastSessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setSession(null);
      setCustomerId(null);
      setCustomerName(null);
      setError(null);
      setVisible(false);
      terminalSinceRef.current = null;
      return;
    }

    let cancelled = false;
    let timer: number | null = null;

    const poll = async () => {
      const result = await fetchLatestInboundCallSessionForAgent();
      if (cancelled) {
        return;
      }

      if (result.error) {
        setError(result.error);
        setVisible(false);
        return;
      }

      setError(null);

      if (!result.data) {
        setSession(null);
        setCustomerId(null);
        setCustomerName(null);
        setVisible(false);
        terminalSinceRef.current = null;
        timer = window.setTimeout(() => {
          void poll();
        }, POLL_MS);
        return;
      }

      const nextSession = result.data.session;
      const terminal = isTerminalCallSessionStatus(nextSession.status);

      setSession(nextSession);
      setCustomerId(result.data.customerId);
      setCustomerName(result.data.customerName);

      if (!terminal) {
        terminalSinceRef.current = null;
        setVisible(true);
      } else {
        if (terminalSinceRef.current == null || lastSessionIdRef.current !== nextSession.id) {
          terminalSinceRef.current = Date.now();
        }
        const elapsed = Date.now() - terminalSinceRef.current;
        setVisible(elapsed < TERMINAL_DISMISS_MS);
      }

      lastSessionIdRef.current = nextSession.id;

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
  }, [userId]);

  return { session, customerId, customerName, error, visible };
}
