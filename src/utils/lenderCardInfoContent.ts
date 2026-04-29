import type { FilterState, Lender } from "../types/lender";
import { getAgeFromIsoDate, isYoungBuyerAge } from "./customerAge";

/** Shown when `guidelineTexts.incomeWaive` is empty. */
export const INCOME_WAIVE_PLACEHOLDER =
  "Details will appear here once added to the spreadsheet.";

const CAD = new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 });

export type SituationInfoLine = { title: string; body: string };

export function formatPaymentCad(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return "—";
  }
  return CAD.format(value);
}

/**
 * Info popover: only NOA / self-employed sheet row when that filter is selected
 * (other customer situations are intentionally omitted from this panel).
 */
export function buildSituationInfoLines(filters: FilterState, lender: Lender): SituationInfoLine[] {
  if (!filters.selfEmployed) {
    return [];
  }

  const raw = lender.guidelineTexts.selfEmployed.trim();
  return [
    {
      title: "NOA / self-employed",
      body: raw ? raw : "No extra detail in sheet."
    }
  ];
}

export function incomeWaiveDisplayText(lender: Lender): string {
  const t = lender.guidelineTexts.incomeWaive.trim();
  return t ? t : INCOME_WAIVE_PLACEHOLDER;
}

/** Info popover: Deal build minimum gross monthly income when parsable, else raw sheet cell, else em dash. */
export function minIncomeDisplayText(lender: Lender): string {
  const n = lender.minIncomeCad;
  if (n != null && Number.isFinite(n)) {
    return CAD.format(n);
  }
  const raw = lender.guidelineTexts.minIncome.trim();
  return raw ? raw : "—";
}

/** Used by tests; young-buyer logic is not shown on the lender info popover. */
export function youngBuyerActiveFromFilters(filters: FilterState, referenceDate = new Date()): boolean {
  return isYoungBuyerAge(getAgeFromIsoDate(filters.dateOfBirth, referenceDate));
}
