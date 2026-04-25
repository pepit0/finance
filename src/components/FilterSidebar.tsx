import type { ChangeEvent } from "react";
import type { FilterState } from "../types/lender";

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

interface FilterSidebarProps {
  filters: FilterState;
  onToggleSituation: (key: "openBK" | "repo" | "selfEmployed" | "newToCanada" | "hasNineSin") => void;
  onNumberChange: (key: "creditScore" | "ltv", value: number | null) => void;
  onTextChange: (key: "dateOfBirth" | "province", value: string) => void;
  onReset: () => void;
}

function parseNumericInput(event: ChangeEvent<HTMLInputElement>): number | null {
  const value = event.target.value.trim();
  if (value.length === 0) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function FilterSidebar({
  filters,
  onToggleSituation,
  onNumberChange,
  onTextChange,
  onReset
}: FilterSidebarProps) {
  return (
    <aside className="filterSidebar">
      <button className="newCustomerBtn" type="button" onClick={onReset}>
        New Customer / Clear Filters
      </button>

      <section className="customerSituations">
        <h2>Customer Situations</h2>
        <label>
          <input
            type="checkbox"
            checked={filters.openBK}
            onChange={() => onToggleSituation("openBK")}
          />
          Open BK
        </label>
        <label>
          <input type="checkbox" checked={filters.repo} onChange={() => onToggleSituation("repo")} />
          Repo
        </label>
        <label>
          <input
            type="checkbox"
            checked={filters.hasNineSin}
            onChange={() => onToggleSituation("hasNineSin")}
          />
          9 SIN
        </label>
      </section>

      <section>
        <h2>Credit Profile (doesn't work yet)</h2>
        <label>
          Credit Score
          <input
            type="number"
            value={filters.creditScore ?? ""}
            onChange={(event) => onNumberChange("creditScore", parseNumericInput(event))}
            placeholder="e.g. 650"
          />
        </label>
        <label>
          LTV
          <input
            type="number"
            value={filters.ltv ?? ""}
            onChange={(event) => onNumberChange("ltv", parseNumericInput(event))}
            placeholder="e.g. 125"
          />
        </label>
      </section>

      <section>
        <h2>Customer Details</h2>
        <label>
          Date of Birth
          <input
            type="date"
            value={filters.dateOfBirth}
            onChange={(event) => onTextChange("dateOfBirth", event.target.value)}
          />
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
      </section>
    </aside>
  );
}