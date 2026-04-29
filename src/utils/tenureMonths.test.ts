import { describe, expect, it } from "vitest";
import { customerTenureTotalMonths } from "./tenureMonths";

describe("customerTenureTotalMonths", () => {
  it("returns null when both parts are null", () => {
    expect(customerTenureTotalMonths(null, null)).toBeNull();
  });

  it("uses only months when years are null", () => {
    expect(customerTenureTotalMonths(null, 6)).toBe(6);
  });

  it("uses only years when months are null", () => {
    expect(customerTenureTotalMonths(2, null)).toBe(24);
  });

  it("combines years and months", () => {
    expect(customerTenureTotalMonths(1, 3)).toBe(15);
  });

  it("treats missing parts as zero when the other is set", () => {
    expect(customerTenureTotalMonths(0, 11)).toBe(11);
    expect(customerTenureTotalMonths(3, 0)).toBe(36);
  });
});
