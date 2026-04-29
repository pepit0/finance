import Papa from "papaparse";
import type { EligibilityVerdict, Lender, LenderGuidelineTexts, ParseResult, ScenarioVerdict } from "../types/lender";
import { parseServiceAreaFromCell } from "./serviceArea";

function emptyGuidelineTexts(): LenderGuidelineTexts {
  return {
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
  };
}

type CsvRow = Record<string, string | undefined>;

const REQUIRED_KEYS = [
  "lendername",
  "minscore",
  "maxltv",
  "allowsopenbk",
  "allowsrepo",
  "allowsselfemployed",
  "allowsnewtocanada"
];

function toBoolean(value: string | undefined): boolean | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === "true") {
    return true;
  }
  if (normalized === "false") {
    return false;
  }

  return null;
}

function toNumber(value: string | undefined): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeWebsiteUrl(value: string | undefined): string {
  if (!value) {
    return "";
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.includes(".")) {
    return `https://${trimmed}`;
  }

  return "";
}

function isHttpOrWwwLike(value: string): boolean {
  return /^https?:\/\//i.test(value) || /^www\./i.test(value);
}

function extractUrlFromHyperlinkTwoArgs(s: string): string | null {
  const comma = s.match(/HYPERLINK\s*\(\s*"([^"]*)"\s*,\s*"([^"]*)"/i);
  if (comma) {
    const a = (comma[1] ?? "").trim().replace(/[,);]+$/, "");
    const b = (comma[2] ?? "").trim().replace(/[,);]+$/, "");
    if (isHttpOrWwwLike(a)) {
      return a;
    }
    if (isHttpOrWwwLike(b)) {
      return b;
    }
  }
  const semi = s.match(/HYPERLINK\s*\(\s*"([^"]*)"\s*;\s*"([^"]*)"/i);
  if (semi) {
    const a = (semi[1] ?? "").trim().replace(/[,);]+$/, "");
    const b = (semi[2] ?? "").trim().replace(/[,);]+$/, "");
    if (isHttpOrWwwLike(a)) {
      return a;
    }
    if (isHttpOrWwwLike(b)) {
      return b;
    }
  }
  const commaSq = s.match(/HYPERLINK\s*\(\s*'([^']*)'\s*,\s*'([^']*)'/i);
  if (commaSq) {
    const a = (commaSq[1] ?? "").trim().replace(/[,);]+$/, "");
    const b = (commaSq[2] ?? "").trim().replace(/[,);]+$/, "");
    if (isHttpOrWwwLike(a)) {
      return a;
    }
    if (isHttpOrWwwLike(b)) {
      return b;
    }
  }
  return null;
}

