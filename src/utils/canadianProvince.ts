/** Canadian province/territory codes (ISO-style) to display names. */
export const CANADIAN_PROVINCE_NAMES: Record<string, string> = {
  AB: "Alberta",
  BC: "British Columbia",
  MB: "Manitoba",
  NB: "New Brunswick",
  NL: "Newfoundland and Labrador",
  NS: "Nova Scotia",
  NT: "Northwest Territories",
  NU: "Nunavut",
  ON: "Ontario",
  PE: "Prince Edward Island",
  QC: "Quebec",
  SK: "Saskatchewan",
  YT: "Yukon"
};

export const CANADIAN_PROVINCE_CODES = Object.keys(CANADIAN_PROVINCE_NAMES) as (keyof typeof CANADIAN_PROVINCE_NAMES)[];

/** Map a stored code or full name back to a 2-letter code for selects. */
export function normalizeCanadianProvinceCode(value: string | null | undefined): string {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) {
    return "";
  }
  const upper = trimmed.toUpperCase();
  if (CANADIAN_PROVINCE_NAMES[upper]) {
    return upper;
  }
  const match = CANADIAN_PROVINCE_CODES.find(
    (code) => CANADIAN_PROVINCE_NAMES[code].toLowerCase() === trimmed.toLowerCase()
  );
  return match ?? trimmed;
}

/** Expand a 2-letter code (e.g. ON) to a full name (e.g. Ontario). Leaves unknown values unchanged. */
export function formatCanadianProvince(value: string | null | undefined): string {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) {
    return "";
  }
  const code = trimmed.toUpperCase();
  return CANADIAN_PROVINCE_NAMES[code] ?? trimmed;
}

/** Normalize province abbreviations inside ingested system-lead comment bodies. */
export function formatSystemLeadCommentBody(body: string): string {
  if (!body.trim()) {
    return body;
  }

  return body
    .split("\n")
    .map((line) => {
      const provinceLine = line.match(/^Province \/ territory:\s*(.+)$/i);
      if (provinceLine) {
        return `Province / territory: ${formatCanadianProvince(provinceLine[1])}`;
      }

      const fullAddressLine = line.match(/^Full address \(single line\):\s*(.+)$/i);
      if (fullAddressLine) {
        const parts = fullAddressLine[1].split(",").map((part) => part.trim());
        if (parts.length > 0) {
          const lastIndex = parts.length - 1;
          parts[lastIndex] = formatCanadianProvince(parts[lastIndex]);
        }
        return `Full address (single line): ${parts.join(", ")}`;
      }

      return line;
    })
    .join("\n");
}
