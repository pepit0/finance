import { type ChangeEvent, useEffect, useState } from "react";
import type { FilterState, IncomeProgramFilter } from "../types/lender";

const CANADIAN_PROVINCES = [
  "AB",
  "BC",
  "MB",
  "NB",
  "NL",
  "NS",
  "NT",
  "NU",
  "ON",
  "PE",
  "QC",
  "SK",
  "YT"
] as const;

const DOB_START_YEAR = 1920;

const INCOME_PROGRAM_OPTIONS: { value: IncomeProgramFilter; label: string }[] = [
  { value: "", label: "Employment" },
  { value: "disability_benefit", label: "Disability (AISH/ODSP)" },
  { value: "child_tax", label: "Child tax / CCB" },
  { value: "other", label: "Other / mixed" }
];

function parseDobParts(value: string): { year: string; month: string; day: string } {
  if (!value) {
    return { year: "", month: "", day: "" };
  }

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return { year: "", month: "", day: "" };
  }

  return { year: match[1], month: match[2], day: match[3] };
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function buildDobValue(parts: { year: string; month: string; day: string }): string {
  if (!parts.year) {
    return "";
  }
  if (!parts.month) {
    return `${parts.year}-01-01`;
  }
  if (!parts.day) {
    return `${parts.year}-${parts.month}-01`;
  }
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function parseOptionalInt(raw: string): number | null {
  const t = raw.trim();
  if (t === "") {
    return null;
  }
  const n = Number(t);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function clampMonths(m: number | null): number | null {
  if (m === null) {
    return null;
  }
  return Math.min(11, Math.max(0, m));
}

interface FilterSidebarProps {
  filters: FilterState;
  onToggleSituation: (
    key:
      | "openBK"
      | "repo"
      | "selfEmployed"
      | "nineSinNewToCanada"
      | "secondUnit"
      | "nativeStatus"
  ) => void;
  onTextChange: (key: "dateOfBirth" | "province", value: string) => void;
  onProfileChange: (patch: Partial<FilterState>) => void;
  onReset: () => void;
}

export function FilterSidebar({
  filters,
  onToggleSituation,
  onTextChange,
  onProfileChange,
  onReset
}: FilterSidebarProps) {
  const today = new Date();
  const currentYear = today.getFullYear();
  const [dobParts, setDobParts] = useState(() => parseDobParts(filters.dateOfBirth));
  const { year: selectedYear, month: selectedMonth, day: selectedDay } = dobParts;

  useEffect(() => {
    setDobParts(parseDobParts(filters.dateOfBirth));
  }, [filters.dateOfBirth]);

  const yearOptions = Array.from({ length: currentYear - DOB_START_YEAR + 1 }, (_, index) =>
    String(currentYear - index)
  );
  const monthOptions = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, "0"));

  const dayCount = selectedYear && selectedMonth ? daysInMonth(Number(selectedYear), Number(selectedMonth)) : 31;
  const dayOptions = Array.from({ length: dayCount }, (_, index) => String(index + 1).padStart(2, "0"));

  const updateDob = (next: { year?: string; month?: string; day?: string }) => {
    const year = next.year ?? dobParts.year;
    const month = next.month ?? dobParts.month;
    const day = next.day ?? dobParts.day;
    const updatedParts = { year, month, day };
    if (updatedParts.year && updatedParts.month && updatedParts.day) {
      const maxDay = daysInMonth(Number(updatedParts.year), Number(updatedParts.month));
      const safeDay = String(Math.min(Number(updatedParts.day), maxDay)).padStart(2, "0");
      updatedParts.day = safeDay;
    }

    setDobParts(updatedParts);
    onTextChange("dateOfBirth", buildDobValue(updatedParts));
  };

  const clearDob = () => {
    const empty = { year: "", month: "", day: "" };
    setDobParts(empty);
    onTextChange("dateOfBirth", "");
  };

  const tenureYearsProps = (field: "jobTenureYears") => ({
    className: "filterSidebarNumber",
    min: 0,
    max: 80,
    inputMode: "numeric" as const,
    value: filters[field] === null ? "" : String(filters[field]),
    onChange: (e: ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      onProfileChange({ [field]: v === "" ? null : parseOptionalInt(v) });
    }
  });

  const tenureMonthsProps = (field: "jobTenureMonths") => ({
    className: "filterSidebarNumber",
    min: 0,
    max: 11,
    inputMode: "numeric" as const,
    value: filters[field] === null ? "" : String(filters[field]),
    onChange: (e: ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      const parsed = v === "" ? null : clampMonths(parseOptionalInt(v));
      onProfileChange({ [field]: parsed });
    }
  });

  return (
    <aside className="filterSidebar">
      <button className="newCustomerBtn" type="button" onClick={onReset}>
        Clear Filters
      </button>

      <section className="customerSituations">
        <h2>Customer situations</h2>
        <label>
          <input type="checkbox" checked={filters.openBK} onChange={() => onToggleSituation("openBK")} />
          Double Bankruptcy
        </label>
        <label>
          <input type="checkbox" checked={filters.repo} onChange={() => onToggleSituation("repo")} />
          Repo
        </label>
        <label>
          <input
            type="checkbox"
            checked={filters.nineSinNewToCanada}
            onChange={() => onToggleSituation("nineSinNewToCanada")}
          />
          9 SIN / New to Canada
        </label>
        <label>
          <input type="checkbox" checked={filters.secondUnit} onChange={() => onToggleSituation("secondUnit")} />
          Second unit
        </label>
        <label>
          <input type="checkbox" checked={filters.nativeStatus} onChange={() => onToggleSituation("nativeStatus")} />
          Native status
        </label>
      </section>

      <section className="customerDetailsSection">
        <h2>Customer details</h2>

        <div className="filterSidebarSubsection">
          <h3 className="filterSidebarSubhead">Identity and location</h3>
          <label>
            <span className="dobLabelRow">
              <span>Date of Birth</span>
              <button className="dobClearTextBtn" type="button" onClick={clearDob}>
                Clear
              </button>
            </span>
            <div className="dobSelectors">
              <select value={selectedYear} onChange={(event) => updateDob({ year: event.target.value })}>
                <option value="">Year</option>
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <select value={selectedMonth} onChange={(event) => updateDob({ month: event.target.value })}>
                <option value="">Month</option>
                {monthOptions.map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
              <select value={selectedDay} onChange={(event) => updateDob({ day: event.target.value })}>
                <option value="">Day</option>
                {dayOptions.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>
          </label>
          <label>
            Province
            <select
              value={filters.province}
              onChange={(event) => onTextChange("province", event.target.value)}
            >
              <option value="">Select province/territory</option>
              {CANADIAN_PROVINCES.map((provinceCode) => (
                <option key={provinceCode} value={provinceCode}>
                  {provinceCode}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="filterSidebarSubsection">
          <h3 className="filterSidebarSubhead">Employment & income</h3>
          <label className="filterSidebarInlineCheck">
            <input
              type="checkbox"
              checked={filters.selfEmployed}
              onChange={() => onToggleSituation("selfEmployed")}
            />
            Self-employed
          </label>
          <span className="filterSidebarFieldLabel">Job tenure</span>
          <div className="tenurePairGrid">
            <label>
              Years
              <input type="number" {...tenureYearsProps("jobTenureYears")} />
            </label>
            <label>
              Months (0–11)
              <input type="number" {...tenureMonthsProps("jobTenureMonths")} />
            </label>
          </div>
          <label>
            Primary income
            <select
              value={filters.incomeProgram}
              onChange={(e) =>
                onProfileChange({ incomeProgram: e.target.value as IncomeProgramFilter })
              }
            >
              {INCOME_PROGRAM_OPTIONS.map((opt) => (
                <option key={opt.value || "income-program-employment"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Income amount (CAD, optional)
            <input
              type="number"
              className="filterSidebarNumber"
              min={0}
              step={100}
              inputMode="decimal"
              value={filters.incomeAmountCad === null ? "" : String(filters.incomeAmountCad)}
              onChange={(e) => {
                const v = e.target.value;
                const n = Number(v);
                onProfileChange({
                  incomeAmountCad: v === "" || !Number.isFinite(n) ? null : n
                });
              }}
            />
          </label>
        </div>

        <div className="filterSidebarSubsection">
          <h3 className="filterSidebarSubhead">Credit (optional)</h3>
          <label>
            Credit score
            <input
              type="number"
              className="filterSidebarNumber"
              min={300}
              max={900}
              inputMode="numeric"
              value={filters.creditScore === null ? "" : String(filters.creditScore)}
              onChange={(e) => {
                const v = e.target.value;
                onProfileChange({ creditScore: v === "" ? null : parseOptionalInt(v) });
              }}
            />
          </label>
          <label>
            LTV % (optional)
            <input
              type="number"
              className="filterSidebarNumber"
              min={0}
              max={200}
              step={1}
              inputMode="decimal"
              value={filters.ltv === null ? "" : String(filters.ltv)}
              onChange={(e) => {
                const v = e.target.value;
                const n = Number(v);
                onProfileChange({ ltv: v === "" || !Number.isFinite(n) ? null : n });
              }}
            />
          </label>
        </div>
      </section>
    </aside>
  );
}
