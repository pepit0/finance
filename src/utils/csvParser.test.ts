import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  extractHttpUrlFromCell,
  parseEligibilityVerdictFromAnswer,
  parseLenderRows,
  parseLendersFromCsvText,
  parseMinMaxMonthlyPaymentFromSheetCell,
  parseMinimumIncomeCadFromSheetCell,
  parseSheetAnswerReasonCell,
  resolveRepoFromRow,
  resolveNewToCanadaFromRow
} from "./csvParser";

describe("parseMinimumIncomeCadFromSheetCell", () => {
  it("parses a single monthly amount", () => {
    expect(parseMinimumIncomeCadFromSheetCell("$2,500 Tier'd")).toBe(2500);
  });

  it("uses the lowest plausible amount when several appear", () => {
    expect(parseMinimumIncomeCadFromSheetCell("$1,800 single, $2,400 joint")).toBe(1800);
  });

  it("returns null when no amount in range", () => {
    expect(parseMinimumIncomeCadFromSheetCell("Case by case")).toBeNull();
  });
});

describe("parseMinMaxMonthlyPaymentFromSheetCell", () => {
  it("parses explicit “to” ranges", () => {
    expect(parseMinMaxMonthlyPaymentFromSheetCell("$250 to $650")).toEqual({ min: 250, max: 650 });
    expect(parseMinMaxMonthlyPaymentFromSheetCell("$200.00 TO $899.99 / extra")).toEqual({
      min: 200,
      max: 899.99
    });
  });

  it("parses dash-separated amounts", () => {
    expect(parseMinMaxMonthlyPaymentFromSheetCell("850.00-900.00")).toEqual({ min: 850, max: 900 });
  });

  it("uses min/max of tier-like monthly amounts when no explicit range", () => {
    expect(
      parseMinMaxMonthlyPaymentFromSheetCell("$250 min Tier 2 $650 Tier 3 $700 Tier 4 $750 Tier 5 $850")
    ).toEqual({ min: 250, max: 850 });
  });

  it("returns nulls for empty input", () => {
    expect(parseMinMaxMonthlyPaymentFromSheetCell("")).toEqual({ min: null, max: null });
  });
});

describe("extractHttpUrlFromCell", () => {
  it("reads URL from HYPERLINK formula with double quotes", () => {
    expect(
      extractHttpUrlFromCell('=HYPERLINK("https://drive.google.com/file/d/AbCd1234/view","Booking guide")')
    ).toBe("https://drive.google.com/file/d/AbCd1234/view");
  });

  it("reads URL from HYPERLINK when the label is the first argument and URL is second", () => {
    expect(
      extractHttpUrlFromCell('=HYPERLINK("BOOKING GUIDE","https://drive.google.com/file/d/ZzYyXx/view")')
    ).toBe("https://drive.google.com/file/d/ZzYyXx/view");
  });

  it("finds first https URL embedded in plain text", () => {
    expect(extractHttpUrlFromCell('See https://example.com/path (note)')).toBe("https://example.com/path");
  });
});

describe("parseEligibilityVerdictFromAnswer", () => {
  it("reads Eligible / Conditional / Ineligible with optional same-cell tail", () => {
    expect(parseEligibilityVerdictFromAnswer("Eligible")).toEqual({ verdict: "eligible", tail: "" });
    expect(parseEligibilityVerdictFromAnswer("Ineligible — discharged under 2y")).toEqual({
      verdict: "ineligible",
      tail: "discharged under 2y"
    });
    expect(parseEligibilityVerdictFromAnswer("Conditional | call rep")).toEqual({
      verdict: "conditional",
      tail: "call rep"
    });
    expect(parseEligibilityVerdictFromAnswer("YES only")).toBeNull();
  });
});

describe("parseSheetAnswerReasonCell", () => {
  it("parses Yes | reason and No: reason formats", () => {
    expect(parseSheetAnswerReasonCell("Yes | 2 years discharged")).toEqual({
      answer: true,
      displayLine: "Yes — 2 years discharged"
    });
    expect(parseSheetAnswerReasonCell("No: not on program")).toEqual({
      answer: false,
      displayLine: "No — not on program"
    });
  });

  it("returns null answer for legacy slash wording", () => {
    const r = parseSheetAnswerReasonCell("YES/ NO CREDIT COUNSELLING");
    expect(r.answer).toBeNull();
    expect(r.displayLine).toContain("YES/");
  });
});

