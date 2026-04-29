import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { FilterState, Lender } from "../types/lender";
import { evaluateLenders, stripLeadingSheetVerdict } from "./decisionEngine";

const emptyGuidelines = {
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

const defaultServiceArea = { canadaWide: true, isDenylist: false, provinces: [] as string[], raw: "" };

const lender: Lender = {
  lenderName: "Prime Auto",
  websiteUrl: "https://example.com",
  bookingGuideUrl: "",
  minScore: 600,
  maxLTV: 120,
  allowsOpenBK: false,
  allowsRepo: true,
  allowsSelfEmployed: false,
  allowsNewToCanada: true,
  allowsYoungBuyer: true,
  allowsSecondUnit: true,
  allowsNativeStatus: true,
  allowsShortJobTenureTwoJobs: true,
  hasShortJobTenureTwoJobsMatrixRow: false,
  minJobTenureMonths: null,
  minAddressTenureMonths: null,
  allowsAishIncome: true,
  allowsDisabilityIncome: true,
  allowsDisabilityProgramIncome: true,
  allowsChildTaxIncome: true,
  minPaymentCad: null,
  maxPaymentCad: null,
  minIncomeCad: null,
  notes: "",
  guidelineTexts: { ...emptyGuidelines },
  openBKScenario: null,
  repoScenario: null,
  newToCanadaScenario: null,
  youngBuyerScenario: null,
  secondUnitScenario: null,
  nativeStatusScenario: null,
  incomeAishScenario: null,
  incomeDisabilityScenario: null,
  incomeDisabilityProgramScenario: null,
  incomeChildTaxScenario: null,
  serviceArea: defaultServiceArea
};

const baseFilters: FilterState = {
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

describe("stripLeadingSheetVerdict", () => {
  it("removes verdict words and yes/no with common separators", () => {
    expect(stripLeadingSheetVerdict("Conditional — max term = visa")).toBe("max term = visa");
    expect(stripLeadingSheetVerdict("Eligible | OK with stip")).toBe("OK with stip");
    expect(stripLeadingSheetVerdict("No: not on program")).toBe("not on program");
    expect(stripLeadingSheetVerdict("YES — 2 years")).toBe("2 years");
  });

  it("does not strip Yes when followed by but (substantive phrase)", () => {
    expect(stripLeadingSheetVerdict("Yes but for the length of Visa")).toBe("Yes but for the length of Visa");
  });
});

describe("evaluateLenders", () => {
  it("returns eligible when filters are satisfied", () => {
    const results = evaluateLenders([lender], baseFilters);
    expect(results[0].outcome).toBe("eligible");
    expect(results[0].declineReasons).toHaveLength(0);
    expect(results[0].eligibleReasons).toHaveLength(0);
    expect(results[0].conditionalReasons).toHaveLength(0);
    expect(results[0].selectedProvinceCode).toBeNull();
    expect(results[0].servicesSelectedProvince).toBeNull();
  });

  it("does not attach eligible explanation text when filters match", () => {
    const sheetLender: Lender = {
      ...lender,
      guidelineTexts: {
        ...emptyGuidelines,
        repo: "YES after 24 months (from sheet)",
        minScore: "Beacon 600+ OK",
        maxLTV: "Up to 120% per program"
      }
    };
    const filters: FilterState = {
      ...baseFilters,
      repo: true,
      creditScore: 650,
      ltv: 110
    };

    const results = evaluateLenders([sheetLender], filters);
    expect(results[0].outcome).toBe("eligible");
    expect(results[0].eligibleReasons).toHaveLength(0);
    expect(results[0].conditionalReasons).toHaveLength(0);
  });

  it("returns decline lines with leading verdict wording stripped when from sheet", () => {
    const sheetLender: Lender = {
      ...lender,
      guidelineTexts: {
        ...emptyGuidelines,
        openBK: "Ineligible — discharged under 2y",
        selfEmployed: "NO — need 2 years NOA",
        minScore: "Minimum 600 beacon",
        maxLTV: "Max advance 120% book"
      }
    };
    const filters: FilterState = {
      ...baseFilters,
      openBK: true,
      selfEmployed: true,
      creditScore: 550,
      ltv: 130
    };

    const results = evaluateLenders([sheetLender], filters);
    expect(results[0].outcome).toBe("ineligible");
    expect(results[0].eligibleReasons).toHaveLength(0);
    expect(results[0].declineReasons).toEqual([
      "Double Bankruptcy: discharged under 2y",
      "Self-Employed: need 2 years NOA",
      "Minimum 600 beacon",
      "Max advance 120% book"
    ]);
  });

  it("falls back to short labels when the sheet has no copy for a row", () => {
    const filters: FilterState = {
      ...baseFilters,
      openBK: true,
      selfEmployed: true,
      creditScore: 550,
      ltv: 130
    };

    const results = evaluateLenders([lender], filters);
    expect(results[0].outcome).toBe("ineligible");
    expect(results[0].declineReasons).toEqual([
      "Double Bankruptcy: Double Bankruptcy not accepted",
      "Self-Employed: Self-employed not accepted",
      "Credit score below 600",
      "LTV exceeds 120"
    ]);
  });

  it("shows conditional stip text without repeating the verdict label", () => {
    const conditionalLender: Lender = {
      ...lender,
      allowsOpenBK: true,
      openBKScenario: { verdict: "conditional", detail: "Conditional — Rep approval required" },
      guidelineTexts: {
        ...emptyGuidelines,
        openBK: "Conditional — Rep approval required"
      }
    };
    const filters: FilterState = { ...baseFilters, openBK: true };
    const results = evaluateLenders([conditionalLender], filters);
    expect(results[0].outcome).toBe("conditional");
    expect(results[0].conditionalReasons).toEqual(["Double Bankruptcy: Rep approval required"]);
  });

  it("declines when second unit is selected and the lender row does not allow it", () => {
    const filters: FilterState = { ...baseFilters, secondUnit: true };
    const strict: Lender = {
      ...lender,
      allowsSecondUnit: false,
      guidelineTexts: { ...emptyGuidelines, secondUnit: "Ineligible — one deal at a time" }
    };
    const results = evaluateLenders([strict], filters);
    expect(results[0].outcome).toBe("ineligible");
    expect(results[0].declineReasons).toContain("Second unit: one deal at a time");
  });

  it("returns conditional stip text for second unit when matrix row is conditional", () => {
    const filters: FilterState = { ...baseFilters, secondUnit: true };
    const cond: Lender = {
      ...lender,
      allowsSecondUnit: true,
      secondUnitScenario: {
        verdict: "conditional",
        detail: "Conditional — max TERM 72 months"
      },
      guidelineTexts: { ...emptyGuidelines, secondUnit: "Conditional — max TERM 72 months" }
    };
    const results = evaluateLenders([cond], filters);
    expect(results[0].outcome).toBe("conditional");
    expect(results[0].conditionalReasons).toEqual(["Second unit: max TERM 72 months"]);
  });

  it("declines when native status is selected and the lender row does not allow it", () => {
    const filters: FilterState = { ...baseFilters, nativeStatus: true };
    const strict: Lender = {
      ...lender,
      allowsNativeStatus: false,
      guidelineTexts: { ...emptyGuidelines, nativeStatus: "Ineligible — not on program" }
    };
    const results = evaluateLenders([strict], filters);
    expect(results[0].outcome).toBe("ineligible");
    expect(results[0].declineReasons).toContain("Native status: not on program");
  });

  it("returns conditional stip text for native status when matrix row is conditional", () => {
    const filters: FilterState = { ...baseFilters, nativeStatus: true };
    const cond: Lender = {
      ...lender,
      allowsNativeStatus: true,
      nativeStatusScenario: {
        verdict: "conditional",
        detail: "Conditional — status card on file"
      },
      guidelineTexts: { ...emptyGuidelines, nativeStatus: "Conditional — status card on file" }
    };
    const results = evaluateLenders([cond], filters);
    expect(results[0].outcome).toBe("conditional");
    expect(results[0].conditionalReasons).toEqual(["Native status: status card on file"]);
  });

  it("declines when job tenure is below lender minimum and customer stated tenure", () => {
    const filters: FilterState = {
      ...baseFilters,
      jobTenureYears: 0,
      jobTenureMonths: 6
    };
    const strict: Lender = {
      ...lender,
      minJobTenureMonths: 12,
      guidelineTexts: { ...emptyGuidelines, jobTenure: "Min 12 months on job" }
    };
    const results = evaluateLenders([strict], filters);
    expect(results[0].outcome).toBe("ineligible");
    expect(results[0].declineReasons).toContain("Job tenure: Min 12 months on job");
  });

  it("does not apply job tenure rule when customer tenure is not stated", () => {
    const filters: FilterState = { ...baseFilters, jobTenureYears: null, jobTenureMonths: null };
    const strict: Lender = {
      ...lender,
      minJobTenureMonths: 120,
      guidelineTexts: { ...emptyGuidelines, jobTenure: "10 years" }
    };
    expect(evaluateLenders([strict], filters)[0].outcome).toBe("eligible");
  });

  it("when job tenure is under 2 months, uses 2-job row and declines if sheet says no", () => {
    const filters: FilterState = { ...baseFilters, jobTenureYears: 0, jobTenureMonths: 1 };
    const strict: Lender = {
      ...lender,
      minJobTenureMonths: 12,
      hasShortJobTenureTwoJobsMatrixRow: true,
      allowsShortJobTenureTwoJobs: false,
      guidelineTexts: {
        ...emptyGuidelines,
        shortJobTenureTwoJobs: "NO — second job required",
        jobTenure: "Min 12 months on job"
      }
    };
    const results = evaluateLenders([strict], filters);
    expect(results[0].outcome).toBe("ineligible");
    expect(results[0].declineReasons.some((line) => line.includes("2+ jobs"))).toBe(true);
    expect(results[0].declineReasons.some((line) => line.startsWith("Job tenure:"))).toBe(false);
  });

  it("when job tenure is under 2 months and 2-job row is conditional, outcome is conditional", () => {
    const filters: FilterState = { ...baseFilters, jobTenureYears: 0, jobTenureMonths: 1 };
    const cond: Lender = {
      ...lender,
      minJobTenureMonths: 12,
      hasShortJobTenureTwoJobsMatrixRow: true,
      allowsShortJobTenureTwoJobs: true,
      shortJobTenureTwoJobsScenario: {
        verdict: "conditional",
        detail: "Conditional — second job 6+ months"
      },
      guidelineTexts: {
        ...emptyGuidelines,
        shortJobTenureTwoJobs: "Conditional — second job 6+ months",
        jobTenure: "Min 12 months"
      }
    };
    const results = evaluateLenders([cond], filters);
    expect(results[0].outcome).toBe("conditional");
    expect(results[0].conditionalReasons.join("\n")).toMatch(/second job 6\+ months/i);
  });

  it("when job tenure is under 2 months and matrix has no 2-job row, falls back to min job tenure", () => {
    const filters: FilterState = { ...baseFilters, jobTenureYears: 0, jobTenureMonths: 1 };
    const strict: Lender = {
      ...lender,
      hasShortJobTenureTwoJobsMatrixRow: false,
      minJobTenureMonths: 12,
      allowsShortJobTenureTwoJobs: true,
      guidelineTexts: { ...emptyGuidelines, jobTenure: "Min 12 months on job" }
    };
    const results = evaluateLenders([strict], filters);
    expect(results[0].outcome).toBe("ineligible");
    expect(results[0].declineReasons).toContain("Job tenure: Min 12 months on job");
  });

  it("when job tenure is 2+ months, min job tenure rule still applies", () => {
    const filters: FilterState = { ...baseFilters, jobTenureYears: 0, jobTenureMonths: 2 };
    const strict: Lender = {
      ...lender,
      minJobTenureMonths: 12,
      allowsShortJobTenureTwoJobs: false,
      guidelineTexts: { ...emptyGuidelines, jobTenure: "Min 12 months on job" }
    };
    const results = evaluateLenders([strict], filters);
    expect(results[0].outcome).toBe("ineligible");
    expect(results[0].declineReasons).toContain("Job tenure: Min 12 months on job");
  });

  it("declines when primary income is Disability (AISH/ODSP) and lender disallows that program", () => {
    const filters: FilterState = { ...baseFilters, incomeProgram: "disability_benefit" };
    const strict: Lender = {
      ...lender,
      allowsDisabilityProgramIncome: false,
      guidelineTexts: { ...emptyGuidelines, incomeDisabilityProgram: "Employment only" }
    };
    const results = evaluateLenders([strict], filters);
    expect(results[0].outcome).toBe("ineligible");
    expect(results[0].declineReasons).toContain("Disability (AISH/ODSP): Employment only");
  });

  it("returns conditional outcome when Child tax / CCB matrix row is Conditional", () => {
    const filters: FilterState = { ...baseFilters, incomeProgram: "child_tax" };
    const ccbConditional: Lender = {
      ...lender,
      allowsChildTaxIncome: true,
      incomeChildTaxScenario: {
        verdict: "conditional",
        detail: "Conditional — primary caregiver + 2 years tax returns"
      },
      guidelineTexts: {
        ...emptyGuidelines,
        incomeChildTax: "Conditional — primary caregiver + 2 years tax returns"
      }
    };
    const results = evaluateLenders([ccbConditional], filters);
    expect(results[0].outcome).toBe("conditional");
    expect(results[0].conditionalReasons).toEqual([
      "Child tax / CCB income: primary caregiver + 2 years tax returns"
    ]);
  });

  it("declines when entered income is below Deal build MIN INCOME from sheet", () => {
    const filters: FilterState = { ...baseFilters, incomeAmountCad: 1_400 };
    const strict: Lender = {
      ...lender,
      minIncomeCad: 2_000,
      guidelineTexts: { ...emptyGuidelines, minIncome: "$2,000/mo minimum" }
    };
    const results = evaluateLenders([strict], filters);
    expect(results[0].outcome).toBe("ineligible");
    expect(results[0].declineReasons.some((line) => line.startsWith("Minimum income:"))).toBe(true);
    expect(results[0].declineReasons.join("\n")).toMatch(/2,?000/);
  });

  it("does not decline on income when sheet has no parsable MIN INCOME", () => {
    const filters: FilterState = { ...baseFilters, incomeAmountCad: 500 };
    const results = evaluateLenders([lender], filters);
    expect(results[0].outcome).toBe("eligible");
  });

  it("uses 9 SIN / New to Canada filter against lender 900 SIN row support", () => {
    const filters: FilterState = {
      ...baseFilters,
      nineSinNewToCanada: true
    };

    const restrictedLender: Lender = {
      ...lender,
      allowsNewToCanada: false,
      openBKScenario: null,
      newToCanadaScenario: null,
      guidelineTexts: {
        ...lender.guidelineTexts,
        newToCanada: "NO — 9 SIN / new to Canada (sheet)"
      }
    };

    const results = evaluateLenders([restrictedLender], filters);
    expect(results[0].outcome).toBe("ineligible");
    expect(results[0].declineReasons).toContain(
      "9 SIN / New to Canada: 9 SIN / new to Canada (sheet)"
    );
  });

  it("returns conditional stip text for 9 SIN / New to Canada without duplicate conditional wording", () => {
    const filters: FilterState = { ...baseFilters, nineSinNewToCanada: true };
    const iaLike: Lender = {
      ...lender,
      allowsNewToCanada: true,
      newToCanadaScenario: {
        verdict: "conditional",
        detail: "Conditional — Yes but for the length of Visa (Term length of visa)"
      },
      guidelineTexts: {
        ...emptyGuidelines,
        newToCanada: "Conditional — Yes but for the length of Visa"
      }
    };
    const results = evaluateLenders([iaLike], filters);
    expect(results[0].outcome).toBe("conditional");
    expect(results[0].conditionalReasons).toEqual([
      "9 SIN / New to Canada: Yes but for the length of Visa (Term length of visa)"
    ]);
  });

  it("returns conditional outcome for repo when SINGLE REPO is conditional", () => {
    const filters: FilterState = { ...baseFilters, repo: true };
    const repoConditional: Lender = {
      ...lender,
      allowsRepo: true,
      repoScenario: {
        verdict: "conditional",
        detail: "Conditional — min 24 months since last repo"
      },
      guidelineTexts: {
        ...emptyGuidelines,
        repo: "Conditional — min 24 months since last repo"
      }
    };
    const results = evaluateLenders([repoConditional], filters);
    expect(results[0].outcome).toBe("conditional");
    expect(results[0].conditionalReasons).toEqual(["Repo: min 24 months since last repo"]);
  });

  it("shows both selected situation lines when double bankruptcy and 9 SIN / New to Canada are in play", () => {
    const filters: FilterState = { ...baseFilters, openBK: true, nineSinNewToCanada: true };
    const lenderBoth: Lender = {
      ...lender,
      allowsOpenBK: true,
      allowsNewToCanada: true,
      openBKScenario: { verdict: "conditional", detail: "Conditional — BK reviewed by rep" },
      newToCanadaScenario: {
        verdict: "conditional",
        detail: "Conditional — Max term = length of visa term"
      }
    };

    const results = evaluateLenders([lenderBoth], filters);
    expect(results[0].outcome).toBe("conditional");
    expect(results[0].conditionalReasons).toEqual([
      "Double Bankruptcy: BK reviewed by rep",
      "9 SIN / New to Canada: Max term = length of visa term"
    ]);
    expect(results[0].eligibleReasons).toEqual([]);
  });

  it("adds green Repo is accepted when double bankruptcy is conditional and repo is clearly eligible", () => {
    const filters: FilterState = { ...baseFilters, openBK: true, repo: true };
    const tdLike: Lender = {
      ...lender,
      allowsOpenBK: true,
      allowsRepo: true,
      openBKScenario: { verdict: "conditional", detail: "Conditional — discharge reviewed" },
      repoScenario: { verdict: "eligible", detail: "Eligible | repo OK after 12 months" },
      guidelineTexts: {
        ...emptyGuidelines,
        openBK: "Conditional — discharge reviewed",
        repo: "Eligible | repo OK after 12 months"
      }
    };
    const results = evaluateLenders([tdLike], filters);
    expect(results[0].outcome).toBe("conditional");
    expect(results[0].conditionalReasons).toEqual(["Double Bankruptcy: discharge reviewed"]);
    expect(results[0].eligibleReasons).toEqual(["Repo is accepted"]);
  });

  it("adds Double Bankruptcy is accepted when repo is conditional and double bankruptcy is clearly eligible", () => {
    const filters: FilterState = { ...baseFilters, openBK: true, repo: true };
    const mixed: Lender = {
      ...lender,
      allowsOpenBK: true,
      allowsRepo: true,
      openBKScenario: { verdict: "eligible", detail: "Eligible | discharged 24+ months" },
      repoScenario: { verdict: "conditional", detail: "Conditional — min 24 months since repo" },
      guidelineTexts: { ...emptyGuidelines }
    };
    const results = evaluateLenders([mixed], filters);
    expect(results[0].outcome).toBe("conditional");
    expect(results[0].conditionalReasons).toEqual(["Repo: min 24 months since repo"]);
    expect(results[0].eligibleReasons).toEqual(["Double Bankruptcy is accepted"]);
  });

  it("does not add eligible highlights when only double bankruptcy is conditional and repo is not selected", () => {
    const filters: FilterState = { ...baseFilters, openBK: true };
    const conditionalLender: Lender = {
      ...lender,
      allowsOpenBK: true,
      openBKScenario: { verdict: "conditional", detail: "Conditional — Rep approval required" },
      guidelineTexts: { ...emptyGuidelines, openBK: "Conditional — Rep approval required" }
    };
    const results = evaluateLenders([conditionalLender], filters);
    expect(results[0].outcome).toBe("conditional");
    expect(results[0].eligibleReasons).toEqual([]);
  });

  describe("young buyer (from date of birth)", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 5, 15, 12, 0, 0));
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    const under24Dob = "2003-03-10";
    const over24Dob = "2000-01-10";

    it("does not apply the young buyer row when age is 24 or older", () => {
      const filters: FilterState = { ...baseFilters, dateOfBirth: over24Dob };
      const strict: Lender = { ...lender, allowsYoungBuyer: false };
      expect(evaluateLenders([strict], filters)[0].outcome).toBe("eligible");
    });

    it("declines when under 24 and young buyers row is not allowed", () => {
      const filters: FilterState = { ...baseFilters, dateOfBirth: under24Dob };
      const strict: Lender = {
        ...lender,
        allowsYoungBuyer: false,
        guidelineTexts: {
          ...emptyGuidelines,
          youngBuyer: "Ineligible — co-borrower 25+ required"
        },
        youngBuyerScenario: { verdict: "ineligible", detail: "co-borrower 25+ required" }
      };
      const results = evaluateLenders([strict], filters);
      expect(results[0].outcome).toBe("ineligible");
      expect(results[0].declineReasons).toEqual(["Young buyer: co-borrower 25+ required"]);
    });

    it("conditional when under 24 and matrix row is conditional", () => {
      const filters: FilterState = { ...baseFilters, dateOfBirth: under24Dob };
      const cond: Lender = {
        ...lender,
        allowsYoungBuyer: true,
        youngBuyerScenario: {
          verdict: "conditional",
          detail: "Conditional — co-signer on title required"
        },
        guidelineTexts: { ...emptyGuidelines, youngBuyer: "Conditional — co-signer on title required" }
      };
      const results = evaluateLenders([cond], filters);
      expect(results[0].outcome).toBe("conditional");
      expect(results[0].conditionalReasons).toEqual(["Young buyer: co-signer on title required"]);
    });

    it("shows young buyer accepted when double bankruptcy is conditional and young buyer row is eligible", () => {
      const filters: FilterState = { ...baseFilters, openBK: true, dateOfBirth: under24Dob };
      const mixed: Lender = {
        ...lender,
        allowsOpenBK: true,
        allowsYoungBuyer: true,
        openBKScenario: { verdict: "conditional", detail: "Conditional — rep review" },
        youngBuyerScenario: { verdict: "eligible", detail: "" },
        guidelineTexts: { ...emptyGuidelines, openBK: "Conditional", youngBuyer: "Eligible" }
      };
      const results = evaluateLenders([mixed], filters);
      expect(results[0].outcome).toBe("conditional");
      expect(results[0].conditionalReasons).toEqual(["Double Bankruptcy: rep review"]);
      expect(results[0].eligibleReasons).toEqual(["Young buyer is accepted"]);
    });
  });

  describe("province vs service area", () => {
    it("declines when province is not in allowlist", () => {
      const filters: FilterState = { ...baseFilters, province: "QC" };
      const regional: Lender = {
        ...lender,
        serviceArea: {
          canadaWide: false,
          isDenylist: false,
          provinces: ["ON", "BC", "AB"],
          raw: "ON, BC, AB"
        },
        guidelineTexts: { ...emptyGuidelines, serviceArea: "ON, BC, AB" }
      };
      const r = evaluateLenders([regional], filters)[0];
      expect(r.outcome).toBe("ineligible");
      expect(r.servicesSelectedProvince).toBe(false);
      expect(r.selectedProvinceCode).toBe("QC");
      expect(r.declineReasons.some((line) => line.startsWith("Service area:"))).toBe(true);
    });

    it("eligible when province matches allowlist", () => {
      const filters: FilterState = { ...baseFilters, province: "ON" };
      const regional: Lender = {
        ...lender,
        serviceArea: {
          canadaWide: false,
          isDenylist: false,
          provinces: ["ON", "BC"],
          raw: "ON, BC"
        },
        guidelineTexts: { ...emptyGuidelines, serviceArea: "ON, BC" }
      };
      const r = evaluateLenders([regional], filters)[0];
      expect(r.outcome).toBe("eligible");
      expect(r.servicesSelectedProvince).toBe(true);
      expect(r.selectedProvinceCode).toBe("ON");
    });

    it("declines when province is on denylist", () => {
      const filters: FilterState = { ...baseFilters, province: "QC" };
      const regional: Lender = {
        ...lender,
        serviceArea: {
          canadaWide: false,
          isDenylist: true,
          provinces: ["QC"],
          raw: "Does not service QC"
        },
        guidelineTexts: { ...emptyGuidelines, serviceArea: "Does not service QC" }
      };
      const r = evaluateLenders([regional], filters)[0];
      expect(r.outcome).toBe("ineligible");
      expect(r.servicesSelectedProvince).toBe(false);
    });

    it("eligible when province is not on denylist", () => {
      const filters: FilterState = { ...baseFilters, province: "ON" };
      const regional: Lender = {
        ...lender,
        serviceArea: {
          canadaWide: false,
          isDenylist: true,
          provinces: ["QC"],
          raw: "Except QC"
        },
        guidelineTexts: { ...emptyGuidelines, serviceArea: "Except QC" }
      };
      const r = evaluateLenders([regional], filters)[0];
      expect(r.outcome).toBe("eligible");
      expect(r.servicesSelectedProvince).toBe(true);
    });
  });
});
