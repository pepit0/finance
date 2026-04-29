/**
 * Total months from separate years + months parts (customer filters).
 * Returns null when neither years nor months is specified.
 * Missing months defaults to 0 when years are set; missing years defaults to 0 when months are set.
 */
export function customerTenureTotalMonths(years: number | null, months: number | null): number | null {
  if (years === null && months === null) {
    return null;
  }
  const y = years ?? 0;
  const m = months ?? 0;
  return y * 12 + m;
}
