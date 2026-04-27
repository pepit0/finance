import type { BookCondition, BookGrid, BookRegion, BookValuationInput } from "../types/vehicleBook";
import { BOOK_CONDITIONS, BOOK_REGIONS } from "../types/vehicleBook";

/** Simple deterministic 32-bit hash for stub pricing (not cryptographic). */
export function hashStringToUint32(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const CONDITION_SCALE: Record<BookCondition, number> = {
  "Very rough": 0.62,
  Rough: 0.72,
  Average: 0.85,
  Clean: 0.95,
  "Very clean": 1.05
};

const REGION_SCALE: Record<BookRegion, number> = {
  Canada: 1,
  Ontario: 1.02,
  Alberta: 0.99
};

/**
 * Demo book values only — deterministic from VIN + trim + mileage.
 * Replace with licensed API via server proxy when available.
 */
export function getStubBookValues(input: BookValuationInput): BookGrid {
  const seed = hashStringToUint32(`${input.vin}|${input.trimKey}|${input.mileageKm}`);
  const base = 12_000 + (seed % 55_000) - Math.min(4_000, Math.floor(input.mileageKm / 25));

  const grid = {} as BookGrid;
  for (const condition of BOOK_CONDITIONS) {
    grid[condition] = {} as Record<BookRegion, number>;
    for (const region of BOOK_REGIONS) {
      const raw = base * CONDITION_SCALE[condition] * REGION_SCALE[region];
      grid[condition][region] = Math.round(raw / 50) * 50;
    }
  }
  return grid;
}
