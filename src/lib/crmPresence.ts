export type CrmPresenceStatus = "online" | "away" | "offline";

export type CrmPresenceTrackPayload = {
  user_id: string;
  status: "online" | "away";
  last_activity: number;
};

export const CRM_PRESENCE_CHANNEL = "crm-team-presence";

/** No tab activity for this long → away (tab still open). */
export const CRM_PRESENCE_AWAY_MS = 5 * 60 * 1000;

export function computeTabPresenceStatus(lastActivityMs: number, nowMs = Date.now()): "online" | "away" {
  return nowMs - lastActivityMs < CRM_PRESENCE_AWAY_MS ? "online" : "away";
}

export function aggregatePresenceForUser(states: CrmPresenceTrackPayload[]): CrmPresenceStatus {
  if (states.length === 0) {
    return "offline";
  }
  if (states.some((s) => s.status === "online")) {
    return "online";
  }
  if (states.some((s) => s.status === "away")) {
    return "away";
  }
  return "offline";
}

export function parsePresenceState(
  presenceState: Record<string, CrmPresenceTrackPayload[]>
): Map<string, CrmPresenceStatus> {
  const byUser = new Map<string, CrmPresenceTrackPayload[]>();

  for (const presences of Object.values(presenceState)) {
    for (const entry of presences) {
      if (!entry?.user_id) {
        continue;
      }
      const list = byUser.get(entry.user_id) ?? [];
      list.push(entry);
      byUser.set(entry.user_id, list);
    }
  }

  const result = new Map<string, CrmPresenceStatus>();
  for (const [userId, list] of byUser) {
    result.set(userId, aggregatePresenceForUser(list));
  }
  return result;
}

export function presenceStatusLabel(status: CrmPresenceStatus): string {
  switch (status) {
    case "online":
      return "Online";
    case "away":
      return "Away";
    default:
      return "Offline";
  }
}
