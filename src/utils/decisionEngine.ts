import type { EvaluatedLender, FilterState, Lender, LenderGuidelineTexts } from "../types/lender";
import { getAgeFromIsoDate, isYoungBuyerAge } from "./customerAge";
import { provinceMatchesServiceArea } from "./serviceArea";
import { customerTenureTotalMonths } from "./tenureMonths";

/** Single customer filter for the matrix 900 SIN / New to Canada row. */
const NINE_SIN_NEW_TO_CANADA_LABEL = "9 SIN / New to Canada";

/** Stated job tenure under this (months) uses the matrix “2 JOB” row; at or above uses min job tenure only. */
const JOB_TENURE_UNDER_TWO_MONTHS = 2;

const UNDER_TWO_MO_TWO_JOB_LABEL = "Under 2 months on job (2+ jobs)";

function pickGuideline(lender: Lender, key: keyof LenderGuidelineTexts): string | null {
  const raw = lender.guidelineTexts[key]?.trim();
  return raw ? raw : null;
}

function pushReason(list: string[], sheetText: string | null, fallback: string): void {
  const text = (sheetText && sheetText.trim() ? sheetText.trim() : fallback).trim();
  if (text && !list.includes(text)) {
    list.push(text);
  }
}

function pushSituationReason(
  list: string[],
  label: string,
  sheetText: string | null,
  fallback: string
): void {
  const base = (sheetText && sheetText.trim() ? stripLeadingSheetVerdict(sheetText) : fallback).trim();
  const line = `${label}: ${base}`;
  if (base && !list.includes(line)) {
    list.push(line);
  }
}

/**
 * Removes leading sheet verdict tokens (Eligible/Conditional/Ineligible, YES/NO, etc.)
 * so cards show only the substantive stipulation text.
 */
