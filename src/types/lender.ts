export type CustomerSituation = "openBK" | "repo" | "selfEmployed" | "newToCanada";

/** Booking-sheet answer when a row uses explicit status labels (separate reason column or tail in same cell). */
export type EligibilityVerdict = "eligible" | "conditional" | "ineligible";

export interface ScenarioVerdict {
  verdict: EligibilityVerdict;
  /** From the reason column, or text after the verdict in the answer cell. */
  detail: string;
}

/** Row text from the booking matrix (same cells used to derive booleans/numbers). Cards show this so copy can be edited in the sheet. */
export interface LenderGuidelineTexts {
  openBK: string;
  repo: string;
  selfEmployed: string;
  /** 900 SIN / New to Canada row */
  newToCanada: string;
  minScore: string;
  maxLTV: string;
}

export interface Lender {
  lenderName: string;
  websiteUrl: string;
  minScore: number;
  maxLTV: number;
  allowsOpenBK: boolean;
  allowsRepo: boolean;
  allowsSelfEmployed: boolean;
  allowsNewToCanada: boolean;
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
  /** Shown when outcome is eligible — why this lender passes active positive checks. */
  eligibleReasons: string[];
  /** Shown when outcome is conditional — stips / sheet detail for active conditional scenarios. */
  conditionalReasons: string[];
}

export interface ParseResult {
  lenders: Lender[];
  skippedRows: number;
}