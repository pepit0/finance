import { isCrmProduct, isFinanceProduct, isFullProduct } from "./productMode";

function trimUrl(value: unknown): string | null {
  const trimmed = String(value ?? "").trim();
  return trimmed || null;
}

export function crmAppUrl(): string | null {
  return trimUrl(import.meta.env.VITE_CRM_APP_URL);
}

export function financeAppUrl(): string | null {
  return trimUrl(import.meta.env.VITE_FINANCE_APP_URL);
}

/** CRM link for finance-only builds (internal route or external URL). */
export function resolveCrmHref(): string {
  if (isFullProduct()) {
    return "/crm";
  }
  return crmAppUrl() ?? "/crm";
}

/** Finance link for CRM-only builds (internal route or external URL). */
export function resolveFinanceHref(): string {
  if (isFullProduct()) {
    return "/";
  }
  return financeAppUrl() ?? "/";
}

export function shouldUseExternalCrmLink(): boolean {
  return isFinanceProduct() && Boolean(crmAppUrl());
}

export function shouldUseExternalFinanceLink(): boolean {
  return isCrmProduct() && Boolean(financeAppUrl());
}

export function navigateToFinanceHome(navigate: (path: string) => void): void {
  const href = resolveFinanceHref();
  if (shouldUseExternalFinanceLink()) {
    window.location.assign(href);
    return;
  }
  navigate(href);
}

export function navigateToCrmHome(navigate: (path: string) => void): void {
  const href = resolveCrmHref();
  if (shouldUseExternalCrmLink()) {
    window.location.assign(href);
    return;
  }
  navigate(href);
}
