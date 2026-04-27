import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { FilterState, Lender } from "../types/lender";
import { evaluateLenders, stripLeadingSheetVerdict } from "./decisionEngine";

const emptyGuidelines = {
  openBK: "",
  repo: "",
  selfEmployed: "",
  newToCanada: "",
  youngBuyer: "",
  serviceArea: "",
  minScore: "",
  maxLTV: ""
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
  notes: "",
  guidelineTexts: { ...emptyGuidelines },
  openBKScenario: null,
  repoScenario: null,
  newToCanadaScenario: null,
  youngBuyerScenario: null,
  serviceArea: defaultServiceArea
};

const baseFilters: FilterState = {
  openBK: false,
  repo: false,
  selfEmployed: false,
  newToCanada: false,
  hasNineSin: false,
  dateOfBirth: "",
  province: "",
  creditScore: null,
  ltv: null
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
      "Open BK: discharged under 2y",
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
      "Open BK: Open BK not accepted",
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
    expect(results[0].conditionalReasons).toEqual(["Open BK: Rep approval required"]);
  });

  it("uses 9 SIN checkbox against new-to-canada lender support", () => {
    const filters: FilterState = {
      ...baseFilters,
      hasNineSin: true
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
    expect(results[0].declineReasons).toContain("9 SIN: 9 SIN / new to Canada (sheet)");
  });

  it("returns conditional stip text for 9 SIN without duplicate conditional wording", () => {
    const filters: FilterState = { ...baseFilters, hasNineSin: true };
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
      "9 SIN: Yes but for the length of Visa (Term length of visa)"
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

  it("shows both selected situation lines when Open BK and 9 SIN are both in play", () => {
    const filters: FilterState = { ...baseFilters, openBK: true, hasNineSin: true };
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
      "Open BK: BK reviewed by rep",
      "9 SIN: Max term = length of visa term"
    ]);
    expect(results[0].eligibleReasons).toEqual([]);
  });

  it("adds green Repo is accepted when Open BK is conditional and repo is clearly eligible", () => {
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
    expect(results[0].conditionalReasons).toEqual(["Open BK: discharge reviewed"]);
    expect(results[0].eligibleReasons).toEqual(["Repo is accepted"]);
  });

  it("adds Open BK is accepted when repo is conditional and open BK is clearly eligible", () => {
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
    expect(results[0].eligibleReasons).toEqual(["Open BK is accepted"]);
  });

  it("does not add eligible highlights when only Open BK is conditional and repo is not selected", () => {
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

    it("shows young buyer accepted when open BK is conditional and young buyer row is eligible", () => {
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
      expect(results[0].conditionalReasons).toEqual(["Open BK: rep review"]);
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
