export type CrmColorMode = "dark" | "light";

import { CRM_TENANT_DEFAULT_COLOR_MODE } from "./crmTenantDefaults";

export const CRM_DEFAULT_COLOR_MODE: CrmColorMode = CRM_TENANT_DEFAULT_COLOR_MODE;

const COLOR_MODE_CACHE_KEY = "crm-color-mode";

export function normalizeCrmColorMode(value: unknown): CrmColorMode {
  return value === "light" ? "light" : "dark";
}

export function readCachedCrmColorMode(): CrmColorMode | null {
  try {
    const raw = localStorage.getItem(COLOR_MODE_CACHE_KEY);
    if (raw === "light" || raw === "dark") {
      return raw;
    }
    return null;
  } catch {
    return null;
  }
}

export function writeCachedCrmColorMode(mode: CrmColorMode) {
  try {
    localStorage.setItem(COLOR_MODE_CACHE_KEY, mode);
  } catch {
    /* ignore */
  }
}

export function applyCrmColorMode(mode: CrmColorMode, options?: { persistCache?: boolean }) {
  const normalized = normalizeCrmColorMode(mode);
  document.documentElement.classList.toggle("theme-crm-light", normalized === "light");
  if (options?.persistCache !== false) {
    writeCachedCrmColorMode(normalized);
  }
}

export function currentCrmColorMode(): CrmColorMode {
  return document.documentElement.classList.contains("theme-crm-light") ? "light" : "dark";
}