/** Google Sheets often exports links as `=HYPERLINK("https://…","label")` or plain text with URL embedded. */
export function extractHttpUrlFromCell(raw: string | undefined): string | null {
  const s = String(raw ?? "").trim();
  if (!s) {
    return null;
  }

  const hyperlinkPatterns: RegExp[] = [
    /^=?\s*HYPERLINK\s*\(\s*"([^"]+)"/i,
    /^=?\s*HYPERLINK\s*\(\s*'([^']+)'/i,
    /HYPERLINK\s*\(\s*"([^"]+)"/i,
    /HYPERLINK\s*\(\s*'([^']+)'/i
  ];
  for (const re of hyperlinkPatterns) {
    const m = s.match(re);
    if (m?.[1]) {
      const inner = m[1].trim().replace(/[,);]+$/, "");
      if (inner && isHttpOrWwwLike(inner)) {
        return inner;
      }
    }
  }

  const twoArg = extractUrlFromHyperlinkTwoArgs(s);
  if (twoArg) {
    return twoArg;
  }

  const httpsMatch = s.match(/https?:\/\/[^\s"'<>)\]]+/i);
  if (httpsMatch) {
    return httpsMatch[0].replace(/[,);]+$/, "");
  }
  const wwwMatch = s.match(/\bwww\.[^\s"'<>)\]]+/i);
  if (wwwMatch) {
    return wwwMatch[0].replace(/[,);]+$/, "");
  }
  return null;
}

function normalizeRowKeys(row: CsvRow): Record<string, string> {
  return Object.entries(row).reduce<Record<string, string>>((acc, [key, value]) => {
    const normalizedKey = key.trim().toLowerCase().replace(/\s+/g, "");
    acc[normalizedKey] = String(value ?? "").trim();
    return acc;
  }, {});
}

export function parseLenderRows(rows: CsvRow[]): ParseResult {
  const lenders: Lender[] = [];
  let skippedRows = 0;

  for (const row of rows) {
    const normalized = normalizeRowKeys(row);

    const hasRequired = REQUIRED_KEYS.every((key) => key in normalized);
    if (!hasRequired) {
      skippedRows += 1;
      continue;
    }

    const lenderName = normalized.lendername;
    const minScore = toNumber(normalized.minscore);
    const maxLTV = toNumber(normalized.maxltv);
    const allowsOpenBK = toBoolean(normalized.allowsopenbk);
    const allowsRepo = toBoolean(normalized.allowsrepo);
    const allowsSelfEmployed = toBoolean(normalized.allowsselfemployed);
    const allowsNewToCanada = toBoolean(normalized.allowsnewtocanada);
    const allowsSecondUnit = toBoolean(normalized.allowssecondunit) ?? true;
    const allowsNativeStatus = toBoolean(normalized.allownativestatus) ?? true;
    const minJobTenureMonths = toNumber(normalized.minjobtenuremonths);
    const minAddressTenureMonths = toNumber(normalized.minaddresstenuremonths);
    const allowsAishIncome = toBoolean(normalized.allowsaishincome) ?? true;
    const allowsDisabilityIncome = toBoolean(normalized.allowsdisabilityincome) ?? true;
    const explicitDisabilityProgram = toBoolean(normalized.allowsdisabilityprogramincome);
    const allowsDisabilityProgramIncome =
      explicitDisabilityProgram !== null
        ? explicitDisabilityProgram
        : allowsAishIncome && allowsDisabilityIncome;
    const allowsShortJobTenureTwoJobs =
      toBoolean(normalized.allowsshortjobtenuretwojobs) ?? true;
    const allowsChildTaxIncome = toBoolean(normalized.allowschildtaxincome) ?? true;
    const minPaymentCad =
      parseNumberFromText(normalized.minpayment, { min: 0, max: 500000 }) ??
      toNumber(normalized.minpayment);
    const maxPaymentCad =
      parseNumberFromText(normalized.maxpayment, { min: 0, max: 500000 }) ??
      toNumber(normalized.maxpayment);
    const minIncomeRaw = (normalized.minincome ?? normalized.minincomerow ?? "").trim();
    const minIncomeCad = parseMinimumIncomeCadFromSheetCell(minIncomeRaw);

    if (
      !lenderName ||
      minScore === null ||
      maxLTV === null ||
      allowsOpenBK === null ||
      allowsRepo === null ||
      allowsSelfEmployed === null ||
      allowsNewToCanada === null
    ) {
      skippedRows += 1;
      continue;
    }

    const serviceAreaRaw = (normalized.servicearea ?? normalized.serviceareas ?? "").trim();
    const serviceArea = parseServiceAreaFromCell(serviceAreaRaw);

    const bookingGuideRaw =
      normalized.bookingguideurl ||
      normalized.bookingguide ||
      normalized.bookingpdf ||
      normalized.vehiclebookingguide ||
      "";
    const bookingGuideExtracted = extractHttpUrlFromCell(bookingGuideRaw) ?? bookingGuideRaw;

    lenders.push({
      lenderName,
      websiteUrl: normalizeWebsiteUrl(
        extractHttpUrlFromCell(normalized.websiteurl || normalized.website || normalized.url) ??
          normalized.websiteurl ??
          normalized.website ??
          normalized.url
      ),
      bookingGuideUrl: normalizeWebsiteUrl(bookingGuideExtracted),
      minScore,
      maxLTV,
      allowsOpenBK,
      allowsRepo,
      allowsSelfEmployed,
      allowsNewToCanada,
      allowsYoungBuyer: toBoolean(normalized.allowsyoungbuyer) ?? true,
      allowsSecondUnit,
      allowsNativeStatus,
      allowsShortJobTenureTwoJobs,
      hasShortJobTenureTwoJobsMatrixRow: false,
      minJobTenureMonths,
      minAddressTenureMonths,
      allowsAishIncome,
      allowsDisabilityIncome,
      allowsDisabilityProgramIncome,
      allowsChildTaxIncome,
      minPaymentCad,
      maxPaymentCad,
      minIncomeCad,
      notes: normalized.notes || normalized.stips || "",
      guidelineTexts: {
        ...emptyGuidelineTexts(),
        secondUnit: (normalized.secondunitrow ?? normalized.secondunitdetail ?? "").trim(),
        nativeStatus: (normalized.nativestatusrow ?? normalized.nativestatusdetail ?? "").trim(),
        youngBuyer: (normalized.youngbuyer ?? normalized.youngbuyers ?? "").trim(),
        serviceArea: serviceAreaRaw,
        jobTenure: (normalized.jobtenurerow ?? "").trim(),
        shortJobTenureTwoJobs: (normalized.shortjobtenuretwojobsrow ?? "").trim(),
        addressTenure: (normalized.addresstenurerow ?? "").trim(),
        incomeAish: (normalized.incomeaishrow ?? "").trim(),
        incomeDisability: (normalized.incomedisabilityrow ?? "").trim(),
        incomeDisabilityProgram: (normalized.incomedisabilityprogramrow ?? "").trim(),
        incomeChildTax: (normalized.incomechildtaxrow ?? "").trim(),
        incomeWaive: (normalized.incomewaive ?? normalized.incomewaiverow ?? "").trim(),
        minPayment: (normalized.minpaymentrow ?? normalized.minpayment ?? "").trim(),
        maxPayment: (normalized.maxpaymentrow ?? normalized.maxpayment ?? "").trim(),
        minIncome: minIncomeRaw
      },
      openBKScenario: null,
      repoScenario: null,
      newToCanadaScenario: null,
      youngBuyerScenario: null,
      secondUnitScenario: null,
      nativeStatusScenario: null,
      incomeAishScenario: null,
      incomeDisabilityScenario: null,
      incomeDisabilityProgramScenario: null,
      incomeChildTaxScenario: null,
      shortJobTenureTwoJobsScenario: null,
      serviceArea
    });
  }

  return { lenders, skippedRows };
}

function normalizeCriterion(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

const SCENARIO_ALIASES = {
  minScore: ["minscore"],
  maxLTV: ["maxadvance", "maxltv"],
  allowsOpenBK: ["doublebanko", "bankopropprogram"],
  allowsRepo: ["singlerepo", "doublerepo"],
  allowsSelfEmployed: ["noaonselfemployed"],
  allowsNewToCanada: ["900sin"],
  /** Row label in column B, e.g. “Young Buyers Client Details” → youngbuyersclientdetails */
  allowsYoungBuyer: [
    "youngbuyersclientdetails",
    "youngbuyers",
    "youngbuyer",
    "youngbuyersdetails",
    "under24",
    "underage24"
  ],
  /** Second unit / 2nd vehicle row (often grouped under Client details in column A). */
  allowsSecondUnit: [
    "secondunit",
    "2ndunit",
    "secondunits",
    "unit2",
    "secondunitclientdetails",
    "clientdetailssecondunit",
    "2ndunitclientdetails"
  ],
  /** Native status row (often grouped under Lender details in column A). */
  allowsNativeStatus: [
    "nativestatus",
    "nativestatuscard",
    "indigenousstatus",
    "treatystatus",
    "lenderdetailsnativestatus",
    "nativestatuslenderdetails",
    "lenderdetailsnative",
    "nativelendingstatus"
  ],
  /** Minimum job tenure in months (numeric cell). */
  minJobTenureMonths: [
    "minjobtenuremo",
    "minjobtenure",
    "minimumjobtenure",
    "minemploymenttenure",
    "jobtenureminimum"
  ],
  /**
   * Second job / “2 job” path when current job tenure is under 2 months (YES/NO/Conditional or verdict labels).
   * Column B labels e.g. “2 JOB”, “TWO JOBS”.
   */
  allowsShortJobTenureTwoJobs: [
    "2job",
    "2jobs",
    "2ndjob",
    "twojobs",
    "secondjob",
    "secondemployment",
    "twomonth2job",
    "jobtenure2jobs",
    "lessthan2months2jobs",
    "undertwomonthstwojobs",
    "2jobunder2months",
    "2jobsunder2months",
    "under2months2jobs",
    "under2month2job",
    "minjobunder2mo2job",
    "twomonthstwojobs"
  ],
  /** Minimum address tenure in months. */
  minAddressTenureMonths: [
    "minaddresstenuremo",
    "minaddresstenure",
    "minimumaddresstenure",
    "addresstenureminimum",
    "timeataddress"
  ],
  /**
   * Combined disability / AISH / ODSP primary income (matrix column B e.g. “DISABILITY (AISH/ODSP)”).
   * When this row exists, it drives `allowsDisabilityProgramIncome` and legacy AISH/disability flags stay in sync.
   */
  allowsDisabilityProgramIncome: [
    "disabilityaishodsp",
    "disabilityaish",
    "aishodsp",
    "disabilityprogram",
    "disabilityaishodspbenefit",
    "disabilityaishodspbenefits"
  ],
  /** AISH / similar benefit as primary income accepted (YES/NO style cell). */
  allowsAishIncome: ["aish", "aishincome", "aishprogram", "allowsaish"],
  /** Disability benefits as primary income. */
  allowsDisabilityIncome: ["disability", "disabilityincome", "disabilitybenefits", "cppltd"],
  /** Child tax / CCB as primary income. */
  allowsChildTaxIncome: ["childtax", "childtaxbenefit", "ccb", "canadachildbenefit", "ctb"],
  /** Minimum monthly payment (numeric or text with number). */
  minPayment: [
    "minpayment",
    "minimumpayment",
    "minpymt",
    "minmonthlypayment",
    "minimummonthlypayment",
    "lenderdetailsminpayment",
    "lenderdetailsminimumpayment",
    "lenderdetailsminimummonthlypayment",
    /** Same row as max in many sheets, e.g. column B “MAX & MIN PYMNT” → `maxminpymnt`. */
    "maxminpymnt",
    "maxminpayment",
    "minmaxpymnt",
    "minmaxpayment",
    "minmaxpayments",
    "mintomaxpayment",
    "mintomaxpymnt"
  ],
  /** Maximum monthly payment. */
  maxPayment: [
    "maxpayment",
    "maximumpayment",
    "maxpymt",
    "maxmonthlypayment",
    "maximumpay",
    "maximummonthlypayment",
    "lenderdetailsmaxpayment",
    "lenderdetailsmaximumpayment",
    "lenderdetailsmaximummonthlypayment",
    "maxminpymnt",
    "maxminpayment",
    "minmaxpymnt",
    "minmaxpayment",
    "minmaxpayments",
    "mintomaxpayment",
    "mintomaxpymnt"
  ],
  /** Waive-of-income requirements (free text). */
  incomeWaive: [
    "waiveincome",
    "incomewaive",
    "incomewaiverequirements",
    "waiveofincome",
    "incomewaiver"
  ],
  /**
   * Deal build / “MIN INCOME” row (column A often “DEAL BUILD”, column B “MIN INCOME” → `minincome`).
   * Cell is free text with one or more dollar amounts; we take the smallest plausible monthly CAD amount.
   */
  minIncome: [
    "minincome",
    "minimumincome",
    "minimummonthlyincome",
    "minimumgrossincome",
    "minmonthlyincome",
    "dealbuildminincome",
    "minincomedealbuild",
    "requiredmonthlyincome"
  ],
  /** Column B label e.g. “Service area” → servicearea */
  serviceArea: [
    "servicearea",
    "serviceareas",
    "geographiccoverage",
    "lendingterritory",
    "territory",
    "provinceserved",
    "servicedprovinces"
  ]
} as const;

type ScenarioKey = keyof typeof SCENARIO_ALIASES;

function parseNumberFromText(
  value: string | undefined,
  options: { min?: number; max?: number } = {}
): number | null {
  if (!value) {
    return null;
  }

  const min = options.min ?? 1;
  const max = options.max ?? Number.POSITIVE_INFINITY;
  const numericValues = (value.match(/\d+(\.\d+)?/g) ?? [])
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item) && item >= min && item <= max);

  if (numericValues.length === 0) {
    return null;
  }

  return Math.max(...numericValues);
}

