import type { EvaluatedLender, FilterState, Lender, LenderGuidelineTexts } from "../types/lender";

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

function buildConditionalReasons(lender: Lender, filters: FilterState): string[] {
  const reasons: string[] = [];

  if (filters.openBK && lender.allowsOpenBK && lender.openBKScenario?.verdict === "conditional") {
    const stripped = stripLeadingSheetVerdict(lender.openBKScenario.detail.trim());
    if (stripped) {
      reasons.push(`Open BK: ${stripped}`);
    }
  }

  if (filters.repo && lender.allowsRepo && lender.repoScenario?.verdict === "conditional") {
    const stripped = stripLeadingSheetVerdict(lender.repoScenario.detail.trim());
    if (stripped) {
      reasons.push(`Repo: ${stripped}`);
    }
  }

  if (
    (filters.newToCanada || filters.hasNineSin) &&
    lender.allowsNewToCanada &&
    lender.newToCanadaScenario?.verdict === "conditional"
  ) {
    const stripped = stripLeadingSheetVerdict(lender.newToCanadaScenario.detail.trim());
    if (stripped) {
      const prefix =
        filters.hasNineSin && !filters.newToCanada
          ? "9 SIN"
          : filters.newToCanada && !filters.hasNineSin
            ? "New to Canada"
            : "9 SIN / New to Canada";
      reasons.push(`${prefix}: ${stripped}`);
    }
  }

  return reasons;
}

function evaluateOne(lender: Lender, filters: FilterState): EvaluatedLender {
  const declineReasons: string[] = [];

  if (filters.openBK && !lender.allowsOpenBK) {
    pushSituationReason(
      declineReasons,
      "Open BK",
      pickGuideline(lender, "openBK"),
      "Open BK not accepted"
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
  if (filters.newToCanada && !lender.allowsNewToCanada) {
    pushSituationReason(
      declineReasons,
      "New to Canada",
      pickGuideline(lender, "newToCanada"),
      "New to Canada not accepted"
    );
  }
  if (filters.hasNineSin && !lender.allowsNewToCanada) {
    pushSituationReason(
      declineReasons,
      "9 SIN",
      pickGuideline(lender, "newToCanada"),
      "9 SIN not accepted"
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
      conditionalReasons: []
    };
  }

  const conditionalReasons = buildConditionalReasons(lender, filters);
  if (conditionalReasons.length > 0) {
    return {
      lender,
      outcome: "conditional",
      declineReasons: [],
      eligibleReasons: [],
      conditionalReasons
    };
  }

  return {
    lender,
    outcome: "eligible",
    declineReasons: [],
    eligibleReasons: [],
    conditionalReasons: []
  };
}

export function evaluateLenders(lenders: Lender[], filters: FilterState): EvaluatedLender[] {
  return lenders.map((lender) => evaluateOne(lender, filters));
}
