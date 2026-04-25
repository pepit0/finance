import { describe, expect, it } from "vitest";
import type { FilterState, Lender } from "../types/lender";
import { evaluateLenders, stripLeadingSheetVerdict } from "./decisionEngine";

const emptyGuidelines = {
  openBK: "",
  repo: "",
  selfEmployed: "",
  newToCanada: "",
  minScore: "",
  maxLTV: ""
};

const lender: Lender = {
  lenderName: "Prime Auto",
  websiteUrl: "https://example.com",
  minScore: 600,
  maxLTV: 120,
  allowsOpenBK: false,
  allowsRepo: true,
  allowsSelfEmployed: false,
  allowsNewToCanada: true,
  notes: "",
  guidelineTexts: { ...emptyGuidelines },
  openBKScenario: null,
  repoScenario: null,
  newToCanadaScenario: null
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
  });

  it("does not attach eligible explanation text when filters match", () => {
    const sheetLender: Lender = {
      ...lender,
      guidelineTexts: {
        openBK: "",
        repo: "YES after 24 months (from sheet)",
        selfEmployed: "",
        newToCanada: "",
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
        openBK: "Ineligible — discharged under 2y",
        repo: "",
        selfEmployed: "NO — need 2 years NOA",
        newToCanada: "",
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
  });
});
