import { useMemo, useState } from "react";
import type { EvaluatedLender } from "../types/lender";

interface LenderCardProps {
  result: EvaluatedLender;
}

const LENDER_LOGO_DOMAIN_OVERRIDES: Array<{ pattern: RegExp; domains: string[] }> = [
  { pattern: /\biA\b|ia\s+auto/i, domains: ["ia.ca"] },
  { pattern: /santander/i, domains: ["santanderconsumer.ca"] },
  { pattern: /source\s*one/i, domains: ["sourceonefinancial.ca"] },
  { pattern: /\bacc\b|autocapital/i, domains: ["autocapitalcanada.com"] }
];

const LENDER_LOCAL_LOGOS: Array<{ pattern: RegExp; url: string }> = [
  { pattern: /\biA\b|ia\s+auto/i, url: "/logos/ia.svg" },
  { pattern: /santander/i, url: "/logos/santander.svg" },
  { pattern: /source\s*one/i, url: "/logos/source-one.svg" },
  { pattern: /\bacc\b|autocapital/i, url: "/logos/acc.svg" }
];

function getLocalLogoUrl(lenderName: string): string {
  const match = LENDER_LOCAL_LOGOS.find((entry) => entry.pattern.test(lenderName));
  return match?.url ?? "";
}

function getCandidateDomains(lenderName: string, websiteUrl: string): string[] {
  const domains: string[] = [];

  if (websiteUrl) {
    try {
      domains.push(new URL(websiteUrl).hostname.replace(/^www\./, ""));
    } catch {
      // ignore malformed URL and continue with overrides
    }
  }

  for (const entry of LENDER_LOGO_DOMAIN_OVERRIDES) {
    if (entry.pattern.test(lenderName)) {
      domains.push(...entry.domains);
    }
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

function getRiskTier(minScore: number): "Prime" | "Near-prime" | "Subprime" {
  if (minScore >= 680) {
    return "Prime";
  }
  if (minScore >= 620) {
    return "Near-prime";
  }
  return "Subprime";
}

function outcomeLabel(outcome: EvaluatedLender["outcome"]): string {
  return outcome.charAt(0).toUpperCase() + outcome.slice(1);
}

export function LenderCard({ result }: LenderCardProps) {
  const {
    lender,
    outcome,
    declineReasons,
    conditionalReasons,
    eligibleReasons,
    selectedProvinceCode,
    servicesSelectedProvince
  } = result;
  const [logoSourceIndex, setLogoSourceIndex] = useState(0);
  const candidateDomains = getCandidateDomains(lender.lenderName, lender.websiteUrl);
  const localLogoUrl = getLocalLogoUrl(lender.lenderName);
  const logoSources = localLogoUrl ? [localLogoUrl, ...buildLogoSources(candidateDomains)] : buildLogoSources(candidateDomains);
  const logoUrl = logoSources[logoSourceIndex] ?? "";
  const lenderInitials = useMemo(
    () =>
      lender.lenderName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join(""),
    [lender.lenderName]
  );
  const riskTier = getRiskTier(lender.minScore);
  const websiteDomain = candidateDomains[0] ?? "";

  const cardOutcomeClass =
    outcome === "ineligible" ? "ineligible" : outcome === "conditional" ? "conditional" : "eligible";

  return (
    <article className={`lenderCard ${cardOutcomeClass}`.trim()}>
      {lender.websiteUrl ? (
        <div className="lenderBrand">
          {logoUrl ? (
            <img
              className="lenderLogo"
              src={logoUrl}
              alt={`${lender.lenderName} logo`}
              loading="lazy"
              onError={() => setLogoSourceIndex((current) => current + 1)}
            />
          ) : (
            <div className="lenderLogo fallbackLogo" aria-label={`${lender.lenderName} initials`}>
              {lenderInitials}
            </div>
          )}
          <a className="lenderLink" href={lender.websiteUrl} target="_blank" rel="noreferrer">
            Visit lender website
          </a>
          {websiteDomain ? <span className="lenderDomain">{websiteDomain}</span> : null}
        </div>
      ) : null}

      <header className="cardHeader">
        <div className="cardTitleRow">
          <h3>{lender.lenderName}</h3>
          <div className="cardBadges">
            <span className={`riskTag risk-${riskTier.toLowerCase()}`}>{riskTier}</span>
            <span className={`outcomeBadge outcome-${outcome} inlineOutcome`}>{outcomeLabel(outcome)}</span>
          </div>
        </div>
      </header>

      {selectedProvinceCode != null && servicesSelectedProvince === false ? (
        <p className="provinceServiceLine provinceServiceLineBad" role="status">
          {`Not serviced in ${selectedProvinceCode}`}
        </p>
      ) : null}

      {outcome === "conditional" ? (
        <div className="conditionalOutcomeBlock">
          {conditionalReasons.length > 0 ? (
            <p className="conditionalReasonBadge">{conditionalReasons.join("\n")}</p>
          ) : (
            <p className="conditionalReasonBadge conditionalReasonMuted">See program notes.</p>
          )}
          {eligibleReasons.length > 0 ? (
            <div className="eligibleSituationStack" role="status" aria-label="Also accepted">
              {eligibleReasons.map((line) => (
                <p key={line} className="eligibleReasonBadge eligibleSituationLine">
                  {line}
                </p>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {outcome === "ineligible" ? (
        <p className="declineBadge">{declineReasons.join("\n")}</p>
      ) : null}
    </article>
  );
}
