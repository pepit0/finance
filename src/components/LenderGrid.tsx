import type { EvaluatedLender } from "../types/lender";
import { LenderCard } from "./LenderCard";

export type SortOption = "bestMatch" | "minScoreAsc" | "maxLtvDesc" | "nameAsc";

interface LenderGridProps {
  lenders: EvaluatedLender[];
  loading: boolean;
  sortBy: SortOption;
  onSortChange: (value: SortOption) => void;
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

function sortLenders(list: EvaluatedLender[], sortBy: SortOption): EvaluatedLender[] {
  const sorted = [...list];
  sorted.sort((a, b) => {
    if (sortBy === "nameAsc") {
      return a.lender.lenderName.localeCompare(b.lender.lenderName);
    }
    if (sortBy === "minScoreAsc") {
      return a.lender.minScore - b.lender.minScore;
    }
    if (sortBy === "maxLtvDesc") {
      return b.lender.maxLTV - a.lender.maxLTV;
    }

    return getBestMatchScore(b) - getBestMatchScore(a);
  });

  return sorted;
}

export function LenderGrid({ lenders, loading, sortBy, onSortChange }: LenderGridProps) {
  if (loading) {
    return <SkeletonGrid />;
  }

  const eligible = sortLenders(
    lenders.filter((item) => item.outcome === "eligible"),
    sortBy
  );
  const conditional = sortLenders(
    lenders.filter((item) => item.outcome === "conditional"),
    sortBy
  );
  const ineligible = sortLenders(
    lenders.filter((item) => item.outcome === "ineligible"),
    sortBy
  );

  return (
    <div className="gridSections">
      <div className="resultsToolbar">
        <label className="sortControl">
          Sort by
          <select value={sortBy} onChange={(event) => onSortChange(event.target.value as SortOption)}>
            <option value="bestMatch">Best match</option>
            <option value="minScoreAsc">Min score (low to high)</option>
            <option value="maxLtvDesc">Max LTV (high to low)</option>
            <option value="nameAsc">Lender name (A-Z)</option>
          </select>
        </label>
        <button className="printBtn" type="button" onClick={() => window.print()}>
          Print Deal View
        </button>
      </div>

      <section>
        <h2>Eligible Options ({eligible.length})</h2>
        <div className="lenderGrid">
          {eligible.length === 0 ? <p className="emptyState">No eligible lenders currently match.</p> : null}
          {eligible.map((result) => (
            <LenderCard key={result.lender.lenderName} result={result} />
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
            <LenderCard key={result.lender.lenderName} result={result} />
          ))}
        </div>
      </section>

      <section className="declinedSection">
        <h2>Ineligible Options ({ineligible.length})</h2>
        <div className="lenderGrid">
          {ineligible.length === 0 ? <p className="emptyState">No ineligible lenders.</p> : null}
          {ineligible.map((result) => (
            <LenderCard key={result.lender.lenderName} result={result} />
          ))}
        </div>
      </section>
    </div>
  );
}
