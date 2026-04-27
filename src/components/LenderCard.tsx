import { useCallback } from "react";
import type { EvaluatedLender } from "../types/lender";
import { getLenderWebsiteDomain, LenderLogo } from "./LenderLogo";

interface LenderCardProps {
  result: EvaluatedLender;
  selected: boolean;
  onToggleSelect: (lenderName: string) => void;
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

export function LenderCard({ result, selected, onToggleSelect }: LenderCardProps) {
  const {
    lender,
    outcome,
    declineReasons,
    conditionalReasons,
    eligibleReasons,
    selectedProvinceCode,
    servicesSelectedProvince
  } = result;

  const selectable = outcome !== "ineligible";
  const riskTier = getRiskTier(lender.minScore);
  const websiteDomain = getLenderWebsiteDomain(lender.lenderName, lender.websiteUrl);

  const cardOutcomeClass =
    outcome === "ineligible" ? "ineligible" : outcome === "conditional" ? "conditional" : "eligible";

  const handleCardClick = useCallback(() => {
    if (!selectable) {
      return;
    }
    onToggleSelect(lender.lenderName);
  }, [selectable, onToggleSelect, lender.lenderName]);

  return (
    <article
      className={`lenderCard ${cardOutcomeClass}${selectable ? " lenderCardSelectable" : ""}${
        selected ? " lenderCardSelected" : ""
      }`.trim()}
      data-selected={selected ? "true" : undefined}
      onClick={handleCardClick}
    >
      <div className="lenderBrand">
        <LenderLogo lenderName={lender.lenderName} websiteUrl={lender.websiteUrl} />
        {websiteDomain ? <span className="lenderDomain">{websiteDomain}</span> : null}
      </div>

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
