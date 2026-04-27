import { describe, expect, it } from "vitest";
import { computeApprovalVehicle, paymentFromPrincipal } from "./approvalVehicleCalculator";

describe("computeApprovalVehicle", () => {
  it("rejects invalid inputs", () => {
    const r = computeApprovalVehicle({
      monthlyPayment: -1,
      annualRatePercent: 5,
      termMonths: 60,
      ltvPercent: 120
    });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.length).toBeGreaterThan(0);
    }
  });

  it("uses PV = PMT * n when APR is zero", () => {
    const r = computeApprovalVehicle({
      monthlyPayment: 500,
      annualRatePercent: 0,
      termMonths: 12,
      ltvPercent: 100
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.principalFromPayment).toBeCloseTo(6000, 6);
      expect(r.principalUsed).toBeCloseTo(6000, 6);
      expect(r.maxVehiclePrice).toBeCloseTo(6000, 6);
      expect(r.cappedByMax).toBe(false);
    }
  });

  it("caps principal when max amount financed is lower than PV", () => {
    const r = computeApprovalVehicle({
      monthlyPayment: 500,
      annualRatePercent: 0,
      termMonths: 12,
      ltvPercent: 100,
      maxAmountFinanced: 4000
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.principalFromPayment).toBeCloseTo(6000, 6);
      expect(r.principalUsed).toBeCloseTo(4000, 6);
      expect(r.cappedByMax).toBe(true);
      expect(r.maxVehiclePrice).toBeCloseTo(4000, 6);
    }
  });

  it("computes max vehicle from LTV when LTV is not 100%", () => {
    const r = computeApprovalVehicle({
      monthlyPayment: 400,
      annualRatePercent: 0,
      termMonths: 10,
      ltvPercent: 125
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.principalUsed).toBeCloseTo(4000, 6);
      expect(r.maxVehiclePrice).toBeCloseTo(3200, 6);
    }
  });

  it("round-trips payment for a non-zero rate", () => {
    const principal = 25_000;
    const apr = 7.99;
    const n = 72;
    const monthlyRate = apr / 100 / 12;
    const pmt = paymentFromPrincipal(principal, monthlyRate, n);
    const r = computeApprovalVehicle({
      monthlyPayment: pmt,
      annualRatePercent: apr,
      termMonths: n,
      ltvPercent: 100
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.principalFromPayment).toBeCloseTo(principal, 0);
      expect(r.impliedPaymentFromPrincipalUsed).toBeCloseTo(pmt, 2);
    }
  });
});

describe("paymentFromPrincipal", () => {
  it("matches zero-rate amortization", () => {
    expect(paymentFromPrincipal(12_000, 0, 12)).toBeCloseTo(1000, 6);
  });
});
