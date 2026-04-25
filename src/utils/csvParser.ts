import Papa from "papaparse";
import type { EligibilityVerdict, Lender, LenderGuidelineTexts, ParseResult, ScenarioVerdict } from "../types/lender";

function emptyGuidelineTexts(): LenderGuidelineTexts {
  return {
    openBK: "",
    repo: "",
    selfEmployed: "",
    newToCanada: "",
    minScore: "",
    maxLTV: ""
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

    lenders.push({
      lenderName,
      websiteUrl: normalizeWebsiteUrl(normalized.websiteurl || normalized.website || normalized.url),
      minScore,
      maxLTV,
      allowsOpenBK,
      allowsRepo,
      allowsSelfEmployed,
      allowsNewToCanada,
      notes: normalized.notes || normalized.stips || "",
      guidelineTexts: emptyGuidelineTexts(),
      openBKScenario: null,
      repoScenario: null,
      newToCanadaScenario: null
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
  allowsNewToCanada: ["900sin"]
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
  const normalized = (value ?? "").trim().toLowerCase();
  return /^(https?:\/\/|www\.)/.test(normalized);
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

function findNearestWebsiteRow(rows: string[][], lenderHeaderIndex: number): string[] {
  for (let index = lenderHeaderIndex - 1; index >= 0; index -= 1) {
    const row = rows[index] ?? [];
    if (row.some((cell) => isLikelyWebsite(cell))) {
      return row;
    }
  }

  return [];
}

function findNearestWebsiteForColumn(rows: string[][], lenderHeaderIndex: number, columnIndex: number): string {
  for (let index = lenderHeaderIndex - 1; index >= 0; index -= 1) {
    const value = rows[index]?.[columnIndex];
    if (isLikelyWebsite(value)) {
      return normalizeWebsiteUrl(value);
    }
  }

  return "";
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
        /\biA\b|santander|go-?plan|eden park|lendcare|source one|scotia|td|acc|tcl|rifco/i.test(
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
  const websiteRow = lenderHeaderIndex > 0 ? findNearestWebsiteRow(rows, lenderHeaderIndex) : [];

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
    const minScoreCell = getScenarioValue("minScore", column);
    const maxLtvCell = getScenarioValue("maxLTV", column);

    const notesParts = [
      getScenarioValue("maxLTV", column),
      openBkGuideline,
      getScenarioValue("allowsSelfEmployed", column)
    ]
      .map((item) => (item ?? "").trim())
      .filter((item) => item.length > 0);

    const websiteUrl =
      normalizeWebsiteUrl(websiteRow[column]) ||
      findNearestWebsiteForColumn(rows, lenderHeaderIndex, column) ||
      inferWebsiteFromLenderName(name);

    return {
      lenderName: name,
      websiteUrl,
      minScore,
      maxLTV,
      allowsOpenBK,
      allowsRepo: repoResolved.allows,
      allowsSelfEmployed: parseGuidelineBoolean(selfEmployedCell),
      allowsNewToCanada: ntcResolved.allows,
      notes: notesParts.join(" | "),
      guidelineTexts: {
        openBK: openBkGuideline,
        repo: (repoResolved.display || repoAnswer).trim(),
        selfEmployed: selfEmployedCell.trim(),
        newToCanada: (ntcResolved.display || newToCanadaAnswer).trim(),
        minScore: minScoreCell.trim(),
        maxLTV: maxLtvCell.trim()
      },
      openBKScenario,
      repoScenario: repoResolved.scenario,
      newToCanadaScenario: ntcResolved.scenario
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