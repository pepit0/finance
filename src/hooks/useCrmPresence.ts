import { useEffect, useRef, useState } from "react";
import {
  computeTabPresenceStatus,
  CRM_PRESENCE_CHANNEL,
  parsePresenceState,
  type CrmPresenceStatus,
  type CrmPresenceTrackPayload
} from "../lib/crmPresence";
import { supabase } from "../lib/supabase";

const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"] as const;
const HEARTBEAT_MS = 30_000;

function newTabId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Tracks this user's CRM tab on the shared presence channel and returns live status for all team members.
 */
export function useCrmPresence(userId: string | null | undefined): Map<string, CrmPresenceStatus> {
  const [presenceByUser, setPresenceByUser] = useState<Map<string, CrmPresenceStatus>>(() => new Map());
  const lastActivityRef = useRef(Date.now());
  const lastStatusRef = useRef<"online" | "away">("online");
  const tabIdRef = useRef(newTabId());

  useEffect(() => {
    if (!userId) {
      setPresenceByUser(new Map());
      return;
    }

    const bumpActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        bumpActivity();
      }
    };

    for (const eventName of ACTIVITY_EVENTS) {
      window.addEventListener(eventName, bumpActivity, { passive: true });
    }
    document.addEventListener("visibilitychange", onVisibility);

    const channel = supabase.channel(CRM_PRESENCE_CHANNEL, {
      config: { presence: { key: tabIdRef.current } }
    });

    const sync = () => {
      const state = channel.presenceState() as Record<string, CrmPresenceTrackPayload[]>;
      setPresenceByUser(parsePresenceState(state));
    };

    const pushPresence = async () => {
      const status = computeTabPresenceStatus(lastActivityRef.current);
      lastStatusRef.current = status;
      const payload: CrmPresenceTrackPayload = {
        user_id: userId,
        status,
        last_activity: lastActivityRef.current
      };
      await channel.track(payload);
    };

    channel
      .on("presence", { event: "sync" }, sync)
      .on("presence", { event: "join" }, sync)
      .on("presence", { event: "leave" }, sync)
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          void pushPresence();
        }
      });

    const interval = window.setInterval(() => {
      void pushPresence();
    }, HEARTBEAT_MS);

    return () => {
      window.clearInterval(interval);
      for (const eventName of ACTIVITY_EVENTS) {
        window.removeEventListener(eventName, bumpActivity);
      }
      document.removeEventListener("visibilitychange", onVisibility);
      void channel.untrack();
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  return presenceByUser;
}
