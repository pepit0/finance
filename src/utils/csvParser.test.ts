import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  parseEligibilityVerdictFromAnswer,
  parseLenderRows,
  parseLendersFromCsvText,
  parseSheetAnswerReasonCell,
  resolveRepoFromRow,
  resolveNewToCanadaFromRow
} from "./csvParser";

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
      notes: "POI required",
      guidelineTexts: {
        openBK: "",
        repo: "",
        selfEmployed: "",
        newToCanada: "",
        youngBuyer: "",
        serviceArea: "",
        minScore: "",
        maxLTV: ""
      },
      openBKScenario: null,
      newToCanadaScenario: null,
      youngBuyerScenario: null,
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

  it("treats Source One and TCL DOUBLE BANKO / BANKO-PROP cells as open-BK friendly like the sheet", () => {
    const csvText = readFileSync(resolve(process.cwd(), "sample-google.csv"), "utf8");
    const result = parseLendersFromCsvText(csvText);

    const sourceOne = result.lenders.find((l) => /source\s*one/i.test(l.lenderName));
    const tcl = result.lenders.find((l) => /\btcl\b/i.test(l.lenderName));

    expect(sourceOne?.allowsOpenBK).toBe(true);
    expect(tcl?.allowsOpenBK).toBe(true);
  });
});