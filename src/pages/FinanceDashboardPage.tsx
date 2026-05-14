import { useCallback, useEffect, useMemo, useState } from "react";
import { ApprovalCalculatorPanel } from "../components/ApprovalCalculatorPanel";
import { FilterSidebar } from "../components/FilterSidebar";
import { FeedbackPanel } from "../components/FeedbackPanel";
import { LenderBookingGuidePanel } from "../components/LenderBookingGuidePanel";
import type { VehicleBookGuideCaption } from "../components/VehicleBookPanel";
import { VehicleBookPanel } from "../components/VehicleBookPanel";
import { LenderGrid } from "../components/LenderGrid";
import { SelectedLendersBar } from "../components/SelectedLendersBar";
import { defaultFilters } from "../data/defaultFilters";
import { supabase } from "../lib/supabase";
import type { EvaluatedLender, FilterState, Lender } from "../types/lender";
import { evaluateLenders } from "../utils/decisionEngine";
import { parseLendersFromCsvText } from "../utils/csvParser";

const DEFAULT_PUBLISHED_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSLxzZT8lZOrBMw6DQAbI03SFYOYtSzb0j2nbVPEKlvT9ql5tBgKViwojxMP1_es0o1cxmMKYIWjcuu/pub?gid=713174712&single=true&output=csv";
const LENDER_DATA_SPREADSHEET_URL =
  "https://docs.google.com/spreadsheets/d/1-5yD9R0RgjCS1xtMPTv0eqafLTQnvmd-5blsA4L5-9s/edit?usp=sharing";
const CSV_URL = import.meta.env.VITE_LENDERS_CSV_URL ?? DEFAULT_PUBLISHED_CSV_URL;
const LOAD_ERROR_MESSAGE =
  "Unable to load Lender Guidelines. Please check internet connection or CSV link.";

type AppTab = "lenders" | "calculator" | "feedback";

