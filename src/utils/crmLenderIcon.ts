import type { CrmLenderConfig } from "../types/crm";
import { resolveCrmBrandingPublicUrl } from "./crmBrandingAssets";

export function lenderFallbackInitials(_slug: string, label: string): string {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export function normalizeLenderIconDomain(raw: string): string | null {
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) {
    return null;
  }
  const withoutProtocol = trimmed.replace(/^https?:\/\//, "").replace(/^www\./, "");
  const host = withoutProtocol.split("/")[0]?.split("?")[0]?.trim() ?? "";
  if (!host || !host.includes(".")) {
    return null;
  }
  if (host.length > 120) {
    return null;
  }
  return host;
}

export function faviconCandidateUrls(domain: string): string[] {
  const host = normalizeLenderIconDomain(domain);
  if (!host) {
    return [];
  }
  const q = encodeURIComponent(host);
  return [
    `https://logo.clearbit.com/${host}`,
    `https://www.google.com/s2/favicons?domain=${q}&sz=64`,
    `https://icons.duckduckgo.com/ip3/${host}.ico`,
    `https://${host}/favicon.ico`
  ];
}

export function lenderLogoCandidateUrls(lender: Pick<CrmLenderConfig, "slug" | "icon_domain" | "custom_icon_path"> & {
  updated_at?: string | null;
}): string[] {
  if (lender.custom_icon_path) {
    return [resolveCrmBrandingPublicUrl(lender.custom_icon_path, lender.updated_at)];
  }
  return faviconCandidateUrls(lender.icon_domain);
}

type ClearbitSuggestion = {
  name: string;
  domain: string;
};

export async function lookupLenderDomainFromName(name: string): Promise<string | null> {
  const trimmed = name.trim();
  if (!trimmed) {
    return null;
  }
  try {
    const response = await fetch(
      `https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(trimmed)}`
    );
    if (!response.ok) {
      return null;
    }
    const suggestions = (await response.json()) as ClearbitSuggestion[];
    const domain = suggestions[0]?.domain?.trim();
    return domain ? normalizeLenderIconDomain(domain) : null;
  } catch {
    return null;
  }
}