/** Pull currency-like tokens so `50,000.00` parses as one number. */
function parseMoneyLikeNumbersFromText(raw: string): number[] {
  const tokens = raw.match(/\d[\d,]*(?:\.\d+)?/g) ?? [];
  return tokens
    .map((t) => Number(t.replace(/,/g, "")))
    .filter((n) => Number.isFinite(n) && n >= 0);
}

/**
 * Reads a single matrix cell that describes both min and max monthly payment
 * (e.g. “$250 to $650”, “850.00-900.00”, or tiered “$250 … $850”).
 * Ignores very large amounts so unrelated numbers (e.g. ATF) do not dominate.
 */
export function parseMinMaxMonthlyPaymentFromSheetCell(raw: string): {
  min: number | null;
  max: number | null;
} {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { min: null, max: null };
  }

  const toWord = /\b([\d,]+(?:\.\d+)?)\s+to\s+\$?\s*([\d,]+(?:\.\d+)?)\b/i.exec(trimmed);
  if (toWord) {
    const a = Number(toWord[1].replace(/,/g, ""));
    const b = Number(toWord[2].replace(/,/g, ""));
    if (Number.isFinite(a) && Number.isFinite(b)) {
      return { min: Math.min(a, b), max: Math.max(a, b) };
    }
  }

  const dashPair = trimmed.match(
    /\$?\s*([\d,]+(?:\.\d+)?)\s*[-–—]\s*\$?\s*([\d,]+(?:\.\d+)?)(?:\s|$|[^\d,.])/i
  );
  if (dashPair) {
    const a = Number(dashPair[1].replace(/,/g, ""));
    const b = Number(dashPair[2].replace(/,/g, ""));
    if (Number.isFinite(a) && Number.isFinite(b) && a <= 50_000 && b <= 50_000) {
      return { min: Math.min(a, b), max: Math.max(a, b) };
    }
  }

  const nums = parseMoneyLikeNumbersFromText(trimmed);
  const monthly = nums.filter((n) => n >= 20 && n <= 12_000);
  const pool = monthly.length > 0 ? monthly : nums;
  if (pool.length === 0) {
    return { min: null, max: null };
  }
  const lo = Math.min(...pool);
  const hi = Math.max(...pool);
  return { min: lo, max: hi };
}

/**
 * Minimum gross monthly income from Deal build “MIN INCOME” style cells.
 * Uses the smallest dollar amount in a sensible monthly range when several appear.
 */
export function parseMinimumIncomeCadFromSheetCell(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }
  const nums = parseMoneyLikeNumbersFromText(trimmed);
  const monthly = nums.filter((n) => n >= 500 && n <= 250_000);
  if (monthly.length === 0) {
    return null;
  }
  return Math.min(...monthly);
}

/**
 * Interprets messy booking-sheet cells. Positive-first so "YES/ NO CREDIT COUNSELLING"
 * and "YES CASE BY CASE (NO DEFAULTED …)" still read as approvals; blanket "NOT USUALLY" does not.
 */
