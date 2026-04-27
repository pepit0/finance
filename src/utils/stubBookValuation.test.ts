import { describe, expect, it } from "vitest";
import { getStubBookValues, hashStringToUint32 } from "./stubBookValuation";

describe("hashStringToUint32", () => {
  it("is deterministic", () => {
    expect(hashStringToUint32("abc")).toBe(hashStringToUint32("abc"));
  });

  it("differs for different inputs", () => {
    expect(hashStringToUint32("abc")).not.toBe(hashStringToUint32("abd"));
  });
});

describe("getStubBookValues", () => {
  it("returns all conditions and regions", () => {
    const g = getStubBookValues({ vin: "1HGBH41JXMN109186", trimKey: "EX-L", mileageKm: 80_000 });
    expect(g["Very rough"].Canada).toBeGreaterThan(0);
    expect(g.Rough.Canada).toBeGreaterThan(0);
    expect(g["Very clean"].Alberta).toBeGreaterThan(0);
    expect(g["Very rough"].Ontario).toBeLessThan(g.Rough.Ontario);
    expect(g.Clean.Ontario).toBeGreaterThanOrEqual(g.Rough.Ontario);
  });

  it("is deterministic for same input", () => {
    const a = getStubBookValues({ vin: "VIN123", trimKey: "t", mileageKm: 10 });
    const b = getStubBookValues({ vin: "VIN123", trimKey: "t", mileageKm: 10 });
    expect(a).toEqual(b);
  });

  it("changes when VIN or trim changes", () => {
    const a = getStubBookValues({ vin: "AAAAAAAAA", trimKey: "x", mileageKm: 0 });
    const b = getStubBookValues({ vin: "BBBBBBBBB", trimKey: "x", mileageKm: 0 });
    expect(a.Average.Canada).not.toBe(b.Average.Canada);
  });
});
