export type CreditAppNameParts = {
  first_name: string;
  middle_name: string;
  last_name: string;
};

/** Split a legacy single-line name into first / middle / last. */
export function splitPersonName(displayName: string): CreditAppNameParts {
  const trimmed = displayName.trim();
  if (!trimmed) {
    return { first_name: "", middle_name: "", last_name: "" };
  }
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return { first_name: parts[0], middle_name: "", last_name: "" };
  }
  if (parts.length === 2) {
    return { first_name: parts[0], middle_name: "", last_name: parts[1] };
  }
  return {
    first_name: parts[0],
    middle_name: parts.slice(1, -1).join(" "),
    last_name: parts[parts.length - 1]
  };
}

export function formatCreditAppLegalName(parts: CreditAppNameParts): string {
  return [parts.first_name, parts.middle_name, parts.last_name]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ");
}

/** Default PDF / print save name: "First Last - creditapp" or "First Middle Last - creditapp". */
export function formatCreditAppSaveFilename(parts: CreditAppNameParts, fallbackName = ""): string {
  const name = formatCreditAppLegalName(parts) || fallbackName.trim();
  return name ? `${name} - creditapp` : "creditapp";
}

export function sanitizePrintDocumentTitle(title: string): string {
  return title.replace(/[\\/:*?"<>|]/g, "").trim() || "creditapp";
}

export function normalizeCreditAppNameParts(
  raw: Partial<CreditAppNameParts> & { display_name?: string },
  fallbackDisplayName = ""
): CreditAppNameParts {
  let first_name = String(raw.first_name ?? "").trim();
  let middle_name = String(raw.middle_name ?? "").trim();
  let last_name = String(raw.last_name ?? "").trim();
  const legacyName = String(raw.display_name ?? "").trim();

  if (!first_name && !last_name) {
    const source = legacyName || fallbackDisplayName.trim();
    if (source) {
      const split = splitPersonName(source);
      first_name = split.first_name;
      middle_name = middle_name || split.middle_name;
      last_name = split.last_name;
    }
  }

  return { first_name, middle_name, last_name };
}
