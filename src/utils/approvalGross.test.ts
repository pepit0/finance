import { describe, expect, it } from "vitest";
import { computeApprovalGross } from "./approvalGross";

describe("computeApprovalGross", () => {
  it("computes front gross from sell minus total cost and cap flag", () => {
    const r = computeApprovalGross({
      maxVehiclePrice: 30_000,
      sellPrice: 32_000,
      baseCost: 22_000
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.totalCost).toBe(22_000);
      expect(r.tradeNetCad).toBe(0);
      expect(r.frontGross).toBe(10_000);
      expect(r.sellOverApprovalCap).toBe(true);
      expect(r.includesBack).toBe(false);
      expect(r.totalGross).toBe(10_000);
    }
  });

  it("does not flag cap when sell is at or below max", () => {
    const r = computeApprovalGross({
      maxVehiclePrice: 35_000,
      sellPrice: 30_000,
      baseCost: 24_000
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.sellOverApprovalCap).toBe(false);
      expect(r.totalCost).toBe(24_000);
      expect(r.frontGross).toBe(6000);
    }
  });

  it("includes optional back gross in total", () => {
    const r = computeApprovalGross({
      maxVehiclePrice: 40_000,
      sellPrice: 28_000,
      baseCost: 20_000,
      backGross: 1500
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.frontGross).toBe(8000);
      expect(r.includesBack).toBe(true);
      expect(r.totalGross).toBe(9500);
    }
  });

  it("adds shop bill to base cost for total cost and front gross", () => {
    const r = computeApprovalGross({
      maxVehiclePrice: 40_000,
      sellPrice: 32_000,
      baseCost: 22_000,
      shopBill: 800
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.totalCost).toBe(22_800);
      expect(r.frontGross).toBe(9200);
    }
  });

  it("treats omitted shop same as zero shop bill", () => {
    const a = computeApprovalGross({
      maxVehiclePrice: 40_000,
      sellPrice: 30_000,
      baseCost: 20_000
    });
    const b = computeApprovalGross({
      maxVehiclePrice: 40_000,
      sellPrice: 30_000,
      baseCost: 20_000,
      shopBill: 0
    });
    expect(a.ok).toBe(true);
    expect(b.ok).toBe(true);
    if (a.ok && b.ok) {
      expect(a.totalCost).toBe(20_000);
      expect(b.totalCost).toBe(20_000);
      expect(a.frontGross).toBe(b.frontGross);
      expect(a.frontGross).toBe(10_000);
    }
  });

  it("rejects invalid numbers", () => {
    const r = computeApprovalGross({
      maxVehiclePrice: NaN,
      sellPrice: 1,
      baseCost: 1
    });
    expect(r.ok).toBe(false);
  });

  it("adds trade equity (ACV minus payoff) to front gross", () => {
    const r = computeApprovalGross({
      maxVehiclePrice: 40_000,
      sellPrice: 30_000,
      baseCost: 20_000,
      tradeInAcv: 8_000,
      tradeInOwing: 2_000
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.tradeNetCad).toBe(6_000);
      expect(r.frontGross).toBe(16_000);
      expect(r.totalGross).toBe(16_000);
    }
  });

  it("subtracts rolled negative equity when payoff exceeds ACV", () => {
    const r = computeApprovalGross({
      maxVehiclePrice: 40_000,
      sellPrice: 30_000,
      baseCost: 20_000,
      tradeInAcv: 3_000,
      tradeInOwing: 9_000
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.tradeNetCad).toBe(-6_000);
      expect(r.frontGross).toBe(4_000);
    }
  });

  it("rejects negative trade ACV or owing", () => {
    const r = computeApprovalGross({
      maxVehiclePrice: 40_000,
      sellPrice: 30_000,
      baseCost: 20_000,
      tradeInAcv: -1,
      tradeInOwing: 0
    });
    expect(r.ok).toBe(false);
  });
});
