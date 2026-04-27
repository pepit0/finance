import type { EvaluatedLender } from "../types/lender";
import { LenderLogo } from "./LenderLogo";

interface SelectedLendersBarProps {
  items: EvaluatedLender[];
  onRemove: (lenderName: string) => void;
}

export function SelectedLendersBar({ items, onRemove }: SelectedLendersBarProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="selectedLendersBar" role="region" aria-label="Selected lenders">
      <span className="selectedLendersBarLabel">Selected</span>
      <ul className="selectedLendersChips">
        {items.map((result) => {
          const { lender, outcome } = result;
          const chipClass =
            outcome === "conditional" ? "selectedLenderChip conditional" : "selectedLenderChip eligible";
          return (
            <li key={lender.lenderName} className={chipClass}>
              <LenderLogo
                lenderName={lender.lenderName}
                websiteUrl={lender.websiteUrl}
                className="selectedLenderChipLogo"
                loading="eager"
                alt=""
              />
              <span className="selectedLenderChipName">{lender.lenderName}</span>
              <button
                type="button"
                className="selectedLenderChipRemove"
                onClick={() => onRemove(lender.lenderName)}
                aria-label={`Remove ${lender.lenderName} from selection`}
              >
                ×
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