function parseGuidelineBoolean(value: string | undefined): boolean {
  const raw = (value ?? "").trim();
  if (!raw) {
    return true;
  }

  const lower = raw.toLowerCase();

  const positiveHints = [
    /^\s*yes\b/i,
    /^\s*yesw\b/i,
    /^\s*y[\s\-/,]/i,
    /\byes\s+even\b/i,
    /\bcase\s+by\s+case\b/i,
    /\btry\s+it\b/i,
    /\b1\s*day\b/i,
    /\by\b\s*[-–]\s*discharg/i
  ];
  if (positiveHints.some((re) => re.test(lower))) {
    return true;
  }

  let s = lower.replace(/\([^)]{0,320}\)/g, " ");
  s = s.replace(/\byes\s*\/\s*no\b/gi, " ");
  s = s.replace(/\byes\s*,\s*no\b/gi, " ");
  s = s.replace(/\byes\s*-\s*no\s+min\b/gi, "yes ");

  const negativeHints = [
    /^\s*not\s+usually\b/,
    /^\s*no\b(?:\s*[,.;/)]|\s*$)/,
    /\bnot\s+usually\b/,
    /\busually\s+no\b/,
    /\bnever\b/,
    /declin/i,
    /\bnope\b/,
    /\bnot\s+yet\b/
  ];

  if (negativeHints.some((re) => re.test(s))) {
    return false;
  }

  if (/\bno\b/.test(s)) {
    return false;
  }

  return true;
}

export function parseEligibilityVerdictFromAnswer(
  answerRaw: string
): { verdict: EligibilityVerdict; tail: string } | null {
  const answer = answerRaw.trim();
  if (!answer) {
    return null;
  }
  const m = answer.match(/^(eligible|conditional|ineligible)\b\s*(?:[|.:;—\-]\s*)?(.*)$/i);
  if (!m) {
    return null;
  }
  const word = m[1].toLowerCase();
  if (word !== "eligible" && word !== "conditional" && word !== "ineligible") {
    return null;
  }
  return { verdict: word as EligibilityVerdict, tail: (m[2] ?? "").trim() };
}

function formatEligibilityVerdictLine(verdict: EligibilityVerdict, detail: string): string {
  const head = verdict.charAt(0).toUpperCase() + verdict.slice(1);
  const d = detail.trim();
  return d ? `${head} — ${d}` : head;
}

/** Plain Yes/No/Y/N in the answer column (paired with a reason column). */
function parseStrictYesNoAnswer(cell: string): boolean | null {
  const t = cell.trim().toLowerCase();
  if (!t) {
    return null;
  }
  if (t === "yes" || t === "y" || t === "yesw") {
    return true;
  }
  if (t === "no" || t === "n" || t === "nope") {
    return false;
  }
  return null;
}

function formatYesAnswerReasonLine(accepted: boolean, detail: string): string {
  const head = accepted ? "Yes" : "No";
  const d = detail.trim();
  return d ? `${head} — ${d}` : head;
}

/**
 * Single-cell "answer + reason" formats: `Yes | …`, `No: …`, `Yes — …`, or legacy free text.
 * Does not treat `YES/ NO` slash forms as a strict prefix (handled elsewhere).
 */
export function parseSheetAnswerReasonCell(raw: string): { answer: boolean | null; displayLine: string } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { answer: null, displayLine: "" };
  }

  if (/^\s*yes\s*\/\s*no\b/i.test(trimmed)) {
    return { answer: null, displayLine: trimmed };
  }

  const pipeParts = trimmed.split(/\t|\s*\|\s*/).map((p) => p.trim()).filter(Boolean);
  if (pipeParts.length >= 2) {
    const head = pipeParts[0].toLowerCase();
    const tail = pipeParts.slice(1).join(" | ").trim();
    if (head === "yes" || head === "y") {
      return { answer: true, displayLine: formatYesAnswerReasonLine(true, tail) };
    }
    if (head === "no" || head === "n") {
      return { answer: false, displayLine: formatYesAnswerReasonLine(false, tail) };
    }
  }

  const punct = trimmed.match(/^\s*(yesw?|yes|no|nope)\b\s*[:\-|–—]\s*(.+)$/i);
  if (punct) {
    const h = punct[1].toLowerCase();
    const tail = punct[2].trim();
    if (h === "no" || h === "nope") {
      return { answer: false, displayLine: formatYesAnswerReasonLine(false, tail) };
    }
    if (h === "yes" || h === "yesw") {
      return { answer: true, displayLine: formatYesAnswerReasonLine(true, tail) };
    }
  }

  const lone = trimmed.match(/^\s*(yesw?|yes|no|nope)\s*$/i);
  if (lone) {
    const h = lone[1].toLowerCase();
    if (h === "no" || h === "nope") {
      return { answer: false, displayLine: "No" };
    }
    return { answer: true, displayLine: "Yes" };
  }

  return { answer: null, displayLine: trimmed };
}

type LenderColumnSpec = { name: string; column: number; reasonColumn?: number };

function isReasonHeaderLabel(name: string): boolean {
  const n = name.trim().toLowerCase();
  return (
    n === "reason" ||
    n === "reasons" ||
    n === "detail" ||
    n === "details" ||
    n === "notes" ||
    n === "note" ||
    n === "answer" ||
    n === "yes/no" ||
    n === "yes no"
  );
}

function buildLenderColumnSpecs(
  lenderHeaderRow: string[]
): LenderColumnSpec[] {
  const raw = lenderHeaderRow
    .map((cell, index) => ({
      name: normalizeLenderName((cell ?? "").trim()),
      index
    }))
    .filter((item) => item.index >= 2 && !isLikelyWebsite(item.name));

  const specs: LenderColumnSpec[] = [];
  for (let i = 0; i < raw.length; i += 1) {
    const cur = raw[i];
    if (!cur.name) {
      continue;
    }
    const next = raw[i + 1];
    if (
      next &&
      next.index === cur.index + 1 &&
      (next.name === cur.name || isReasonHeaderLabel(next.name))
    ) {
      specs.push({ name: cur.name, column: cur.index, reasonColumn: next.index });
      i += 1;
    } else {
      specs.push({ name: cur.name, column: cur.index });
    }
  }
  return specs;
}

type OpenBkResolve = {
  allows: boolean;
  display: string;
  scenario: ScenarioVerdict | null;
};

