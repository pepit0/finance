import type { EvaluatedLender, FilterState } from "../types/lender";
import { LenderCard } from "./LenderCard";

interface LenderGridProps {
  lenders: EvaluatedLender[];
  loading: boolean;
  selectedLenderNames: Set<string>;
  onToggleLenderSelect: (lenderName: string) => void;
  filters: FilterState;
}

function SkeletonGrid() {
  return (
    <div className="lenderGrid" aria-label="Loading lender guidelines">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="lenderCard skeletonCard" />
      ))}
    </div>
  );
}

function getBestMatchScore(item: EvaluatedLender): number {
  if (item.outcome === "ineligible") {
    return Number.NEGATIVE_INFINITY;
  }

  return item.lender.maxLTV - item.lender.minScore / 10;
}

/** Best match: ineligible last; otherwise higher LTV and lower min score rank higher. */
function sortLenders(list: EvaluatedLender[]): EvaluatedLender[] {
  const sorted = [...list];
  sorted.sort((a, b) => getBestMatchScore(b) - getBestMatchScore(a));
  return sorted;
}

export function LenderGrid({
  lenders,
  loading,
  selectedLenderNames,
  onToggleLenderSelect,
  filters
}: LenderGridProps) {
  if (loading) {
    return <SkeletonGrid />;
  }

  const eligible = sortLenders(lenders.filter((item) => item.outcome === "eligible"));
  const conditional = sortLenders(lenders.filter((item) => item.outcome === "conditional"));
  const ineligible = sortLenders(lenders.filter((item) => item.outcome === "ineligible"));

  return (
    <div className="gridSections">
      <section>
        <h2>Eligible Options ({eligible.length})</h2>
        <div className="lenderGrid">
          {eligible.length === 0 ? <p className="emptyState">No eligible lenders currently match.</p> : null}
          {eligible.map((result) => (
            <LenderCard
              key={result.lender.lenderName}
              result={result}
              selected={selectedLenderNames.has(result.lender.lenderName)}
              onToggleSelect={onToggleLenderSelect}
              filters={filters}
            />
          ))}
        </div>
      </section>

      <section className="conditionalSection">
        <h2>Conditional Options ({conditional.length})</h2>
        <div className="lenderGrid">
          {conditional.length === 0 ? (
            <p className="emptyState">No conditional lenders for the selected situations.</p>
          ) : null}
          {conditional.map((result) => (
            <LenderCard
              key={result.lender.lenderName}
              result={result}
              selected={selectedLenderNames.has(result.lender.lenderName)}
              onToggleSelect={onToggleLenderSelect}
              filters={filters}
            />
          ))}
        </div>
      </section>

      <section className="declinedSection">
        <h2>Ineligible Options ({ineligible.length})</h2>
        <div className="lenderGrid">
          {ineligible.length === 0 ? <p className="emptyState">No ineligible lenders.</p> : null}
          {ineligible.map((result) => (
            <LenderCard
              key={result.lender.lenderName}
              result={result}
              selected={false}
              onToggleSelect={onToggleLenderSelect}
              filters={filters}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
