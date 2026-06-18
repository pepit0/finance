export type ProductMode = "full" | "finance" | "crm";

function parseProductMode(raw: unknown): ProductMode {
  const value = String(raw ?? "full").trim().toLowerCase();
  if (value === "crm" || value === "finance") {
    return value;
  }
  return "full";
}

export const PRODUCT_MODE: ProductMode = parseProductMode(import.meta.env.VITE_PRODUCT);

export function isFullProduct(): boolean {
  return PRODUCT_MODE === "full";
}

export function isFinanceProduct(): boolean {
  return PRODUCT_MODE === "finance";
}

export function isCrmProduct(): boolean {
  return PRODUCT_MODE === "crm";
}

export function isCrmRoute(pathname: string): boolean {
  if (isCrmProduct()) {
    return true;
  }
  return pathname.startsWith("/crm");
}

export function defaultAuthenticatedPath(): string {
  if (isCrmProduct()) {
    return "/crm";
  }
  return "/";
}

export function loginTitle(): string {
  if (isCrmProduct()) {
    return "CRM";
  }
  if (isFinanceProduct()) {
    return "Car Finance Dashboard";
  }
  return "Car Finance Dashboard";
}

export function loginSubtitle(): string {
  if (isCrmProduct()) {
    return "Sign in to continue";
  }
  if (isFinanceProduct()) {
    return "Internal login";
  }
  return "Internal login";
}