export function stripLeadingSheetVerdict(text: string): string {
  let s = text.trim();
  let prev: string;
  do {
    prev = s;
    s = s
      .replace(/^(eligible|conditional|ineligible)\b\s*[|.:;—\-–]\s*/i, "")
      .replace(/^(eligible|conditional|ineligible)\b\s+(?=\()/i, "")
      .replace(/^(yesw?|no|nope)\b\s*[|.:;—\-–]\s*/i, "")
      .replace(/^(yesw?|no|nope)\b\s+(?=\()/i, "")
      .trim();
  } while (s !== prev);
  return s;
}

function youngBuyerContextActive(filters: FilterState): boolean {
  return isYoungBuyerAge(getAgeFromIsoDate(filters.dateOfBirth));
}

function provinceFilterMeta(
  lender: Lender,
  filters: FilterState
): Pick<EvaluatedLender, "selectedProvinceCode" | "servicesSelectedProvince"> {
  const code = filters.province.trim().toUpperCase();
  if (!code) {
    return { selectedProvinceCode: null, servicesSelectedProvince: null };
  }
  return {
    selectedProvinceCode: code,
    servicesSelectedProvince: provinceMatchesServiceArea(lender.serviceArea, code)
  };
}

function buildConditionalReasons(lender: Lender, filters: FilterState): string[] {
  const reasons: string[] = [];

  if (filters.openBK && lender.allowsOpenBK && lender.openBKScenario?.verdict === "conditional") {
    const stripped = stripLeadingSheetVerdict(lender.openBKScenario.detail.trim());
    if (stripped) {
      reasons.push(`Double Bankruptcy: ${stripped}`);
    }
  }

  if (filters.repo && lender.allowsRepo && lender.repoScenario?.verdict === "conditional") {
    const stripped = stripLeadingSheetVerdict(lender.repoScenario.detail.trim());
    if (stripped) {
      reasons.push(`Repo: ${stripped}`);
    }
  }

  if (
    filters.nineSinNewToCanada &&
    lender.allowsNewToCanada &&
    lender.newToCanadaScenario?.verdict === "conditional"
  ) {
    const stripped = stripLeadingSheetVerdict(lender.newToCanadaScenario.detail.trim());
    if (stripped) {
      reasons.push(`${NINE_SIN_NEW_TO_CANADA_LABEL}: ${stripped}`);
    }
  }

  if (
    youngBuyerContextActive(filters) &&
    lender.allowsYoungBuyer &&
    lender.youngBuyerScenario?.verdict === "conditional"
  ) {
    const stripped = stripLeadingSheetVerdict(lender.youngBuyerScenario.detail.trim());
    if (stripped) {
      reasons.push(`Young buyer: ${stripped}`);
    }
  }

  if (
    filters.secondUnit &&
    lender.allowsSecondUnit &&
    lender.secondUnitScenario?.verdict === "conditional"
  ) {
    const stripped = stripLeadingSheetVerdict(lender.secondUnitScenario.detail.trim());
    if (stripped) {
      reasons.push(`Second unit: ${stripped}`);
    }
  }

  if (
    filters.nativeStatus &&
    lender.allowsNativeStatus &&
    lender.nativeStatusScenario?.verdict === "conditional"
  ) {
    const stripped = stripLeadingSheetVerdict(lender.nativeStatusScenario.detail.trim());
    if (stripped) {
      reasons.push(`Native status: ${stripped}`);
    }
  }

  if (
    filters.incomeProgram === "disability_benefit" &&
    lender.allowsDisabilityProgramIncome &&
    lender.incomeDisabilityProgramScenario?.verdict === "conditional"
  ) {
    const stripped = stripLeadingSheetVerdict(
      lender.incomeDisabilityProgramScenario.detail.trim()
    );
    if (stripped) {
      reasons.push(`Disability (AISH/ODSP): ${stripped}`);
    }
  }

  if (
    filters.incomeProgram === "child_tax" &&
    lender.allowsChildTaxIncome &&
    lender.incomeChildTaxScenario?.verdict === "conditional"
  ) {
    const stripped = stripLeadingSheetVerdict(lender.incomeChildTaxScenario.detail.trim());
    if (stripped) {
      reasons.push(`Child tax / CCB income: ${stripped}`);
    }
  }

  const jobMo = customerTenureTotalMonths(filters.jobTenureYears, filters.jobTenureMonths);
  if (
    jobMo != null &&
    jobMo < JOB_TENURE_UNDER_TWO_MONTHS &&
    lender.hasShortJobTenureTwoJobsMatrixRow &&
    lender.allowsShortJobTenureTwoJobs &&
    lender.shortJobTenureTwoJobsScenario?.verdict === "conditional"
  ) {
    const stripped = stripLeadingSheetVerdict(
      lender.shortJobTenureTwoJobsScenario.detail.trim()
    );
    if (stripped) {
      reasons.push(`${UNDER_TWO_MO_TWO_JOB_LABEL}: ${stripped}`);
    }
  }

  return reasons;
}

/**
 * When overall outcome is conditional, list selected customer situations that are still
 * clearly accepted (eligible / flat allow), so cards can show green lines under yellow stips.
 */
function buildEligibleSituationHighlights(lender: Lender, filters: FilterState): string[] {
  const lines: string[] = [];

  if (
    filters.openBK &&
    lender.allowsOpenBK &&
    lender.openBKScenario?.verdict !== "conditional" &&
    lender.openBKScenario?.verdict !== "ineligible"
  ) {
    lines.push("Double Bankruptcy is accepted");
  }

  if (
    filters.repo &&
    lender.allowsRepo &&
    lender.repoScenario?.verdict !== "conditional" &&
    lender.repoScenario?.verdict !== "ineligible"
  ) {
    lines.push("Repo is accepted");
  }

  if (filters.selfEmployed && lender.allowsSelfEmployed) {
    lines.push("Self-employed is accepted");
  }

  if (
    filters.nineSinNewToCanada &&
    lender.allowsNewToCanada &&
    lender.newToCanadaScenario?.verdict !== "conditional" &&
    lender.newToCanadaScenario?.verdict !== "ineligible"
  ) {
    lines.push(`${NINE_SIN_NEW_TO_CANADA_LABEL} is accepted`);
  }

  if (
    youngBuyerContextActive(filters) &&
    lender.allowsYoungBuyer &&
    lender.youngBuyerScenario?.verdict !== "conditional" &&
    lender.youngBuyerScenario?.verdict !== "ineligible"
  ) {
    lines.push("Young buyer is accepted");
  }

  if (
    filters.secondUnit &&
    lender.allowsSecondUnit &&
    lender.secondUnitScenario?.verdict !== "conditional" &&
    lender.secondUnitScenario?.verdict !== "ineligible"
  ) {
    lines.push("Second unit is accepted");
  }

  if (
    filters.nativeStatus &&
    lender.allowsNativeStatus &&
    lender.nativeStatusScenario?.verdict !== "conditional" &&
    lender.nativeStatusScenario?.verdict !== "ineligible"
  ) {
    lines.push("Native status is accepted");
  }

  if (
    filters.incomeProgram === "disability_benefit" &&
    lender.allowsDisabilityProgramIncome &&
    lender.incomeDisabilityProgramScenario?.verdict !== "conditional" &&
    lender.incomeDisabilityProgramScenario?.verdict !== "ineligible"
  ) {
    lines.push("Disability (AISH/ODSP) income is accepted");
  }

  if (
    filters.incomeProgram === "child_tax" &&
    lender.allowsChildTaxIncome &&
    lender.incomeChildTaxScenario?.verdict !== "conditional" &&
    lender.incomeChildTaxScenario?.verdict !== "ineligible"
  ) {
    lines.push("Child tax / CCB income is accepted");
  }

  const jobMoHi = customerTenureTotalMonths(filters.jobTenureYears, filters.jobTenureMonths);
  if (
    jobMoHi != null &&
    jobMoHi < JOB_TENURE_UNDER_TWO_MONTHS &&
    lender.hasShortJobTenureTwoJobsMatrixRow &&
    lender.shortJobTenureTwoJobsScenario != null &&
    lender.allowsShortJobTenureTwoJobs &&
    lender.shortJobTenureTwoJobsScenario.verdict !== "conditional" &&
    lender.shortJobTenureTwoJobsScenario.verdict !== "ineligible"
  ) {
    lines.push(`${UNDER_TWO_MO_TWO_JOB_LABEL} is accepted`);
  }

  return lines;
}

function evaluateOne(lender: Lender, filters: FilterState): EvaluatedLender {
  const provinceMeta = provinceFilterMeta(lender, filters);
  const declineReasons: string[] = [];

  if (filters.openBK && !lender.allowsOpenBK) {
    pushSituationReason(
      declineReasons,
      "Double Bankruptcy",
      pickGuideline(lender, "openBK"),
      "Double Bankruptcy not accepted"
    );
  }
  if (filters.repo && !lender.allowsRepo) {
    pushSituationReason(declineReasons, "Repo", pickGuideline(lender, "repo"), "Repo not accepted");
  }
  if (filters.selfEmployed && !lender.allowsSelfEmployed) {
    pushSituationReason(
      declineReasons,
      "Self-Employed",
      pickGuideline(lender, "selfEmployed"),
      "Self-employed not accepted"
    );
  }
  if (filters.nineSinNewToCanada && !lender.allowsNewToCanada) {
    pushSituationReason(
      declineReasons,
      NINE_SIN_NEW_TO_CANADA_LABEL,
      pickGuideline(lender, "newToCanada"),
      `${NINE_SIN_NEW_TO_CANADA_LABEL} not accepted`
    );
  }
  if (filters.secondUnit && !lender.allowsSecondUnit) {
    pushSituationReason(
      declineReasons,
      "Second unit",
      pickGuideline(lender, "secondUnit"),
      "Second unit not accepted"
    );
  }
  if (filters.nativeStatus && !lender.allowsNativeStatus) {
    pushSituationReason(
      declineReasons,
      "Native status",
      pickGuideline(lender, "nativeStatus"),
      "Native status not accepted"
    );
  }
  if (provinceMeta.selectedProvinceCode && provinceMeta.servicesSelectedProvince === false) {
    pushSituationReason(
      declineReasons,
      "Service area",
      pickGuideline(lender, "serviceArea"),
      `${provinceMeta.selectedProvinceCode} not in lender service area`
    );
  }
  if (youngBuyerContextActive(filters) && !lender.allowsYoungBuyer) {
    pushSituationReason(
      declineReasons,
      "Young buyer",
      pickGuideline(lender, "youngBuyer"),
      "Young buyers not accepted"
    );
  }

  const jobMonths = customerTenureTotalMonths(filters.jobTenureYears, filters.jobTenureMonths);
  const jobTenureUnderTwoMonths =
    jobMonths != null && jobMonths < JOB_TENURE_UNDER_TWO_MONTHS;

  if (jobTenureUnderTwoMonths) {
    if (lender.hasShortJobTenureTwoJobsMatrixRow) {
      if (!lender.allowsShortJobTenureTwoJobs) {
        pushSituationReason(
          declineReasons,
          UNDER_TWO_MO_TWO_JOB_LABEL,
          pickGuideline(lender, "shortJobTenureTwoJobs"),
          "Not accepted on 2+ jobs path when tenure under 2 months"
        );
      }
    } else if (
      lender.minJobTenureMonths != null &&
      jobMonths != null &&
      jobMonths < lender.minJobTenureMonths
    ) {
      pushSituationReason(
        declineReasons,
        "Job tenure",
        pickGuideline(lender, "jobTenure"),
        `Minimum job tenure ${lender.minJobTenureMonths} months`
      );
    }
  } else if (
    lender.minJobTenureMonths != null &&
    jobMonths != null &&
    jobMonths < lender.minJobTenureMonths
  ) {
    pushSituationReason(
      declineReasons,
      "Job tenure",
      pickGuideline(lender, "jobTenure"),
      `Minimum job tenure ${lender.minJobTenureMonths} months`
    );
  }

  if (filters.incomeProgram === "disability_benefit" && !lender.allowsDisabilityProgramIncome) {
    const disabilityProgramGuideline =
      pickGuideline(lender, "incomeDisabilityProgram") ??
      pickGuideline(lender, "incomeDisability") ??
      pickGuideline(lender, "incomeAish");
    pushSituationReason(
      declineReasons,
      "Disability (AISH/ODSP)",
      disabilityProgramGuideline,
      "Disability (AISH/ODSP) primary income not accepted"
    );
  }
  if (filters.incomeProgram === "child_tax" && !lender.allowsChildTaxIncome) {
    pushSituationReason(
      declineReasons,
      "Child tax / CCB income",
      pickGuideline(lender, "incomeChildTax"),
      "Child tax / CCB primary income not accepted"
    );
  }

  if (
    filters.incomeAmountCad !== null &&
    lender.minIncomeCad !== null &&
    filters.incomeAmountCad < lender.minIncomeCad
  ) {
    pushSituationReason(
      declineReasons,
      "Minimum income",
      pickGuideline(lender, "minIncome"),
      `Income below lender minimum (~$${lender.minIncomeCad}/mo from sheet)`
    );
  }

  if (filters.creditScore !== null && filters.creditScore < lender.minScore) {
    pushReason(
      declineReasons,
      pickGuideline(lender, "minScore"),
      `Credit score below ${lender.minScore}`
    );
  }
  if (filters.ltv !== null && filters.ltv > lender.maxLTV) {
    pushReason(declineReasons, pickGuideline(lender, "maxLTV"), `LTV exceeds ${lender.maxLTV}`);
  }

  const declineDisplay = [...declineReasons];

  if (declineDisplay.length > 0) {
    return {
      lender,
      outcome: "ineligible",
      declineReasons: declineDisplay,
      eligibleReasons: [],
      conditionalReasons: [],
      ...provinceMeta
    };
  }

  const conditionalReasons = buildConditionalReasons(lender, filters);
  if (conditionalReasons.length > 0) {
    return {
      lender,
      outcome: "conditional",
      declineReasons: [],
      eligibleReasons: buildEligibleSituationHighlights(lender, filters),
      conditionalReasons,
      ...provinceMeta
    };
  }

  return {
    lender,
    outcome: "eligible",
    declineReasons: [],
    eligibleReasons: [],
    conditionalReasons: [],
    ...provinceMeta
  };
}

export function evaluateLenders(lenders: Lender[], filters: FilterState): EvaluatedLender[] {
  return lenders.map((lender) => evaluateOne(lender, filters));
}
