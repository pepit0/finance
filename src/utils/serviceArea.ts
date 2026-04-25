import type { ServiceAreaInfo } from "../types/lender";

const CANADA_WIDE_RE =
  /\bcanada\s*wide\b|\bcanadawide\b|\bnationwide\b|\ball\s+provinces\b|\ball\s+of\s+canada\b|\bpan[\s-]?canadian\b|\bentire\s+country\b/i;

const PROVINCE_CODE_RE = /\b(AB|BC|MB|NB|NL|NS|NT|NU|ON|PE|QC|SK|YT)\b/gi;

export function extractProvinceCodes(text: string): string[] {
  const codes: string[] = [];
  let match: RegExpExecArray | null;
  const re = new RegExp(PROVINCE_CODE_RE.source, "gi");
  while ((match = re.exec(text)) !== null) {
    codes.push(match[1].toUpperCase());
  }
  return [...new Set(codes)];
}

function isDenylistIntent(text: string): boolean {
  const t = text.toLowerCase();
  if (/\bexcept\b|\bexcluding\b|\bexclude\b/.test(t)) {
    return true;
  }
  if (/\b(?:not\s+available|unavailable)\s+(?:in|for)\b/.test(t)) {
    return true;
  }
  if (/\b(?:does|do)\s*not\s+(?:service|finance|lend|fund)\b/.test(t)) {
    return true;
  }
  if (/\bno\s+service\s+(?:in|to|for)\b/.test(t)) {
    return true;
  }
  if (/^\s*not\s*[:\-–]\s*/i.test(text)) {
    return true;
  }
  if (/\bnot\s+servic/i.test(t)) {
    return true;
  }
  if (/\bdoes\s*n'?t\s+service\b/.test(t)) {
    return true;
  }
  if (/\bnot\s+in\b/i.test(t)) {
    return true;
  }
  // e.g. "NOT ON, BC" or "NO: QC" listing provinces they skip
  if (/^\s*(?:not|no)\s*[:\-–]?\s*(?=[A-Z]{2}\b)/i.test(text)) {
    return true;
  }
  return false;
}

/**
 * Interprets a service-area cell: Canada-wide, comma-separated provinces served, or wording that lists provinces not served.
 */
export function parseServiceAreaFromCell(raw: string): ServiceAreaInfo {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { canadaWide: true, isDenylist: false, provinces: [], raw: "" };
  }

  if (CANADA_WIDE_RE.test(trimmed)) {
    return { canadaWide: true, isDenylist: false, provinces: [], raw: trimmed };
  }

  const codes = extractProvinceCodes(trimmed);
  if (codes.length === 0) {
    return { canadaWide: true, isDenylist: false, provinces: [], raw: trimmed };
  }

  if (isDenylistIntent(trimmed)) {
    return { canadaWide: false, isDenylist: true, provinces: codes, raw: trimmed };
  }

  return { canadaWide: false, isDenylist: false, provinces: codes, raw: trimmed };
}

/** Whether `provinceCode` (e.g. ON) is within the lender’s service area. */
export function provinceMatchesServiceArea(area: ServiceAreaInfo, provinceCode: string): boolean {
  const code = provinceCode.trim().toUpperCase();
  if (!code) {
    return true;
  }
  if (area.canadaWide) {
    return true;
  }
  if (area.isDenylist) {
    return !area.provinces.includes(code);
  }
  return area.provinces.includes(code);
}
