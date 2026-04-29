export type CustomerSituation = "openBK" | "repo" | "selfEmployed" | "nineSinNewToCanada";

/** Primary income type selected in filters (single choice). Empty string = employment / salary. */
export type IncomeProgramFilter =
  | ""
  /** AISH / ODSP / CPP disability–style primary income (matrix “DISABILITY (AISH/ODSP)” row). */
  | "disability_benefit"
  | "child_tax"
  | "other";

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
  /** Second unit (often under Client details in the matrix) */
  secondUnit: string;
  /** Native status (often under Lender details in the matrix) */
  nativeStatus: string;
  /** Young buyers / client age row (matrix), when customer DOB is under 24 */
  youngBuyer: string;
  /** Service area / provinces row */
  serviceArea: string;
  minScore: string;
  maxLTV: string;
  /** Min job tenure row copy (matrix / flat). */
  jobTenure: string;
  /** Matrix “2 job” / second-job row when tenure on current job is under 2 months. */
  shortJobTenureTwoJobs: string;
  /** Min address tenure row copy. */
  addressTenure: string;
  /** AISH / similar program income row copy (legacy matrix / flat CSV). */
  incomeAish: string;
  /** Disability benefits income row copy (legacy matrix / flat CSV). */
  incomeDisability: string;
  /** Combined disability / AISH / ODSP primary-income row (matrix “DISABILITY (AISH/ODSP)”); falls back to legacy rows in flat CSV. */
  incomeDisabilityProgram: string;
  /** Child tax / CCB-style income row copy. */
  incomeChildTax: string;
  /** Waive-of-income requirements (matrix / flat). */
  incomeWaive: string;
  /** Min payment row raw copy (optional). */
  minPayment: string;
  /** Max payment row raw copy (optional). */
  maxPayment: string;
  /** Deal build / MIN INCOME row raw copy (optional). */
  minIncome: string;
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
  /** Matrix “second unit” / 2nd vehicle row (often under Client details). */
  allowsSecondUnit: boolean;
  /** Matrix “native status” row (often under Lender details). */
  allowsNativeStatus: boolean;
  /** Minimum job tenure in months when set from sheet; null = no rule. */
  minJobTenureMonths: number | null;
  /**
   * Matrix “2 job” row when current job is under 2 months: second job / program path (YES/NO/Conditional).
   * Only used for declines/conditionals when `hasShortJobTenureTwoJobsMatrixRow` is true.
   */
  allowsShortJobTenureTwoJobs: boolean;
  /**
   * True when the matrix CSV contained a recognized “2 job” / short-tenure row for this lender.
   * When false, tenure under 2 months falls back to the usual `minJobTenureMonths` rule.
   */
  hasShortJobTenureTwoJobsMatrixRow: boolean;
  /** Minimum time at current address in months; null = no rule. */
  minAddressTenureMonths: number | null;
  /** Whether AISH (or similar) stated income is accepted; defaults true when absent from sheet. */
  allowsAishIncome: boolean;
  /** Disability benefits as primary income. */
  allowsDisabilityIncome: boolean;
  /**
   * Combined disability / AISH / ODSP program as primary income (matrix “DISABILITY (AISH/ODSP)” row).
   * When absent from flat CSV, derived as both legacy flags true.
   */
  allowsDisabilityProgramIncome: boolean;
  /** Child tax / CCB-style as primary income. */
  allowsChildTaxIncome: boolean;
  /** Minimum monthly payment (CAD) when present in sheet; null = not specified. */
  minPaymentCad: number | null;
  /** Maximum monthly payment (CAD) when present in sheet; null = not specified. */
  maxPaymentCad: number | null;
  /**
   * Minimum gross monthly income (CAD) from Deal build “MIN INCOME” matrix row when parsable;
   * null = not in sheet or not numeric.
   */
  minIncomeCad: number | null;
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
  /**
   * When the second-unit row uses the same Eligible / Conditional / Ineligible layout as SINGLE REPO.
   */
  secondUnitScenario?: ScenarioVerdict | null;
  /**
   * When the native-status row uses the same Eligible / Conditional / Ineligible layout as SINGLE REPO.
   */
  nativeStatusScenario?: ScenarioVerdict | null;
  /** Matrix AISH / program-income row when it uses verdict-style answers (legacy row). */
  incomeAishScenario?: ScenarioVerdict | null;
  /** Matrix disability-benefit primary-income row when it uses verdict-style answers (legacy row). */
  incomeDisabilityScenario?: ScenarioVerdict | null;
  /** Matrix combined “DISABILITY (AISH/ODSP)” row when it uses verdict-style answers. */
  incomeDisabilityProgramScenario?: ScenarioVerdict | null;
  /** Matrix child tax / CCB primary-income row when it uses verdict-style answers. */
  incomeChildTaxScenario?: ScenarioVerdict | null;
  /**
   * Matrix “2 job” row (under 2 months on current job) when it uses Eligible / Conditional / Ineligible
   * or YES/NO/CONDITIONAL layout like SINGLE REPO.
   */
  shortJobTenureTwoJobsScenario?: ScenarioVerdict | null;
  /** Matrix service-area row: Canada-wide, provinces served, or provinces not served. */
  serviceArea: ServiceAreaInfo;
}

export interface FilterState {
  openBK: boolean;
  repo: boolean;
  selfEmployed: boolean;
  /** 9 SIN / New to Canada — one control; maps to the matrix 900 SIN row. */
  nineSinNewToCanada: boolean;
  /** Customer has / needs a second unit (maps to matrix Client details row). */
  secondUnit: boolean;
  /** Customer has native status (maps to matrix Lender details row). */
  nativeStatus: boolean;
  dateOfBirth: string;
  province: string;
  creditScore: number | null;
  ltv: number | null;
  jobTenureYears: number | null;
  jobTenureMonths: number | null;
  incomeAmountCad: number | null;
  incomeProgram: IncomeProgramFilter;
}

export interface EvaluatedLender {
  lender: Lender;
  /** Tri-state result after applying filters (ineligible = hard decline). */
  outcome: EligibilityVerdict;
  declineReasons: string[];
  /**
   * When outcome is conditional and multiple customer situations are selected, each line
   * calls out a situation that is still accepted (e.g. "Repo is accepted" under double-bankruptcy stips).
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