export function FinanceDashboardPage() {
  const [activeTab, setActiveTab] = useState<AppTab>("lenders");
  const [costValueCad, setCostValueCad] = useState("");
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [lenders, setLenders] = useState<Lender[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [skippedRows, setSkippedRows] = useState(0);
  const [selectedLenderNames, setSelectedLenderNames] = useState<string[]>([]);
  const [activeGuideLenderName, setActiveGuideLenderName] = useState<string | null>(null);
  const [vehicleGuideCaption, setVehicleGuideCaption] = useState<VehicleBookGuideCaption | null>(null);

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

  useEffect(() => {
    const stillSelectable = new Set(
      evaluatedLenders.filter((e) => e.outcome !== "ineligible").map((e) => e.lender.lenderName)
    );
    setSelectedLenderNames((prev) => prev.filter((name) => stillSelectable.has(name)));
  }, [evaluatedLenders]);

  const selectedLenderNameSet = useMemo(() => new Set(selectedLenderNames), [selectedLenderNames]);

  const selectedLendersOrdered = useMemo((): EvaluatedLender[] => {
    const byName = new Map(evaluatedLenders.map((e) => [e.lender.lenderName, e]));
    return selectedLenderNames
      .map((name) => byName.get(name))
      .filter((e): e is EvaluatedLender => e !== undefined);
  }, [evaluatedLenders, selectedLenderNames]);

  useEffect(() => {
    if (selectedLenderNames.length === 0) {
      setActiveGuideLenderName(null);
      return;
    }
    const selectable = new Set(selectedLenderNames);
    setActiveGuideLenderName((prev) => {
      if (prev && selectable.has(prev)) {
        return prev;
      }
      return selectedLenderNames[0] ?? null;
    });
  }, [selectedLenderNames]);

  const onVehicleGuideCaptionChange = useCallback((caption: VehicleBookGuideCaption | null) => {
    setVehicleGuideCaption(caption);
  }, []);

  const toggleLenderSelection = useCallback((lenderName: string) => {
    setSelectedLenderNames((prev) =>
      prev.includes(lenderName) ? prev.filter((n) => n !== lenderName) : [...prev, lenderName]
    );
  }, []);

  const toggleSituation = (
    key:
      | "openBK"
      | "repo"
      | "selfEmployed"
      | "nineSinNewToCanada"
      | "secondUnit"
      | "nativeStatus"
  ) => {
    setFilters((current) => ({ ...current, [key]: !current[key] }));
  };

  const updateText = (key: "dateOfBirth" | "province", value: string) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const updateProfile = useCallback((patch: Partial<FilterState>) => {
    setFilters((current) => ({ ...current, ...patch }));
  }, []);

  const resetFilters = () => {
    setFilters(defaultFilters);
  };

  const openLenderSpreadsheet = useCallback(() => {
    window.open(LENDER_DATA_SPREADSHEET_URL, "_blank", "noopener,noreferrer");
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return (
    <main className="appShell">
      <header className="topBar">
        <div className="topBarLead">
          <div className="topBarTitleBlock">
            <h1>Car Finance Dashboard</h1>
            <p>Decision Engine</p>
          </div>
          <nav className="appTabs" aria-label="Main views">
            <button
              type="button"
              className={`appTab ${activeTab === "lenders" ? "appTabActive" : ""}`}
              onClick={() => setActiveTab("lenders")}
              aria-current={activeTab === "lenders" ? "page" : undefined}
            >
              Lenders
            </button>
            <button
              type="button"
              className={`appTab ${activeTab === "calculator" ? "appTabActive" : ""}`}
              onClick={() => setActiveTab("calculator")}
              aria-current={activeTab === "calculator" ? "page" : undefined}
            >
              Calculators
            </button>
            <button
              type="button"
              className={`appTab ${activeTab === "feedback" ? "appTabActive" : ""}`}
              onClick={() => setActiveTab("feedback")}
              aria-current={activeTab === "feedback" ? "page" : undefined}
            >
              Suggestions & Bugs
            </button>
          </nav>
        </div>
        <div className="topBarTrail">
          <div className="userButtonSlot">
            <button type="button" className="topBarSheetButton" onClick={signOut}>
              Sign out
            </button>
          </div>
          <button type="button" className="topBarSheetButton" onClick={openLenderSpreadsheet}>
            Open spreadsheet
          </button>
          <p className="topBarSheetNote">What you see here is driven by data in that spreadsheet.</p>
          {activeTab === "lenders" && loading ? (
            <div className="loadingInline" role="status" aria-live="polite">
              <span className="spinner" />
              Loading lender guidelines...
            </div>
          ) : null}
        </div>
      </header>

      <SelectedLendersBar items={selectedLendersOrdered} onRemove={toggleLenderSelection} />

      <div className="contentLayout" hidden={activeTab !== "lenders"}>
        <FilterSidebar
          filters={filters}
          onToggleSituation={toggleSituation}
          onTextChange={updateText}
          onProfileChange={updateProfile}
          onReset={resetFilters}
        />

        <section className="resultsPanel">
          {errorMessage ? <p className="errorBanner">{errorMessage}</p> : null}
          {!errorMessage && skippedRows > 0 ? (
            <p className="warningBanner">Skipped {skippedRows} invalid lender rows.</p>
          ) : null}

          {!errorMessage ? (
            <LenderGrid
              lenders={evaluatedLenders}
              loading={loading}
              selectedLenderNames={selectedLenderNameSet}
              onToggleLenderSelect={toggleLenderSelection}
              filters={filters}
            />
          ) : null}
        </section>
      </div>

      <div className="calculatorPage calculatorPage--fullBleed" hidden={activeTab !== "calculator"}>
        <p className="calculatorPageSubtitle">
          Approval calculator, VIN book demo, and lender booking guides side by side.
        </p>
        <div className="calculatorToolsLayout">
          <div className="calculatorToolsColumn">
            <ApprovalCalculatorPanel costValueCad={costValueCad} onCostValueCadChange={setCostValueCad} />
          </div>
          <div className="calculatorToolsColumn">
            <VehicleBookPanel
              onPickCostValue={(amount) => setCostValueCad(String(Math.round(amount)))}
              onVehicleGuideCaptionChange={onVehicleGuideCaptionChange}
            />
          </div>
          <div className="calculatorToolsColumn">
            <LenderBookingGuidePanel
              selectedLenders={selectedLendersOrdered}
              activeGuideLenderName={activeGuideLenderName}
              onActiveGuideLenderChange={setActiveGuideLenderName}
              vehicleGuideCaption={vehicleGuideCaption}
            />
          </div>
        </div>
      </div>

      <div className="feedbackPage" hidden={activeTab !== "feedback"}>
        <FeedbackPanel appName="Car Finance Dashboard" />
      </div>
    </main>
  );
}
