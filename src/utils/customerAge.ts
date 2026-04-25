/**
 * Parses ISO `YYYY-MM-DD` from `<input type="date">`. Returns null if empty or invalid.
 * Age is whole years on `referenceDate` using the local calendar.
 */
export function getAgeFromIsoDate(iso: string, referenceDate = new Date()): number | null {
  const trimmed = iso.trim();
  if (!trimmed) {
    return null;
  }

  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return null;
  }

  const y = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  if (!Number.isFinite(y) || !Number.isFinite(monthIndex) || !Number.isFinite(day)) {
    return null;
  }

  const birth = new Date(y, monthIndex, day);
  if (birth.getFullYear() !== y || birth.getMonth() !== monthIndex || birth.getDate() !== day) {
    return null;
  }

  let age = referenceDate.getFullYear() - birth.getFullYear();
  const monthDiff = referenceDate.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < birth.getDate())) {
    age -= 1;
  }

  return age;
}

/** Under 24 (23 and below) — matches “young buyers” matrix row in the sheet. */
export function isYoungBuyerAge(age: number | null): boolean {
  return age !== null && age < 24;
}