function resolveOpenBkFromRow(answerCell: string, reasonCell: string | undefined): OpenBkResolve {
  const reason = (reasonCell ?? "").trim();
  const answer = (answerCell ?? "").trim();

  if (!answer && !reason) {
    return { allows: true, display: "", scenario: null };
  }

  const tri = parseEligibilityVerdictFromAnswer(answer);
  if (tri) {
    const detail = [reason, tri.tail].filter((s) => s.trim()).join(" ").trim();
    const verdict = tri.verdict;
    return {
      allows: verdict !== "ineligible",
      display: formatEligibilityVerdictLine(verdict, detail),
      scenario: { verdict, detail }
    };
  }

  if (reason) {
    const yn = parseStrictYesNoAnswer(answer);
    if (yn !== null) {
      return { allows: yn, display: formatYesAnswerReasonLine(yn, reason), scenario: null };
    }
    const combined = `${answer} ${reason}`.trim();
    return { allows: parseGuidelineBoolean(combined), display: combined, scenario: null };
  }

  const parsed = parseSheetAnswerReasonCell(answer);
  if (parsed.answer !== null) {
    return { allows: parsed.answer, display: parsed.displayLine, scenario: null };
  }
  return {
    allows: parseGuidelineBoolean(answer),
    display: parsed.displayLine,
    scenario: null
  };
}

/** Leading YES / NO / CONDITIONAL (sheet shorthand) before detail or brackets. */
function parseLeadingYesNoConditionalVerdict(
  raw: string
): { verdict: EligibilityVerdict; tail: string } | null {
  const trimmed = raw.trim();
  const m = trimmed.match(
    /^\s*(conditional|yesw?|no|nope)\b(?:\s*[:\-|–—]|\s+|$)(.*)$/is
  );
  if (!m) {
    return null;
  }
  const word = m[1].toLowerCase();
  const tail = (m[2] ?? "").trim();
  if (word === "conditional") {
    return { verdict: "conditional", tail };
  }
  if (word === "no" || word === "nope") {
    return { verdict: "ineligible", tail };
  }
  if (word === "yes" || word === "yesw") {
    return { verdict: "eligible", tail };
  }
  return null;
}

export type NewToCanadaResolve = {
  allows: boolean;
  display: string;
  scenario: ScenarioVerdict | null;
};

export type RepoResolve = {
  allows: boolean;
  display: string;
  scenario: ScenarioVerdict | null;
};

/**
 * Parses the 900 SIN / New to Canada matrix cell (plus optional reason column).
 * Supports Eligible/Conditional/Ineligible, YES/NO/CONDITIONAL, "Yes but …", and legacy fuzzy cells.
 */
export function resolveNewToCanadaFromRow(
  answerCell: string,
  reasonCell?: string
): NewToCanadaResolve {
  const reason = (reasonCell ?? "").trim();
  const answer = (answerCell ?? "").trim();

  if (!answer && !reason) {
    return { allows: true, display: "", scenario: null };
  }

  const combinedFull = [answer, reason].filter(Boolean).join(" ").trim();

  if (/^\s*yes\s+but\b/i.test(answer) || /^\s*yes\s+but\b/i.test(reason)) {
    const detail = combinedFull;
    return {
      allows: true,
      display: formatEligibilityVerdictLine("conditional", detail),
      scenario: { verdict: "conditional", detail }
    };
  }

  const tri = parseEligibilityVerdictFromAnswer(answer);
  if (tri) {
    const detail = [reason, tri.tail].filter((s) => s.trim()).join(" ").trim();
    const verdict = tri.verdict;
    return {
      allows: verdict !== "ineligible",
      display: formatEligibilityVerdictLine(verdict, detail),
      scenario: { verdict, detail }
    };
  }

  const ynLead = parseLeadingYesNoConditionalVerdict(answer);
  if (ynLead) {
    const detail = [ynLead.tail, reason].filter((s) => s.trim()).join(" ").trim();
    const verdict = ynLead.verdict;
    return {
      allows: verdict !== "ineligible",
      display: formatEligibilityVerdictLine(verdict, detail),
      scenario: { verdict, detail }
    };
  }

  if (reason) {
    const yn = parseStrictYesNoAnswer(answer);
    if (yn !== null) {
      return {
        allows: yn,
        display: formatYesAnswerReasonLine(yn, reason),
        scenario: null
      };
    }
    const combined = `${answer} ${reason}`.trim();
    return {
      allows: parseGuidelineBoolean(combined),
      display: combined,
      scenario: null
    };
  }

  const parsed = parseSheetAnswerReasonCell(answer);
  if (parsed.answer !== null) {
    return {
      allows: parsed.answer,
      display: parsed.displayLine,
      scenario: null
    };
  }

  return {
    allows: parseGuidelineBoolean(answer),
    display: parsed.displayLine || combinedFull || answer,
    scenario: null
  };
}

/**
 * Parses SINGLE REPO as a verdict row (Eligible / Conditional / Ineligible, YES/NO/CONDITIONAL),
 * with optional paired reason column.
 */
export function resolveRepoFromRow(answerCell: string, reasonCell?: string): RepoResolve {
  const reason = (reasonCell ?? "").trim();
  const answer = (answerCell ?? "").trim();

  if (!answer && !reason) {
    return { allows: true, display: "", scenario: null };
  }

  const tri = parseEligibilityVerdictFromAnswer(answer);
  if (tri) {
    const detail = [reason, tri.tail].filter((s) => s.trim()).join(" ").trim();
    const verdict = tri.verdict;
    return {
      allows: verdict !== "ineligible",
      display: formatEligibilityVerdictLine(verdict, detail),
      scenario: { verdict, detail }
    };
  }

  const ynLead = parseLeadingYesNoConditionalVerdict(answer);
  if (ynLead) {
    const detail = [ynLead.tail, reason].filter((s) => s.trim()).join(" ").trim();
    const verdict = ynLead.verdict;
    return {
      allows: verdict !== "ineligible",
      display: formatEligibilityVerdictLine(verdict, detail),
      scenario: { verdict, detail }
    };
  }

  if (reason) {
    const yn = parseStrictYesNoAnswer(answer);
    if (yn !== null) {
      return {
        allows: yn,
        display: formatYesAnswerReasonLine(yn, reason),
        scenario: null
      };
    }
    const combined = `${answer} ${reason}`.trim();
    return {
      allows: parseGuidelineBoolean(combined),
      display: combined,
      scenario: null
    };
  }

  const parsed = parseSheetAnswerReasonCell(answer);
  if (parsed.answer !== null) {
    return {
      allows: parsed.answer,
      display: parsed.displayLine,
      scenario: null
    };
  }

  return {
    allows: parseGuidelineBoolean(answer),
    display: parsed.displayLine || answer,
    scenario: null
  };
}

function isLikelyWebsite(value: string | undefined): boolean {
  return extractHttpUrlFromCell(value) !== null;
}

