export const BOOK_CONDITIONS = ["Very rough", "Rough", "Average", "Clean", "Very clean"] as const;
export type BookCondition = (typeof BOOK_CONDITIONS)[number];

export const BOOK_REGIONS = ["Canada", "Ontario", "Alberta"] as const;
export type BookRegion = (typeof BOOK_REGIONS)[number];

/** One row per condition; each region is CAD dollars (demo). */
export type BookGrid = Record<BookCondition, Record<BookRegion, number>>;

export type BookValuationInput = {
  vin: string;
  /** Trim key used for stub determinism (decoded trim + override). */
  trimKey: string;
  /** Odometer km; 0 if unknown. */
  mileageKm: number;
};

/** Swap implementation for a licensed API (server-backed) when available. */
export interface BookValuationProvider {
  getBookValues(input: BookValuationInput): Promise<BookGrid>;
}
