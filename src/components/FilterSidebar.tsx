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
  onTextChange: (key: "dateOfBirth" | "province", value: string) => void;
  onReset: () => void;
}

export function FilterSidebar({
  filters,
  onToggleSituation,
  onTextChange,
  onReset
}: FilterSidebarProps) {
  return (
    <aside className="filterSidebar">
      <button className="newCustomerBtn" type="button" onClick={onReset}>
        Clear Filters
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