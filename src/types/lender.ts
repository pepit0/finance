export type CustomerSituation = "openBK" | "repo" | "selfEmployed" | "newToCanada";

/** Booking-sheet answer when a row uses explicit status labels (separate reason column or tail in same cell). */
export type EligibilityVerdict = "eligible" | "conditional" | "ineligible";

export interface ScenarioVerdict {
  verdict: EligibilityVerdict;
  /** From the reason column, or text after the verdict in the answer cell. */
  detail: string;
}

/** Parsed matrix “Service area” row (Canada-wide, allowlist, or denylist). */
export interface ServiceAreaInfo {
  canadaWide: boolean;
  /** When `canadaWide` is false: `provinces` is either allowed or excluded codes. */
  isDenylist: boolean;
  /** Uppercase two-letter codes (empty when canadaWide). */
  provinces: string[];
  /** Raw cell text for decline / guideline display. */
  raw: string;
}

/** Row text from the booking matrix (same cells used to derive booleans/numbers). Cards show this so copy can be edited in the sheet. */
export interface LenderGuidelineTexts {
  openBK: string;
  repo: string;
  selfEmployed: string;
  /** 900 SIN / New to Canada row */
  newToCanada: string;
  /** Young buyers / client age row (matrix), when customer DOB is under 24 */
  youngBuyer: string;
  /** Service area / provinces row */
  serviceArea: string;
  minScore: string;
  maxLTV: string;
}

export interface Lender {
  lenderName: string;
  websiteUrl: string;
  /**
   * Optional vehicle booking guide PDF URL (e.g. public Google Drive link from the sheet).
   * When empty, the UI may fall back to a static file map in `src/data/lenderBookingGuides.ts`.
   */
  bookingGuideUrl: string;
  minScore: number;
  maxLTV: number;
  allowsOpenBK: boolean;
  allowsRepo: boolean;
  allowsSelfEmployed: boolean;
  allowsNewToCanada: boolean;
  /** When customer is under 24 (from DOB); matrix “young buyers” row. */
  allowsYoungBuyer: boolean;
  notes: string;
  guidelineTexts: LenderGuidelineTexts;
  /**
   * When DOUBLE BANKO (or BANKO/PROP) uses Eligible / Conditional / Ineligible in the answer cell.
   * Omitted for flat CSV or legacy free-text cells.
   */
  openBKScenario?: ScenarioVerdict | null;
  /**
   * When SINGLE REPO uses verdict labels / YES/NO/CONDITIONAL text in the answer cell.
   * Omitted for flat CSV or legacy free-text cells.
   */
  repoScenario?: ScenarioVerdict | null;
  /**
   * When the 900 SIN / New to Canada matrix row uses verdict labels, YES/NO/CONDITIONAL, or "Yes but …" heuristics.
   * Omitted for flat CSV or legacy free-text cells.
   */
  newToCanadaScenario?: ScenarioVerdict | null;
  /**
   * When the young buyers row uses the same Eligible / Conditional / Ineligible layout as REPO / 900 SIN.
   */
  youngBuyerScenario?: ScenarioVerdict | null;
  /** Matrix service-area row: Canada-wide, provinces served, or provinces not served. */
  serviceArea: ServiceAreaInfo;
}

export interface FilterState {
  openBK: boolean;
  repo: boolean;
  selfEmployed: boolean;
  newToCanada: boolean;
  hasNineSin: boolean;
  dateOfBirth: string;
  province: string;
  creditScore: number | null;
  ltv: number | null;
}

export interface EvaluatedLender {
  lender: Lender;
  /** Tri-state result after applying filters (ineligible = hard decline). */
  outcome: EligibilityVerdict;
  declineReasons: string[];
  /**
   * When outcome is conditional and multiple customer situations are selected, each line
   * calls out a situation that is still accepted (e.g. "Repo is accepted" under Open BK stips).
   */
  eligibleReasons: string[];
  /** Shown when outcome is conditional — stips / sheet detail for active conditional scenarios. */
  conditionalReasons: string[];
  /** When customer selects a province: two-letter code echoed on the card, or null if none. */
  selectedProvinceCode: string | null;
  /** Whether that province is within the lender’s service area; null if province not selected. */
  servicesSelectedProvince: boolean | null;
}

export interface ParseResult {
  lenders: Lender[];
  skippedRows: number;
}