import { useMemo, useState } from "react";

const DOMAIN_ALIASES: Array<{ pattern: RegExp; aliases: string[] }> = [
  { pattern: /(^|\.)iaautofinance\.ca$/i, aliases: ["ia.ca"] },
  { pattern: /(^|\.)ia\.ca$/i, aliases: ["ia.ca"] }
];

const LENDER_PRIORITY_LOCAL_LOGO: Array<{ pattern: RegExp; url: string }> = [
  { pattern: /\biA\b|ia\s+auto/i, url: "/logos/ia.svg" }
];

function getPriorityLocalLogoUrl(lenderName: string): string {
  const match = LENDER_PRIORITY_LOCAL_LOGO.find((entry) => entry.pattern.test(lenderName));
  return match?.url ?? "";
}

function getCandidateDomains(lenderName: string, websiteUrl: string): string[] {
  const domains: string[] = [];

  if (websiteUrl) {
    try {
      const host = new URL(websiteUrl).hostname.replace(/^www\./, "");
      domains.push(host);
      for (const aliasRule of DOMAIN_ALIASES) {
        if (aliasRule.pattern.test(host)) {
          domains.push(...aliasRule.aliases);
        }
      }
    } catch {
      // ignore malformed URL
    }
  }

  const normalizedName = lenderName.toLowerCase().replace(/[^a-z0-9]+/g, "");
  if (normalizedName) {
    domains.push(`${normalizedName}.com`, `${normalizedName}.ca`);
  }

  return Array.from(new Set(domains));
}

function buildLogoSources(domains: string[]): string[] {
  const urls: string[] = [];
  for (const domain of domains) {
    urls.push(
      `https://logo.clearbit.com/${domain}`,
      `https://www.google.com/s2/favicons?sz=128&domain=${encodeURIComponent(domain)}`,
      `https://icons.duckduckgo.com/ip3/${domain}.ico`
    );
  }
  return urls;
}

export interface LenderLogoProps {
  lenderName: string;
  websiteUrl: string;
  /** Applied to img or fallback initials box */
  className?: string;
  loading?: "lazy" | "eager";
  /** Omit or pass "" when the lender name is already adjacent (decorative). */
  alt?: string;
}

export function LenderLogo({
  lenderName,
  websiteUrl,
  className = "lenderLogo",
  loading = "lazy",
  alt
}: LenderLogoProps) {
  const [logoSourceIndex, setLogoSourceIndex] = useState(0);
  const candidateDomains = getCandidateDomains(lenderName, websiteUrl);
  const priorityLocalLogo = getPriorityLocalLogoUrl(lenderName);
  const logoSources = priorityLocalLogo
    ? [priorityLocalLogo, ...buildLogoSources(candidateDomains)]
    : buildLogoSources(candidateDomains);
  const logoUrl = logoSources[logoSourceIndex] ?? "";

  const lenderInitials = useMemo(
    () =>
      lenderName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join(""),
    [lenderName]
  );

  const imgAlt = alt === "" ? "" : alt ?? `${lenderName} logo`;

  if (logoUrl) {
    return (
      <img
        className={className}
        src={logoUrl}
        alt={imgAlt}
        loading={loading}
        onError={() => setLogoSourceIndex((current) => current + 1)}
      />
    );
  }

  if (imgAlt === "") {
    return (
      <div className={`${className} fallbackLogo`.trim()} aria-hidden>
        {lenderInitials}
      </div>
    );
  }

  return (
    <div className={`${className} fallbackLogo`.trim()} role="img" aria-label={imgAlt}>
      {lenderInitials}
    </div>
  );
}

export function getLenderWebsiteDomain(lenderName: string, websiteUrl: string): string {
  return getCandidateDomains(lenderName, websiteUrl)[0] ?? "";
}