describe("resolveNewToCanadaFromRow", () => {
  it("treats Yes but … as conditional with full detail", () => {
    const r = resolveNewToCanadaFromRow("Yes but for the length of Visa (Term length of visa)", undefined);
    expect(r.allows).toBe(true);
    expect(r.scenario).toEqual({
      verdict: "conditional",
      detail: "Yes but for the length of Visa (Term length of visa)"
    });
    expect(r.display).toContain("Conditional");
  });

  it("maps leading YES / NO / CONDITIONAL to verdicts", () => {
    expect(resolveNewToCanadaFromRow("NO (see rep)", undefined).scenario).toEqual({
      verdict: "ineligible",
      detail: "(see rep)"
    });
    expect(resolveNewToCanadaFromRow("YES", undefined).scenario).toEqual({
      verdict: "eligible",
      detail: ""
    });
    expect(resolveNewToCanadaFromRow("CONDITIONAL — max term = visa", undefined).scenario).toEqual({
      verdict: "conditional",
      detail: "max term = visa"
    });
  });

  it("merges a separate reason column with the answer cell", () => {
    const r = resolveNewToCanadaFromRow("Eligible", "Max term = visa length");
    expect(r.scenario?.verdict).toBe("eligible");
    expect(r.scenario?.detail).toContain("Max term");
    expect(r.display).toContain("Max term");
  });
});

describe("resolveRepoFromRow", () => {
  it("maps leading verdicts and keeps detail", () => {
    expect(resolveRepoFromRow("Conditional (min 2 years)", undefined).scenario).toEqual({
      verdict: "conditional",
      detail: "(min 2 years)"
    });
    expect(resolveRepoFromRow("Ineligible — not accepted", undefined).scenario).toEqual({
      verdict: "ineligible",
      detail: "not accepted"
    });
  });

  it("supports YES/NO/CONDITIONAL with reason column", () => {
    const r = resolveRepoFromRow("YES", "after 24 months");
    expect(r.allows).toBe(true);
    expect(r.scenario?.verdict).toBe("eligible");
    expect(r.scenario?.detail).toContain("after 24 months");
  });
});