function isLikelyLenderName(value: string | undefined): boolean {
  const normalized = (value ?? "").trim();
  if (!normalized) {
    return false;
  }

  if (isLikelyWebsite(normalized)) {
    return false;
  }

  return /[a-z]/i.test(normalized);
}

/** Keep header text aligned with the sheet; normalize bare GO-PLAN to Santander Go Plan for clarity. */
function normalizeLenderName(name: string): string {
  const trimmed = name.trim();
  if (/^go-?plan$/i.test(trimmed)) {
    return "Santander Go Plan";
  }
  return trimmed;
}

function findNearestWebsiteForColumn(rows: string[][], lenderHeaderIndex: number, columnIndex: number): string {
  for (let index = lenderHeaderIndex - 1; index >= 0; index -= 1) {
    const extracted = extractHttpUrlFromCell(rows[index]?.[columnIndex]);
    if (extracted) {
      return normalizeWebsiteUrl(extracted);
    }
  }

  return "";
}

function isGoogleDriveHttpUrl(url: string): boolean {
  const u = url.toLowerCase();
  return u.includes("drive.google.com") || u.includes("docs.google.com");
}

function collectHttpUrlsAboveColumn(
  rows: string[][],
  lenderHeaderIndex: number,
  columnIndex: number,
  maxUrls = 4
): string[] {
  const urls: string[] = [];
  for (let i = lenderHeaderIndex - 1; i >= 0 && urls.length < maxUrls; i -= 1) {
    const extracted = extractHttpUrlFromCell(rows[i]?.[columnIndex]);
    if (extracted) {
      urls.push(normalizeWebsiteUrl(extracted));
    }
  }
  return urls.filter(Boolean);
}

function splitWebsiteAndBooking(urls: string[]): { website: string; bookingGuide: string } {
  const cleaned = urls.filter(Boolean);
  if (cleaned.length === 0) {
    return { website: "", bookingGuide: "" };
  }
  if (cleaned.length === 1) {
    const only = cleaned[0];
    if (isGoogleDriveHttpUrl(only)) {
      return { website: "", bookingGuide: only };
    }
    return { website: only, bookingGuide: "" };
  }
  // Nearest row to the lender header is the website; the row above that is the booking guide PDF link.
  return { website: cleaned[0], bookingGuide: cleaned[1] };
}

const LENDER_WEBSITE_HINTS: Array<{ pattern: RegExp; url: string }> = [
  { pattern: /\biA\b|ia\s+auto|ia\.ca/i, url: "https://www.ia.ca/" },
  { pattern: /santander|carfinco/i, url: "https://www.carfinco.com/" },
  /** Only the bare matrix header; avoids mis-linking "iA Go Plan" style names. */
  { pattern: /^go-?plan$/i, url: "https://www.carfinco.com/" },
  { pattern: /eden\s*park/i, url: "https://www.edenparkcanada.com/" },
  { pattern: /lendcare/i, url: "https://www.lendcare.ca/en/" },
  { pattern: /source\s*one/i, url: "http://sourceonefinancial.ca/" },
  { pattern: /scotia/i, url: "https://www.scotiabank.com/" },
  { pattern: /td/i, url: "https://www.tdautofinance.ca/default.aspx" },
  { pattern: /autocapital|acc/i, url: "https://www.autocapitalcanada.com/" },
  { pattern: /transcan|tcl/i, url: "https://www.transcanleasing.ca/" },
  { pattern: /rifco/i, url: "https://rifco.net/" }
];

function inferWebsiteFromLenderName(lenderName: string): string {
  const match = LENDER_WEBSITE_HINTS.find((entry) => entry.pattern.test(lenderName));
  return match ? match.url : "";
}

