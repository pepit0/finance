import { describe, expect, it } from "vitest";
import {
  aggregatePresenceForUser,
  computeTabPresenceStatus,
  CRM_PRESENCE_AWAY_MS,
  parsePresenceState
} from "../lib/crmPresence";

describe("computeTabPresenceStatus", () => {
  it("returns online when activity is recent", () => {
    const now = 1_000_000;
    expect(computeTabPresenceStatus(now - 60_000, now)).toBe("online");
  });

  it("returns away after 5 minutes without activity", () => {
    const now = 1_000_000;
    expect(computeTabPresenceStatus(now - CRM_PRESENCE_AWAY_MS, now)).toBe("away");
  });
});

describe("aggregatePresenceForUser", () => {
  it("prefers online when any tab is active", () => {
    expect(
      aggregatePresenceForUser([
        { user_id: "u1", status: "away", last_activity: 0 },
        { user_id: "u1", status: "online", last_activity: 0 }
      ])
    ).toBe("online");
  });

  it("returns away when all open tabs are idle", () => {
    expect(aggregatePresenceForUser([{ user_id: "u1", status: "away", last_activity: 0 }])).toBe("away");
  });

  it("returns offline when no tabs are open", () => {
    expect(aggregatePresenceForUser([])).toBe("offline");
  });
});

describe("parsePresenceState", () => {
  it("groups multiple tab entries by user_id", () => {
    const map = parsePresenceState({
      tab1: [{ user_id: "u1", status: "away", last_activity: 0 }],
      tab2: [{ user_id: "u1", status: "online", last_activity: 1 }],
      tab3: [{ user_id: "u2", status: "away", last_activity: 2 }]
    });
    expect(map.get("u1")).toBe("online");
    expect(map.get("u2")).toBe("away");
  });
});
