import { useEffect, useMemo, useState } from "react";
import { FilterSidebar } from "./components/FilterSidebar";
import { LenderGrid, type SortOption } from "./components/LenderGrid";
import { defaultFilters } from "./data/defaultFilters";
import type { FilterState, Lender } from "./types/lender";
import { evaluateLenders } from "./utils/decisionEngine";
import { parseLendersFromCsvText } from "./utils/csvParser";

const CSV_URL = import.meta.env.VITE_LENDERS_CSV_URL ?? "/lenders.csv";
const LOAD_ERROR_MESSAGE =
  "Unable to load Lender Guidelines. Please check internet connection or CSV link.";

export default function App() {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [lenders, setLenders] = useState<Lender[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [skippedRows, setSkippedRows] = useState(0);
  const [sortBy, setSortBy] = useState<SortOption>("bestMatch");

  useEffect(() => {
    setLoading(true);
    setErrorMessage(null);

    fetch(CSV_URL)
      .then((response) => {
        if (!response.ok) {
          throw new Error("CSV request failed");
        }
        return response.text();
      })
      .then((csvText) => {
        const parsed = parseLendersFromCsvText(csvText);
        if (parsed.lenders.length === 0) {
          throw new Error("No lender rows parsed");
        }
        setLenders(parsed.lenders);
        setSkippedRows(parsed.skippedRows);
      })
      .catch(() => {
        setErrorMessage(LOAD_ERROR_MESSAGE);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const evaluatedLenders = useMemo(() => evaluateLenders(lenders, filters), [lenders, filters]);

  const toggleSituation = (key: "openBK" | "repo" | "selfEmployed" | "newToCanada" | "hasNineSin") => {
    setFilters((current) => ({ ...current, [key]: !current[key] }));
  };

  const updateNumber = (key: "creditScore" | "ltv", value: number | null) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const updateText = (key: "dateOfBirth" | "province", value: string) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
  };

  return (
    <main className="appShell">
      <header className="topBar">
        <div>
          <h1>Auto Finance Manager</h1>
          <p>Decision Engine</p>
        </div>
        {loading ? (
          <div className="loadingInline" role="status" aria-live="polite">
            <span className="spinner" />
            Loading lender guidelines...
          </div>
        ) : null}
      </header>

      <div className="contentLayout">
        <FilterSidebar
          filters={filters}
          onToggleSituation={toggleSituation}
          onNumberChange={updateNumber}
          onTextChange={updateText}
          onReset={resetFilters}
        />

        <section className="resultsPanel">
          {errorMessage ? <p className="errorBanner">{errorMessage}</p> : null}
          {!errorMessage && skippedRows > 0 ? (
            <p className="warningBanner">Skipped {skippedRows} invalid lender rows.</p>
          ) : null}

          {!errorMessage ? (
            <LenderGrid lenders={evaluatedLenders} loading={loading} sortBy={sortBy} onSortChange={setSortBy} />
          ) : null}
        </section>
      </div>
    </main>
  );
}