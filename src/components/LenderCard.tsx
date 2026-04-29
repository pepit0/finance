import { type MouseEvent, useCallback, useMemo } from "react";
import type { EvaluatedLender, FilterState } from "../types/lender";
import { getLenderWebsiteDomain, LenderLogo } from "./LenderLogo";
import {
  buildSituationInfoLines,
  formatPaymentCad,
  incomeWaiveDisplayText,
  minIncomeDisplayText
} from "../utils/lenderCardInfoContent";

interface LenderCardProps {
  result: EvaluatedLender;
  selected: boolean;
  onToggleSelect: (lenderName: string) => void;
  filters: FilterState;
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

export function LenderCard({ result, selected, onToggleSelect, filters }: LenderCardProps) {
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

  const situationLines = useMemo(() => buildSituationInfoLines(filters, lender), [filters, lender]);

  const cardOutcomeClass =
    outcome === "ineligible" ? "ineligible" : outcome === "conditional" ? "conditional" : "eligible";

  const handleCardClick = useCallback(() => {
    if (!selectable) {
      return;
    }
    onToggleSelect(lender.lenderName);
  }, [selectable, onToggleSelect, lender.lenderName]);

  const stopInfoClick = useCallback((e: MouseEvent) => {
    e.stopPropagation();
  }, []);

  return (
    <article
      className={`lenderCard ${cardOutcomeClass}${selectable ? " lenderCardSelectable" : ""}${
        selected ? " lenderCardSelected" : ""
      }`.trim()}
      data-selected={selected ? "true" : undefined}
      onClick={handleCardClick}
    >
      <div className="lenderCardInfo" onClick={stopInfoClick}>
        <button
          type="button"
          className="lenderCardInfoBtn"
          aria-label={`Program notes for ${lender.lenderName}`}
        >
          <span className="lenderCardInfoIcon" aria-hidden>
            i
          </span>
        </button>
        <div className="lenderCardInfoPanel" role="region" aria-label="Program requirements">
          <div className="lenderCardInfoPanelInner">
            {situationLines.length > 0 ? (
              <>
                <p className="lenderCardInfoHeading">NOA</p>
                <p className="lenderCardInfoBody">{situationLines[0].body}</p>
              </>
            ) : null}

            <p className="lenderCardInfoHeading">Waive income requirements</p>
            <p className="lenderCardInfoBody">{incomeWaiveDisplayText(lender)}</p>

            <p className="lenderCardInfoHeading">Minimum income (monthly)</p>
            <p className="lenderCardInfoBody">{minIncomeDisplayText(lender)}</p>

            <p className="lenderCardInfoHeading">Payments (monthly)</p>
            <dl className="lenderCardInfoDl">
              <div className="lenderCardInfoRow">
                <dt>Minimum</dt>
                <dd>{formatPaymentCad(lender.minPaymentCad)}</dd>
              </div>
              <div className="lenderCardInfoRow">
                <dt>Maximum</dt>
                <dd>{formatPaymentCad(lender.maxPaymentCad)}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

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
