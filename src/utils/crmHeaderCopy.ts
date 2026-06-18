export const CRM_DEFAULT_HEADER_TITLE = "CRM";
export const CRM_DEFAULT_HEADER_SUBTITLE = "Customers, calls, and notes";
export const CRM_DEFAULT_FOOTER_TEXT = "";
export const CRM_DEFAULT_APP_VERSION = "0.0.0";

export const CRM_HEADER_TITLE_MAX = 120;
export const CRM_HEADER_SUBTITLE_MAX = 200;

export function normalizeCrmHeaderTitle(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > CRM_HEADER_TITLE_MAX) {
    return null;
  }
  return trimmed;
}

export function normalizeCrmHeaderSubtitle(raw: string): string | null {
  const trimmed = raw.trim();
  if (trimmed.length > CRM_HEADER_SUBTITLE_MAX) {
    return null;
  }
  return trimmed;
}

export function parseCrmHeaderTitle(raw: string | null | undefined): string {
  if (raw == null || raw === "") {
    return CRM_DEFAULT_HEADER_TITLE;
  }
  return normalizeCrmHeaderTitle(raw) ?? CRM_DEFAULT_HEADER_TITLE;
}

export function parseCrmHeaderSubtitle(raw: string | null | undefined): string {
  if (raw == null) {
    return CRM_DEFAULT_HEADER_SUBTITLE;
  }
  return normalizeCrmHeaderSubtitle(raw) ?? CRM_DEFAULT_HEADER_SUBTITLE;
}
