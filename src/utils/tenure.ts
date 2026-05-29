export type ParsedTenure = {
  years: string;
  months: string;
};

/** Canonical storage: `years|months` (years is 0–30 or `30+`, months 0–11). */
export function formatTenure(years: string, months: string): string {
  const y = years.trim();
  const m = months.trim();
  if (!y && !m) {
    return "";
  }
  return `${y}|${m}`;
}

export function parseTenure(value: string | null | undefined): ParsedTenure {
  const raw = String(value ?? "").trim();
  if (!raw) {
    return { years: "", months: "" };
  }

  if (raw.includes("|")) {
    const [yearsPart, monthsPart] = raw.split("|");
    const years = normalizeYearsToken(yearsPart?.trim() ?? "");
    const months = normalizeMonthsToken(monthsPart?.trim() ?? "");
    return { years, months };
  }

  const legacy = parseLegacyTenure(raw);
  if (legacy) {
    return legacy;
  }

  return parseFreeTextTenure(raw);
}

function normalizeYearsToken(token: string): string {
  if (!token) {
    return "";
  }
  if (token === "30+" || token.toLowerCase() === "30plus") {
    return "30+";
  }
  const n = Number(token);
  if (Number.isFinite(n) && n >= 0 && n <= 30) {
    return String(Math.floor(n));
  }
  return token;
}

function normalizeMonthsToken(token: string): string {
  if (!token) {
    return "";
  }
  const n = Number(token);
  if (Number.isFinite(n) && n >= 0 && n <= 11) {
    return String(Math.floor(n));
  }
  return token;
}

function parseLegacyTenure(raw: string): ParsedTenure | null {
  const key = raw.toLowerCase().replace(/[\s-]+/g, "_");
  switch (key) {
    case "under_1_year":
    case "under_1_years":
      return { years: "0", months: "6" };
    case "1_to_2_years":
    case "1_2_years":
      return { years: "1", months: "6" };
    case "3_to_5_years":
      return { years: "4", months: "0" };
    case "over_5_years":
    case "5_plus_years":
      return { years: "6", months: "0" };
    case "prefer_not_to_say":
      return { years: "", months: "" };
    default:
      return null;
  }
}

function parseFreeTextTenure(raw: string): ParsedTenure {
  const lower = raw.toLowerCase();
  if (lower.includes("30+") || lower.includes("30 plus")) {
    const monthMatch = lower.match(/(\d+)\s*month/);
    return { years: "30+", months: monthMatch ? normalizeMonthsToken(monthMatch[1]) : "0" };
  }

  const yearMatch = lower.match(/(\d+)\s*year/);
  const monthMatch = lower.match(/(\d+)\s*month/);
  if (yearMatch || monthMatch) {
    const years = yearMatch ? normalizeYearsToken(yearMatch[1]) : "0";
    const months = monthMatch ? normalizeMonthsToken(monthMatch[1]) : "0";
    return { years, months };
  }

  const numeric = Number(raw.replace(/[^0-9.]/g, ""));
  if (Number.isFinite(numeric) && raw.match(/year/i)) {
    if (numeric >= 30) {
      return { years: "30+", months: "0" };
    }
    return { years: normalizeYearsToken(String(Math.floor(numeric))), months: "0" };
  }

  return { years: "", months: "" };
}

export function isTenureComplete(value: string | null | undefined): boolean {
  const { years, months } = parseTenure(value);
  return years !== "" && months !== "";
}

/** True when total time is strictly under 24 months. */
export function isTenureUnderTwoYears(value: string | null | undefined): boolean {
  const { years, months } = parseTenure(value);
  if (!isTenureComplete(value)) {
    return false;
  }
  const totalMonths = tenureTotalMonths(years, months);
  return totalMonths < 24;
}

function tenureTotalMonths(years: string, months: string): number {
  const monthPart = Number(months);
  const monthCount = Number.isFinite(monthPart) ? monthPart : 0;
  if (years === "30+") {
    return 30 * 12 + monthCount;
  }
  const yearPart = Number(years);
  const yearCount = Number.isFinite(yearPart) ? yearPart : 0;
  return yearCount * 12 + monthCount;
}

export function formatTenureDisplay(value: string | null | undefined): string {
  const { years, months } = parseTenure(value);
  if (!isTenureComplete(value)) {
    return "";
  }
  if (years === "30+") {
    const m = Number(months);
    return m > 0 ? `30+ years, ${m} month${m === 1 ? "" : "s"}` : "30+ years";
  }
  const y = Number(years);
  const m = Number(months);
  const parts: string[] = [];
  if (y > 0) {
    parts.push(`${y} year${y === 1 ? "" : "s"}`);
  }
  if (m > 0) {
    parts.push(`${m} month${m === 1 ? "" : "s"}`);
  }
  if (parts.length === 0) {
    return "0 years, 0 months";
  }
  return parts.join(", ");
}

export const TENURE_YEAR_OPTIONS: { value: string; label: string }[] = [
  ...Array.from({ length: 31 }, (_, i) => ({
    value: String(i),
    label: i === 1 ? "1 year" : `${i} years`
  })),
  { value: "30+", label: "30+ years" }
];

export const TENURE_MONTH_OPTIONS: { value: string; label: string }[] = Array.from({ length: 12 }, (_, i) => ({
  value: String(i),
  label: i === 1 ? "1 month" : `${i} months`
}));
