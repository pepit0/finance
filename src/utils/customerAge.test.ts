import { describe, expect, it, vi } from "vitest";
import { getAgeFromIsoDate, isYoungBuyerAge } from "./customerAge";

describe("getAgeFromIsoDate", () => {
  it("returns null for empty or non-ISO input", () => {
    const ref = new Date(2026, 5, 15);
    expect(getAgeFromIsoDate("", ref)).toBeNull();
    expect(getAgeFromIsoDate("not-a-date", ref)).toBeNull();
  });

  it("computes whole years on the reference date (local)", () => {
    const ref = new Date(2026, 5, 15);
    expect(getAgeFromIsoDate("2003-06-14", ref)).toBe(23);
    expect(getAgeFromIsoDate("2002-06-15", ref)).toBe(24);
    expect(getAgeFromIsoDate("2002-06-16", ref)).toBe(23);
  });
});

describe("isYoungBuyerAge", () => {
  it("is true only when age is under 24", () => {
    expect(isYoungBuyerAge(null)).toBe(false);
    expect(isYoungBuyerAge(23)).toBe(true);
    expect(isYoungBuyerAge(24)).toBe(false);
  });

  it("respects fake timers when used with getAgeFromIsoDate", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 15, 12, 0, 0));
    expect(isYoungBuyerAge(getAgeFromIsoDate("2003-01-01"))).toBe(true);
    vi.useRealTimers();
  });
});
