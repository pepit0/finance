/**
 * Maps CSV `lenderName` (exact string) to a PDF filename under `/lender-guides/`.
 * Add an entry when you drop `filename.pdf` into `public/lender-guides/`.
 */
export const LENDER_BOOKING_GUIDE_FILES: Record<string, string> = {
  // Example:
  // "iA Auto Finance": "ia-auto-finance.pdf",
};

function normalizeKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function sanitizePdfFilename(file: string): string | null {
  const safe = file.replace(/^\/+/, "").replace(/\.\./g, "");
  if (!safe || !/\.pdf$/i.test(safe)) {
    return null;
  }
  return safe;
}

export function getBookingGuideUrl(lenderName: string): string | null {
  const direct = LENDER_BOOKING_GUIDE_FILES[lenderName];
  const normalized = normalizeKey(lenderName);
  const normalizedMatch =
    Object.entries(LENDER_BOOKING_GUIDE_FILES).find(([key]) => normalizeKey(key) === normalized)?.[1] ?? null;

  const configuredFile = direct ?? normalizedMatch ?? null;
  const sanitizedConfigured = configuredFile ? sanitizePdfFilename(configuredFile) : null;
  if (sanitizedConfigured) {
    return `/lender-guides/${sanitizedConfigured}`;
  }
  return null;
}