describe("parseLenderRows", () => {
  it("parses valid rows and coerces values", () => {
    const result = parseLenderRows([
      {
        lenderName: "Alpha Bank",
        minScore: "620",
        maxLTV: "130",
        allowsOpenBK: "TRUE",
        allowsRepo: "FALSE",
        allowsSelfEmployed: "TRUE",
        allowsNewToCanada: "TRUE",
        notes: "POI required"
      }
    ]);

    expect(result.skippedRows).toBe(0);
    expect(result.lenders[0]).toMatchObject({
      lenderName: "Alpha Bank",
      minScore: 620,
      maxLTV: 130,
      allowsOpenBK: true,
      allowsRepo: false,
      allowsSelfEmployed: true,
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
      notes: "POI required",
      guidelineTexts: {
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
      },
      openBKScenario: null,
      newToCanadaScenario: null,
      youngBuyerScenario: null,
      secondUnitScenario: null,
      nativeStatusScenario: null,
      serviceArea: { canadaWide: true, isDenylist: false, provinces: [], raw: "" }
    });
  });

  it("skips invalid rows", () => {
    const result = parseLenderRows([
      {
        lenderName: "",
        minScore: "bad",
        maxLTV: "125",
        allowsOpenBK: "TRUE",
        allowsRepo: "FALSE",
        allowsSelfEmployed: "TRUE",
        allowsNewToCanada: "TRUE"
      }
    ]);

    expect(result.lenders).toHaveLength(0);
    expect(result.skippedRows).toBe(1);
  });

  it("extracts booking guide URLs from the row above the website row in matrix CSV", () => {
    const csvText = [
      ",,https://drive.google.com/file/d/AAAABBBBCCCC/view?usp=sharing,https://drive.google.com/file/d/ZZZZYYYYXXXX/view",
      ",,https://www.carfinco.com/,https://www.edenparkcanada.com/",
      ",,Santander,EDEN PARK",
      "CLIENT DETAILS,900 SIN,NO,YES",
      ",DOUBLE BANKO,NO,YES",
      ",SINGLE REPO,YES,NO",
      ",NOA ON SELF EMPLOYED,1 year minimum,NO",
      ",MAX ADVANCE,130% to 165%,UP TO 140 ALBERTA BOOK 180 ALL IN"
    ].join("\n");

    const result = parseLendersFromCsvText(csvText);
    expect(result.lenders).toHaveLength(2);
    expect(result.lenders[0].websiteUrl).toBe("https://www.carfinco.com/");
    expect(result.lenders[0].bookingGuideUrl).toContain("drive.google.com/file/d/AAAABBBBCCCC");
    expect(result.lenders[1].websiteUrl).toBe("https://www.edenparkcanada.com/");
    expect(result.lenders[1].bookingGuideUrl).toContain("drive.google.com/file/d/ZZZZYYYYXXXX");
  });

  it("extracts booking guide from HYPERLINK formula row above website in matrix CSV", () => {
    const csvText = [
      // RFC-4180: commas inside the formula require the field to be double-quoted, with " escaped as "".
      // Do not put a space after `,,` — it breaks the opening quote and Papa splits the formula across columns.
      `,,"=HYPERLINK(""https://drive.google.com/file/d/BOOKONE11/view"",""Guide"")",https://drive.google.com/file/d/BOOKTWO22/view`,
      ",,https://www.carfinco.com/,https://www.edenparkcanada.com/",
      ",,Santander,EDEN PARK",
      "CLIENT DETAILS,900 SIN,NO,YES",
      ",DOUBLE BANKO,NO,YES",
      ",SINGLE REPO,YES,NO",
      ",NOA ON SELF EMPLOYED,1 year minimum,NO",
      ",MAX ADVANCE,130% to 165%,UP TO 140 ALBERTA BOOK 180 ALL IN"
    ].join("\n");

    const result = parseLendersFromCsvText(csvText);
    expect(result.lenders[0].bookingGuideUrl).toContain("drive.google.com/file/d/BOOKONE11");
    expect(result.lenders[1].bookingGuideUrl).toContain("drive.google.com/file/d/BOOKTWO22");
  });

  it("parses matrix-style lender guide CSV", () => {
    const csvText = [
      ",,https://www.carfinco.com/,https://www.edenparkcanada.com/",
      ",,Santander,EDEN PARK",
      "CLIENT DETAILS,900 SIN,NO,YES",
      ",DOUBLE BANKO,NO,YES",
      ",SINGLE REPO,YES,NO",
      ",NOA ON SELF EMPLOYED,1 year minimum,NO",
      ",MAX ADVANCE,130% to 165%,UP TO 140 ALBERTA BOOK 180 ALL IN"
    ].join("\n");

    const result = parseLendersFromCsvText(csvText);
    expect(result.lenders).toHaveLength(2);
    expect(result.lenders[0]).toMatchObject({
      lenderName: "Santander",
      websiteUrl: "https://www.carfinco.com/",
      allowsOpenBK: false,
      allowsRepo: true,
      allowsNewToCanada: false,
      allowsYoungBuyer: true,
      maxLTV: 165,
      serviceArea: { canadaWide: true, isDenylist: false, provinces: [], raw: "" },
      guidelineTexts: {
        openBK: "No",
        repo: "Eligible",
        selfEmployed: "1 year minimum",
        newToCanada: "Ineligible",
        youngBuyer: "",
        serviceArea: "",
        minScore: "",
        maxLTV: "130% to 165%"
      },
      repoScenario: { verdict: "eligible", detail: "" },
      newToCanadaScenario: { verdict: "ineligible", detail: "" }
    });
    expect(result.lenders[1]).toMatchObject({
      lenderName: "EDEN PARK",
      websiteUrl: "https://www.edenparkcanada.com/",
      allowsOpenBK: true,
      allowsRepo: false,
      allowsNewToCanada: true,
      allowsYoungBuyer: true,
      maxLTV: 180,
      serviceArea: { canadaWide: true, isDenylist: false, provinces: [], raw: "" },
      guidelineTexts: {
        openBK: "Yes",
        repo: "Ineligible",
        selfEmployed: "NO",
        newToCanada: "Eligible",
        youngBuyer: "",
        serviceArea: "",
        minScore: "",
        maxLTV: "UP TO 140 ALBERTA BOOK 180 ALL IN"
      },
      repoScenario: { verdict: "ineligible", detail: "" },
      newToCanadaScenario: { verdict: "eligible", detail: "" }
    });
  });

  it("uses fixed scenario labels even with messy answer text", () => {
    const csvText = [
      ",,https://alpha.example,https://beta.example",
      ",,Santander,EDEN PARK",
      "CLIENT DETAILS,900 SIN,YESW,NO",
      ",DOUBLE BANKO,NOT USUALLY,YES CASE BY CASE",
      ",SINGLE REPO,yes after 2 years,declining",
      ",NOA ON SELF EMPLOYED,1 year minimum,NO",
      ",MIN SCORE,620+,beacon 680",
      ",MAX ADVANCE,130% to 165%,up to 140 all in"
    ].join("\n");

    const result = parseLendersFromCsvText(csvText);
    expect(result.lenders).toHaveLength(2);
    expect(result.lenders[0]).toMatchObject({
      lenderName: "Santander",
      allowsNewToCanada: true,
      allowsOpenBK: false,
      allowsRepo: true,
      allowsSelfEmployed: true,
      minScore: 620,
      maxLTV: 165,
      guidelineTexts: {
        openBK: "NOT USUALLY",
        repo: "Eligible — after 2 years",
        selfEmployed: "1 year minimum",
        newToCanada: "Eligible",
        youngBuyer: "",
        serviceArea: "",
        minScore: "620+",
        maxLTV: "130% to 165%"
      },
      serviceArea: { canadaWide: true, isDenylist: false, provinces: [], raw: "" },
      repoScenario: { verdict: "eligible", detail: "after 2 years" },
      newToCanadaScenario: { verdict: "eligible", detail: "" }
    });
    expect(result.lenders[1]).toMatchObject({
      lenderName: "EDEN PARK",
      allowsNewToCanada: false,
      allowsOpenBK: true,
      allowsRepo: false,
      allowsSelfEmployed: false,
      minScore: 680,
      maxLTV: 140,
      guidelineTexts: {
        openBK: "YES CASE BY CASE",
        repo: "declining",
        selfEmployed: "NO",
        newToCanada: "Ineligible",
        youngBuyer: "",
        serviceArea: "",
        minScore: "beacon 680",
        maxLTV: "up to 140 all in"
      },
      serviceArea: { canadaWide: true, isDenylist: false, provinces: [], raw: "" },
      repoScenario: null,
      newToCanadaScenario: { verdict: "ineligible", detail: "" }
    });
  });

  it("extracts website URLs from the current published sheet shape", () => {
    const csvText = readFileSync(resolve(process.cwd(), "sample-google.csv"), "utf8");
    const result = parseLendersFromCsvText(csvText);

    expect(result.lenders.length).toBeGreaterThan(0);
    expect(result.lenders.some((lender) => lender.websiteUrl.length > 0)).toBe(true);
    expect(result.lenders.some((lender) => /^Santander$/i.test(lender.lenderName.trim()))).toBe(true);
    expect(result.lenders.some((lender) => /santander\s+go\s+plan/i.test(lender.lenderName))).toBe(true);
    expect(result.lenders.some((lender) => /rifco/i.test(lender.lenderName))).toBe(true);
  });

  it("parses Eligible/Conditional/Ineligible answer with separate reason column for DOUBLE BANKO", () => {
    const csvText = [
      ",,https://alpha.example/,https://beta.example/",
      ",,Santander,Santander,EDEN PARK,EDEN PARK",
      ",DOUBLE BANKO,Eligible,Min 12 months on file,Conditional,Rep must approve",
      ",BANKO/PROP PROGRAM,Eligible,OK,Eligible,OK",
      ",SINGLE REPO,YES,YES,YES,YES",
      ",NOA ON SELF EMPLOYED,YES,YES,YES,YES",
      ",900 SIN,YES,YES,YES,YES",
      ",MIN SCORE,600,600,600,600",
      ",MAX ADVANCE,130%,130%,130%,130%"
    ].join("\n");

    const result = parseLendersFromCsvText(csvText);
    expect(result.lenders[0].openBKScenario).toEqual({
      verdict: "eligible",
      detail: "Min 12 months on file"
    });
    expect(result.lenders[0].allowsOpenBK).toBe(true);
    expect(result.lenders[1].openBKScenario).toEqual({
      verdict: "conditional",
      detail: "Rep must approve"
    });
    expect(result.lenders[1].allowsOpenBK).toBe(true);
  });

  it("pairs answer + reason columns for DOUBLE BANKO when headers use duplicate lender or Reason", () => {
    const csvText = [
      ",,https://alpha.example/,https://beta.example/",
      ",,Santander,Santander,EDEN PARK,EDEN PARK",
      ",DOUBLE BANKO,Yes,2 years discharged,No,Not on program",
      ",BANKO/PROP PROGRAM,Yes,See rep,No,Not on program",
      ",SINGLE REPO,YES,YES,YES,YES",
      ",NOA ON SELF EMPLOYED,YES,YES,YES,YES",
      ",900 SIN,YES,YES,YES,YES",
      ",MIN SCORE,600,600,600,600",
      ",MAX ADVANCE,130%,130%,130%,130%"
    ].join("\n");

    const result = parseLendersFromCsvText(csvText);
    expect(result.lenders).toHaveLength(2);
    expect(result.lenders[0]).toMatchObject({
      lenderName: "Santander",
      allowsOpenBK: true,
      guidelineTexts: {
        openBK: "Yes — 2 years discharged"
      }
    });
    expect(result.lenders[1]).toMatchObject({
      lenderName: "EDEN PARK",
      allowsOpenBK: false,
      guidelineTexts: {
        openBK: "No — Not on program"
      }
    });
  });

  it("parses Young Buyers Client Details row like REPO / 900 SIN verdict cells", () => {
    const csvText = [
      ",,https://alpha.example,https://beta.example",
      ",,Santander,EDEN PARK",
      "CLIENT DETAILS,900 SIN,YES,YES",
      ",YOUNG BUYERS CLIENT DETAILS,Conditional — min income,Eligible",
      ",DOUBLE BANKO,YES,YES",
      ",SINGLE REPO,YES,YES",
      ",NOA ON SELF EMPLOYED,YES,YES",
      ",MIN SCORE,600,680",
      ",MAX ADVANCE,130%,140%"
    ].join("\n");

    const result = parseLendersFromCsvText(csvText);
    expect(result.lenders).toHaveLength(2);
    expect(result.lenders[0].youngBuyerScenario).toEqual({
      verdict: "conditional",
      detail: "min income"
    });
    expect(result.lenders[0].allowsYoungBuyer).toBe(true);
    expect(result.lenders[1].youngBuyerScenario).toEqual({
      verdict: "eligible",
      detail: ""
    });
    expect(result.lenders[1].allowsYoungBuyer).toBe(true);
  });

  it("parses Client details second unit row like REPO / 900 SIN verdict cells", () => {
    const csvText = [
      ",,https://alpha.example,https://beta.example",
      ",,Santander,EDEN PARK",
      "CLIENT DETAILS,900 SIN,YES,YES",
      "CLIENT DETAILS,SECOND UNIT,No,Eligible",
      ",DOUBLE BANKO,YES,YES",
      ",SINGLE REPO,YES,YES",
      ",NOA ON SELF EMPLOYED,YES,YES",
      ",MIN SCORE,600,680",
      ",MAX ADVANCE,130%,140%"
    ].join("\n");

    const result = parseLendersFromCsvText(csvText);
    expect(result.lenders).toHaveLength(2);
    expect(result.lenders[0].allowsSecondUnit).toBe(false);
    expect(result.lenders[0].secondUnitScenario?.verdict).toBe("ineligible");
    expect(result.lenders[1].allowsSecondUnit).toBe(true);
    expect(result.lenders[1].secondUnitScenario?.verdict).toBe("eligible");
  });

  it("parses Lender details native status row like second unit / REPO verdict cells", () => {
    const csvText = [
      ",,https://alpha.example,https://beta.example",
      ",,Santander,EDEN PARK",
      "CLIENT DETAILS,900 SIN,YES,YES",
      "LENDER DETAILS,NATIVE STATUS,No,Eligible",
      ",DOUBLE BANKO,YES,YES",
      ",SINGLE REPO,YES,YES",
      ",NOA ON SELF EMPLOYED,YES,YES",
      ",MIN SCORE,600,680",
      ",MAX ADVANCE,130%,140%"
    ].join("\n");

    const result = parseLendersFromCsvText(csvText);
    expect(result.lenders).toHaveLength(2);
    expect(result.lenders[0].allowsNativeStatus).toBe(false);
    expect(result.lenders[0].nativeStatusScenario?.verdict).toBe("ineligible");
    expect(result.lenders[1].allowsNativeStatus).toBe(true);
    expect(result.lenders[1].nativeStatusScenario?.verdict).toBe("eligible");
  });

  it("parses job tenure and income program rows from matrix CSV", () => {
    const csvText = [
      ",,https://alpha.example,https://beta.example",
      ",,Santander,EDEN PARK",
      ",MIN JOB TENURE MO,12,24",
      ",2 JOB,NO,YES",
      ",DISABILITY (AISH/ODSP),NO,YES",
      ",CHILD TAX,YES,YES",
      "CLIENT DETAILS,900 SIN,YES,YES",
      ",DOUBLE BANKO,YES,YES",
      ",SINGLE REPO,YES,YES",
      ",NOA ON SELF EMPLOYED,YES,YES",
      ",MIN SCORE,600,680",
      ",MAX ADVANCE,130%,140%"
    ].join("\n");

    const result = parseLendersFromCsvText(csvText);
    expect(result.lenders).toHaveLength(2);
    expect(result.lenders[0].minJobTenureMonths).toBe(12);
    expect(result.lenders[0].minAddressTenureMonths).toBeNull();
    expect(result.lenders[0].hasShortJobTenureTwoJobsMatrixRow).toBe(true);
    expect(result.lenders[0].allowsShortJobTenureTwoJobs).toBe(false);
    expect(result.lenders[0].allowsDisabilityProgramIncome).toBe(false);
    expect(result.lenders[0].allowsAishIncome).toBe(false);
    expect(result.lenders[0].allowsDisabilityIncome).toBe(false);
    expect(result.lenders[0].allowsChildTaxIncome).toBe(true);
    expect(result.lenders[1].minJobTenureMonths).toBe(24);
    expect(result.lenders[1].minAddressTenureMonths).toBeNull();
    expect(result.lenders[1].hasShortJobTenureTwoJobsMatrixRow).toBe(true);
    expect(result.lenders[1].allowsShortJobTenureTwoJobs).toBe(true);
    expect(result.lenders[1].allowsDisabilityProgramIncome).toBe(true);
    expect(result.lenders[1].allowsAishIncome).toBe(true);
    expect(result.lenders[1].allowsDisabilityIncome).toBe(true);
    expect(result.lenders[1].allowsChildTaxIncome).toBe(true);
  });

  it("parses 2 JOB row (under 2 months tenure path) with Eligible / Conditional verdicts", () => {
    const csvText = [
      ",,https://alpha.example,https://beta.example",
      ",,Santander,EDEN PARK",
      ",2 JOB,Conditional — second job 6+ months,Eligible",
      "CLIENT DETAILS,900 SIN,YES,YES",
      ",DOUBLE BANKO,YES,YES",
      ",SINGLE REPO,YES,YES",
      ",NOA ON SELF EMPLOYED,YES,YES",
      ",MIN SCORE,600,680",
      ",MAX ADVANCE,130%,140%"
    ].join("\n");

    const result = parseLendersFromCsvText(csvText);
    expect(result.lenders).toHaveLength(2);
    expect(result.lenders[0].shortJobTenureTwoJobsScenario).toEqual({
      verdict: "conditional",
      detail: "second job 6+ months"
    });
    expect(result.lenders[0].hasShortJobTenureTwoJobsMatrixRow).toBe(true);
    expect(result.lenders[0].allowsShortJobTenureTwoJobs).toBe(true);
    expect(result.lenders[1].hasShortJobTenureTwoJobsMatrixRow).toBe(true);
    expect(result.lenders[1].shortJobTenureTwoJobsScenario?.verdict).toBe("eligible");
    expect(result.lenders[1].allowsShortJobTenureTwoJobs).toBe(true);
  });

  it("parses DISABILITY (AISH/ODSP) combined row verdict into incomeDisabilityProgramScenario", () => {
    const csvText = [
      ",,https://alpha.example,https://beta.example",
      ",,Santander,EDEN PARK",
      ",DISABILITY (AISH/ODSP),Conditional — 2 years on file,Eligible",
      "CLIENT DETAILS,900 SIN,YES,YES",
      ",DOUBLE BANKO,YES,YES",
      ",SINGLE REPO,YES,YES",
      ",NOA ON SELF EMPLOYED,YES,YES",
      ",MIN SCORE,600,680",
      ",MAX ADVANCE,130%,140%"
    ].join("\n");

    const result = parseLendersFromCsvText(csvText);
    expect(result.lenders).toHaveLength(2);
    expect(result.lenders[0].incomeDisabilityProgramScenario).toEqual({
      verdict: "conditional",
      detail: "2 years on file"
    });
    expect(result.lenders[0].allowsDisabilityProgramIncome).toBe(true);
    expect(result.lenders[1].incomeDisabilityProgramScenario?.verdict).toBe("eligible");
    expect(result.lenders[1].allowsDisabilityProgramIncome).toBe(true);
  });

  it("parses Child Tax / CCB row Eligible / Conditional verdicts into incomeChildTaxScenario", () => {
    const csvText = [
      ",,https://alpha.example,https://beta.example",
      ",,Santander,EDEN PARK",
      ",CHILD TAX,Conditional — must file 2 years,Eligible",
      "CLIENT DETAILS,900 SIN,YES,YES",
      ",DOUBLE BANKO,YES,YES",
      ",SINGLE REPO,YES,YES",
      ",NOA ON SELF EMPLOYED,YES,YES",
      ",MIN SCORE,600,680",
      ",MAX ADVANCE,130%,140%"
    ].join("\n");

    const result = parseLendersFromCsvText(csvText);
    expect(result.lenders).toHaveLength(2);
    expect(result.lenders[0].incomeChildTaxScenario).toEqual({
      verdict: "conditional",
      detail: "must file 2 years"
    });
    expect(result.lenders[0].allowsChildTaxIncome).toBe(true);
    expect(result.lenders[1].incomeChildTaxScenario?.verdict).toBe("eligible");
    expect(result.lenders[1].allowsChildTaxIncome).toBe(true);
  });

  it("parses Lender details MAX & MIN PYMNT row into minPaymentCad and maxPaymentCad", () => {
    const csvText = [
      ",,https://alpha.example,https://beta.example",
      ",,Santander,EDEN PARK",
      "LENDER DETAILS,MAX & MIN PYMNT,$250 min Tier 2 $650 Tier 3 $700,$325 to $600",
      "CLIENT DETAILS,900 SIN,YES,YES",
      ",DOUBLE BANKO,YES,YES",
      ",SINGLE REPO,YES,YES",
      ",NOA ON SELF EMPLOYED,YES,YES",
      ",MIN SCORE,600,680",
      ",MAX ADVANCE,130%,140%"
    ].join("\n");

    const result = parseLendersFromCsvText(csvText);
    expect(result.lenders).toHaveLength(2);
    expect(result.lenders[0].minPaymentCad).toBe(250);
    expect(result.lenders[0].maxPaymentCad).toBe(700);
    expect(result.lenders[1].minPaymentCad).toBe(325);
    expect(result.lenders[1].maxPaymentCad).toBe(600);
    expect(result.lenders[0].guidelineTexts.minPayment).toContain("$250");
    expect(result.lenders[1].guidelineTexts.maxPayment).toContain("600");
  });

  it("parses Deal build MIN INCOME row from matrix CSV", () => {
    const csvText = [
      ",,https://alpha.example,https://beta.example",
      ",,Santander,EDEN PARK",
      "DEAL BUILD,MIN INCOME,$2500 min,$1800/mo",
      "CLIENT DETAILS,900 SIN,YES,YES",
      ",DOUBLE BANKO,YES,YES",
      ",SINGLE REPO,YES,YES",
      ",NOA ON SELF EMPLOYED,YES,YES",
      ",MIN SCORE,600,680",
      ",MAX ADVANCE,130%,140%"
    ].join("\n");

    const result = parseLendersFromCsvText(csvText);
    expect(result.lenders).toHaveLength(2);
    expect(result.lenders[0].minIncomeCad).toBe(2500);
    expect(result.lenders[1].minIncomeCad).toBe(1800);
    expect(result.lenders[0].guidelineTexts.minIncome).toContain("2500");
  });

  it("treats Source One and TCL DOUBLE BANKO / BANKO-PROP cells as double-bankruptcy friendly like the sheet", () => {
    const csvText = readFileSync(resolve(process.cwd(), "sample-google.csv"), "utf8");
    const result = parseLendersFromCsvText(csvText);

    const sourceOne = result.lenders.find((l) => /source\s*one/i.test(l.lenderName));
    const tcl = result.lenders.find((l) => /\btcl\b/i.test(l.lenderName));

    expect(sourceOne?.allowsOpenBK).toBe(true);
    expect(tcl?.allowsOpenBK).toBe(true);
  });
});