function parseLenderMatrix(rows: string[][]): ParseResult {
  const lenderHeaderRow = rows.find(
    (row) => {
      if (row.length <= 3) {
        return false;
      }

      const lenderLikeCells = row.filter((cell, index) => index >= 2 && isLikelyLenderName(cell));
      const websiteLikeCells = row.filter((cell, index) => index >= 2 && isLikelyWebsite(cell));
      const hasKnownLenderToken = row.some((cell) =>
        /\biA\b|santander|go-?plan|eden park|lendcare|source one|scotia|td|acc|tcl|rifco|north\s*lake|northlake/i.test(
          (cell ?? "").trim()
        )
      );

      return (
        lenderLikeCells.length >= 2 &&
        lenderLikeCells.length > websiteLikeCells.length &&
        hasKnownLenderToken
      );
    }
  );

  if (!lenderHeaderRow) {
    return { lenders: [], skippedRows: rows.length };
  }

  const lenderColumns = buildLenderColumnSpecs(lenderHeaderRow);

  const lenderHeaderIndex = rows.findIndex((row) => row === lenderHeaderRow);

  const criteriaRows = new Map<string, string[]>();
  for (const row of rows) {
    const criterion = normalizeCriterion((row[1] ?? "").trim());
    if (criterion) {
      criteriaRows.set(criterion, row);
    }
  }

  function getScenarioValue(key: ScenarioKey, columnIndex: number): string {
    for (const alias of SCENARIO_ALIASES[key]) {
      const row = criteriaRows.get(alias);
      if (row) {
        return row[columnIndex] ?? "";
      }
    }
    return "";
  }
  function getScenarioRow(key: ScenarioKey): string[] | undefined {
    for (const alias of SCENARIO_ALIASES[key]) {
      const row = criteriaRows.get(alias);
      if (row) {
        return row;
      }
    }
    return undefined;
  }

  const lenders: Lender[] = lenderColumns.map(({ name, column, reasonColumn }) => {
    const minScore = parseNumberFromText(getScenarioValue("minScore", column), { min: 300, max: 900 }) ?? 0;
    const maxLTV = parseNumberFromText(getScenarioValue("maxLTV", column), { min: 1, max: 300 }) ?? 130;

    const openBkRow = getScenarioRow("allowsOpenBK");
    const openBkAnswer = getScenarioValue("allowsOpenBK", column);
    const openBkReasonCell =
      reasonColumn !== undefined && openBkRow ? (openBkRow[reasonColumn] ?? "").trim() : "";
    const openBkResolved = resolveOpenBkFromRow(
      openBkAnswer,
      reasonColumn !== undefined ? openBkReasonCell || undefined : undefined
    );
    const allowsOpenBK = openBkResolved.allows;
    const openBkGuideline = (openBkResolved.display || openBkAnswer).trim();
    const openBKScenario = openBkResolved.scenario;

    const repoRow = getScenarioRow("allowsRepo");
    const repoAnswer = getScenarioValue("allowsRepo", column);
    const repoReasonCell =
      reasonColumn !== undefined && repoRow ? (repoRow[reasonColumn] ?? "").trim() : "";
    const repoResolved = resolveRepoFromRow(
      repoAnswer,
      reasonColumn !== undefined ? repoReasonCell || undefined : undefined
    );
    const selfEmployedCell = getScenarioValue("allowsSelfEmployed", column);
    const sinRow = criteriaRows.get("900sin");
    const newToCanadaAnswer = sinRow?.[column] ?? "";
    const newToCanadaReasonCell =
      reasonColumn !== undefined && sinRow ? (sinRow[reasonColumn] ?? "").trim() : "";
    const ntcResolved = resolveNewToCanadaFromRow(
      newToCanadaAnswer,
      reasonColumn !== undefined ? newToCanadaReasonCell || undefined : undefined
    );

    const ybRow = getScenarioRow("allowsYoungBuyer");
    const ybAnswer = getScenarioValue("allowsYoungBuyer", column);
    const ybReasonCell =
      reasonColumn !== undefined && ybRow ? (ybRow[reasonColumn] ?? "").trim() : "";
    const ybResolved = resolveRepoFromRow(
      ybAnswer,
      reasonColumn !== undefined ? ybReasonCell || undefined : undefined
    );

    const suRow = getScenarioRow("allowsSecondUnit");
    const suAnswer = getScenarioValue("allowsSecondUnit", column);
    const suReasonCell =
      reasonColumn !== undefined && suRow ? (suRow[reasonColumn] ?? "").trim() : "";
    const suResolved = resolveRepoFromRow(
      suAnswer,
      reasonColumn !== undefined ? suReasonCell || undefined : undefined
    );

    const nsRow = getScenarioRow("allowsNativeStatus");
    const nsAnswer = getScenarioValue("allowsNativeStatus", column);
    const nsReasonCell =
      reasonColumn !== undefined && nsRow ? (nsRow[reasonColumn] ?? "").trim() : "";
    const nsResolved = resolveRepoFromRow(
      nsAnswer,
      reasonColumn !== undefined ? nsReasonCell || undefined : undefined
    );

    const minJobTenureRaw = getScenarioValue("minJobTenureMonths", column);
    const minJobTenureMonths =
      parseNumberFromText(minJobTenureRaw, { min: 0, max: 600 }) ?? toNumber(minJobTenureRaw.trim());
    const minAddressTenureRaw = getScenarioValue("minAddressTenureMonths", column);
    const minAddressTenureMonths =
      parseNumberFromText(minAddressTenureRaw, { min: 0, max: 600 }) ??
      toNumber(minAddressTenureRaw.trim());

    const shortTwoJobsRow = getScenarioRow("allowsShortJobTenureTwoJobs");
    const shortTwoJobsAnswer = getScenarioValue("allowsShortJobTenureTwoJobs", column);
    const shortTwoJobsReasonCell =
      reasonColumn !== undefined && shortTwoJobsRow
        ? (shortTwoJobsRow[reasonColumn] ?? "").trim()
        : "";
    const shortTwoJobsResolved = resolveRepoFromRow(
      shortTwoJobsAnswer,
      reasonColumn !== undefined ? shortTwoJobsReasonCell || undefined : undefined
    );
    const hasShortJobTenureTwoJobsRow = shortTwoJobsRow != null;
    const allowsShortJobTenureTwoJobs = hasShortJobTenureTwoJobsRow
      ? shortTwoJobsResolved.allows
      : true;
    const shortJobTenureTwoJobsScenario = hasShortJobTenureTwoJobsRow
      ? shortTwoJobsResolved.scenario
      : null;

    const disabilityProgramRow = getScenarioRow("allowsDisabilityProgramIncome");
    const disabilityProgramAnswer = getScenarioValue("allowsDisabilityProgramIncome", column);
    const disabilityProgramReasonCell =
      reasonColumn !== undefined && disabilityProgramRow
        ? (disabilityProgramRow[reasonColumn] ?? "").trim()
        : "";
    const hasDisabilityProgramMatrixRow = disabilityProgramRow != null;

    const aishRow = getScenarioRow("allowsAishIncome");
    const aishAnswer = getScenarioValue("allowsAishIncome", column);
    const aishReasonCell =
      reasonColumn !== undefined && aishRow ? (aishRow[reasonColumn] ?? "").trim() : "";
    const aishResolved = resolveRepoFromRow(
      aishAnswer,
      reasonColumn !== undefined ? aishReasonCell || undefined : undefined
    );

    const disabilityRow = getScenarioRow("allowsDisabilityIncome");
    const disabilityAnswer = getScenarioValue("allowsDisabilityIncome", column);
    const disabilityReasonCell =
      reasonColumn !== undefined && disabilityRow ? (disabilityRow[reasonColumn] ?? "").trim() : "";
    const disabilityResolved = resolveRepoFromRow(
      disabilityAnswer,
      reasonColumn !== undefined ? disabilityReasonCell || undefined : undefined
    );

    const childTaxRow = getScenarioRow("allowsChildTaxIncome");
    const childTaxAnswer = getScenarioValue("allowsChildTaxIncome", column);
    const childTaxReasonCell =
      reasonColumn !== undefined && childTaxRow ? (childTaxRow[reasonColumn] ?? "").trim() : "";
    const childTaxResolved = resolveRepoFromRow(
      childTaxAnswer,
      reasonColumn !== undefined ? childTaxReasonCell || undefined : undefined
    );

    let allowsAishIncome: boolean;
    let allowsDisabilityIncome: boolean;
    let allowsDisabilityProgramIncome: boolean;
    let incomeAishScenario: ScenarioVerdict | null;
    let incomeDisabilityScenario: ScenarioVerdict | null;
    let incomeDisabilityProgramScenario: ScenarioVerdict | null;
    let incomeDisabilityProgramText: string;

    if (hasDisabilityProgramMatrixRow) {
      const dpResolved = resolveRepoFromRow(
        disabilityProgramAnswer,
        reasonColumn !== undefined ? disabilityProgramReasonCell || undefined : undefined
      );
      allowsDisabilityProgramIncome = dpResolved.allows;
      allowsAishIncome = dpResolved.allows;
      allowsDisabilityIncome = dpResolved.allows;
      incomeDisabilityProgramScenario = dpResolved.scenario;
      incomeAishScenario = dpResolved.scenario;
      incomeDisabilityScenario = dpResolved.scenario;
      incomeDisabilityProgramText = (dpResolved.display || disabilityProgramAnswer).trim();
    } else {
      allowsAishIncome = aishResolved.allows;
      allowsDisabilityIncome = disabilityResolved.allows;
      allowsDisabilityProgramIncome = allowsAishIncome && allowsDisabilityIncome;
      incomeAishScenario = aishResolved.scenario;
      incomeDisabilityScenario = disabilityResolved.scenario;
      incomeDisabilityProgramScenario =
        disabilityResolved.scenario ?? aishResolved.scenario ?? null;
      const aishLine = (aishResolved.display || aishAnswer).trim();
      const disabilityLine = (disabilityResolved.display || disabilityAnswer).trim();
      incomeDisabilityProgramText = [aishLine, disabilityLine].filter(Boolean).join(" | ");
    }

    const allowsChildTaxIncome = childTaxResolved.allows;

    const minPaymentRaw = getScenarioValue("minPayment", column);
    const maxPaymentRaw = getScenarioValue("maxPayment", column);
    const incomeWaiveRaw = getScenarioValue("incomeWaive", column);
    const minTrim = minPaymentRaw.trim();
    const maxTrim = maxPaymentRaw.trim();
    let minPaymentCad: number | null;
    let maxPaymentCad: number | null;
    if (minTrim === maxTrim && minTrim.length > 0) {
      const combined = parseMinMaxMonthlyPaymentFromSheetCell(minTrim);
      minPaymentCad = combined.min;
      maxPaymentCad = combined.max;
    } else {
      minPaymentCad =
        parseNumberFromText(minPaymentRaw, { min: 0, max: 500000 }) ?? toNumber(minTrim);
      maxPaymentCad =
        parseNumberFromText(maxPaymentRaw, { min: 0, max: 500000 }) ?? toNumber(maxTrim);
    }

    const minIncomeRaw = getScenarioValue("minIncome", column);
    const minIncomeCad = parseMinimumIncomeCadFromSheetCell(minIncomeRaw);

    const saRow = getScenarioRow("serviceArea");
    const saAnswer = getScenarioValue("serviceArea", column).trim();
    const saReasonCell =
      reasonColumn !== undefined && saRow ? (saRow[reasonColumn] ?? "").trim() : "";
    const serviceCellRaw = [saAnswer, saReasonCell].filter(Boolean).join(" ").trim() || saAnswer;
    const serviceAreaInfo = parseServiceAreaFromCell(serviceCellRaw);

    const minScoreCell = getScenarioValue("minScore", column);
    const maxLtvCell = getScenarioValue("maxLTV", column);

    const notesParts = [
      getScenarioValue("maxLTV", column),
      openBkGuideline,
      getScenarioValue("allowsSelfEmployed", column)
    ]
      .map((item) => (item ?? "").trim())
      .filter((item) => item.length > 0);

    const urlsAbove = collectHttpUrlsAboveColumn(rows, lenderHeaderIndex, column);
    const { website, bookingGuide } = splitWebsiteAndBooking(urlsAbove);
    const websiteUrl =
      normalizeWebsiteUrl(website) ||
      findNearestWebsiteForColumn(rows, lenderHeaderIndex, column) ||
      inferWebsiteFromLenderName(name);
    const bookingGuideUrl = normalizeWebsiteUrl(bookingGuide);

    return {
      lenderName: name,
      websiteUrl,
      bookingGuideUrl,
      minScore,
      maxLTV,
      allowsOpenBK,
      allowsRepo: repoResolved.allows,
      allowsSelfEmployed: parseGuidelineBoolean(selfEmployedCell),
      allowsNewToCanada: ntcResolved.allows,
      allowsYoungBuyer: ybResolved.allows,
      allowsSecondUnit: suResolved.allows,
      allowsNativeStatus: nsResolved.allows,
      allowsShortJobTenureTwoJobs,
      hasShortJobTenureTwoJobsMatrixRow: hasShortJobTenureTwoJobsRow,
      minJobTenureMonths,
      minAddressTenureMonths,
      allowsAishIncome,
      allowsDisabilityIncome,
      allowsDisabilityProgramIncome,
      allowsChildTaxIncome,
      minPaymentCad,
      maxPaymentCad,
      minIncomeCad,
      notes: notesParts.join(" | "),
      guidelineTexts: {
        openBK: openBkGuideline,
        repo: (repoResolved.display || repoAnswer).trim(),
        selfEmployed: selfEmployedCell.trim(),
        newToCanada: (ntcResolved.display || newToCanadaAnswer).trim(),
        secondUnit: (suResolved.display || suAnswer).trim(),
        nativeStatus: (nsResolved.display || nsAnswer).trim(),
        youngBuyer: (ybResolved.display || ybAnswer).trim(),
        serviceArea: serviceCellRaw,
        minScore: minScoreCell.trim(),
        maxLTV: maxLtvCell.trim(),
        jobTenure: minJobTenureRaw.trim(),
        shortJobTenureTwoJobs: (shortTwoJobsResolved.display || shortTwoJobsAnswer).trim(),
        addressTenure: minAddressTenureRaw.trim(),
        incomeAish: hasDisabilityProgramMatrixRow
          ? incomeDisabilityProgramText
          : (aishResolved.display || aishAnswer).trim(),
        incomeDisability: hasDisabilityProgramMatrixRow
          ? incomeDisabilityProgramText
          : (disabilityResolved.display || disabilityAnswer).trim(),
        incomeDisabilityProgram: incomeDisabilityProgramText,
        incomeChildTax: (childTaxResolved.display || childTaxAnswer).trim(),
        incomeWaive: incomeWaiveRaw.trim(),
        minPayment: minPaymentRaw.trim(),
        maxPayment: maxPaymentRaw.trim(),
        minIncome: minIncomeRaw.trim()
      },
      openBKScenario,
      repoScenario: repoResolved.scenario,
      newToCanadaScenario: ntcResolved.scenario,
      youngBuyerScenario: ybResolved.scenario,
      secondUnitScenario: suResolved.scenario,
      nativeStatusScenario: nsResolved.scenario,
      incomeAishScenario,
      incomeDisabilityScenario,
      incomeDisabilityProgramScenario,
      incomeChildTaxScenario: childTaxResolved.scenario,
      shortJobTenureTwoJobsScenario,
      serviceArea: serviceAreaInfo
    };
  });

  return { lenders, skippedRows: 0 };
}

export function parseLendersFromCsvText(csvText: string): ParseResult {
  const structured = Papa.parse<CsvRow>(csvText, {
    header: true,
    skipEmptyLines: true
  });
  const structuredResult = parseLenderRows(structured.data);
  if (structuredResult.lenders.length > 0) {
    return structuredResult;
  }

  const matrix = Papa.parse<string[]>(csvText, {
    header: false,
    skipEmptyLines: false
  });
  return parseLenderMatrix(matrix.data);
}