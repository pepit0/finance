import { describe, expect, it } from "vitest";
import type { FilterState, Lender } from "../types/lender";
import {
  buildSituationInfoLines,
  formatPaymentCad,
  INCOME_WAIVE_PLACEHOLDER,
  incomeWaiveDisplayText,
  minIncomeDisplayText,
  youngBuyerActiveFromFilters
} from "./lenderCardInfoContent";

function filtersBase(): FilterState {
  return {
    openBK: false,
    repo: false,
    selfEmployed: false,
    nineSinNewToCanada: false,
    secondUnit: false,
    nativeStatus: false,
    dateOfBirth: "",
    province: "",
    creditScore: null,
    ltv: null,
    jobTenureYears: null,
    jobTenureMonths: null,
    incomeAmountCad: null,
    incomeProgram: ""
  };
}

const stubLender = { guidelineTexts: {} } as unknown as Lender;

describe("buildSituationInfoLines", () => {
  it("returns empty when self-employed is not selected", () => {
    const lender = { ...stubLender, guidelineTexts: { ...emptyGt(), selfEmployed: "2 years NOA" } } as Lender;
    expect(buildSituationInfoLines(filtersBase(), lender)).toEqual([]);
  });

  it("returns NOA / self-employed line with sheet text when selected", () => {
    const lender = {
      ...stubLender,
      guidelineTexts: {
        ...emptyGt(),
        selfEmployed: "2 years NOA"
      }
    } as Lender;

    const lines = buildSituationInfoLines({ ...filtersBase(), selfEmployed: true }, lender);
    expect(lines).toEqual([{ title: "NOA / self-employed", body: "2 years NOA" }]);
  });

  it("uses fallback when self-employed sheet copy is empty", () => {
    const lender = {
      ...stubLender,
      guidelineTexts: { ...emptyGt(), selfEmployed: "   " }
    } as Lender;
    const lines = buildSituationInfoLines({ ...filtersBase(), selfEmployed: true }, lender);
    expect(lines).toEqual([{ title: "NOA / self-employed", body: "No extra detail in sheet." }]);
  });
});

function emptyGt(): Lender["guidelineTexts"] {
  return {
    openBK: "",
    repo: "",
    selfEmployed: "",
    newToCanada: "",
    secondUnit: "",
    nativeStatus: "",
    youngBuyer: "",
    serviceArea: "",
    minScore: "",
    maxLTV: "",
    jobTenure: "",
    shortJobTenureTwoJobs: "",
    addressTenure: "",
    incomeAish: "",
    incomeDisability: "",
    incomeDisabilityProgram: "",
    incomeChildTax: "",
    incomeWaive: "",
    minPayment: "",
    maxPayment: "",
    minIncome: ""
  };
}

describe("incomeWaiveDisplayText", () => {
  it("returns placeholder when sheet field empty", () => {
    const lender = { ...stubLender, guidelineTexts: { ...emptyGt(), incomeWaive: "" } } as Lender;
    expect(incomeWaiveDisplayText(lender)).toBe(INCOME_WAIVE_PLACEHOLDER);
  });

  it("returns trimmed sheet text when set", () => {
    const lender = {
      ...stubLender,
      guidelineTexts: { ...emptyGt(), incomeWaive: "  Two pay stubs  " }
    } as Lender;
    expect(incomeWaiveDisplayText(lender)).toBe("Two pay stubs");
  });
});

describe("formatPaymentCad", () => {
  it("formats CAD", () => {
    expect(formatPaymentCad(400)).toMatch(/400/);
  });

  it("returns em dash for null", () => {
    expect(formatPaymentCad(null)).toBe("—");
  });
});

describe("minIncomeDisplayText", () => {
  it("prefers parsed CAD when minIncomeCad is set", () => {
    const lender = {
      ...stubLender,
      minIncomeCad: 3500,
      guidelineTexts: { ...emptyGt(), minIncome: "See notes" }
    } as Lender;
    expect(minIncomeDisplayText(lender)).toMatch(/3,?500/);
  });

  it("falls back to trimmed sheet text when no numeric min", () => {
    const lender = {
      ...stubLender,
      minIncomeCad: null,
      guidelineTexts: { ...emptyGt(), minIncome: "  $4k/mo gross  " }
    } as Lender;
    expect(minIncomeDisplayText(lender)).toBe("$4k/mo gross");
  });

  it("returns em dash when absent", () => {
    const lender = {
      ...stubLender,
      minIncomeCad: null,
      guidelineTexts: { ...emptyGt(), minIncome: "" }
    } as Lender;
    expect(minIncomeDisplayText(lender)).toBe("—");
  });
});

describe("youngBuyerActiveFromFilters", () => {
  it("is true when DOB implies under 24", () => {
    const filters = { ...filtersBase(), dateOfBirth: "2003-06-01" };
    expect(youngBuyerActiveFromFilters(filters, new Date(2026, 0, 1))).toBe(true);
  });
});
