import { useEffect, useState } from "react";
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

const DOB_START_YEAR = 1920;

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
          Open Bankruptcy
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
      </section>
    </aside>
  );
}