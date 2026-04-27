export type DecodedVehicle = {
  modelYear: string;
  make: string;
  model: string;
  trim: string;
  /** Non-empty VPIC fields for debugging / trim override context */
  raw: Record<string, string>;
};

export type VinDecodeError = { error: string };

const VPIC_BASE = "https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended";

function normalizeVin(vin: string): string {
  return vin.trim().toUpperCase();
}

/** VIN excludes I, O, Q per ISO 3779; length 17. */
export function validateVinFormat(vin: string): string | null {
  const v = normalizeVin(vin);
  if (v.length !== 17) {
    return "VIN must be exactly 17 characters.";
  }
  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(v)) {
    return "VIN may only contain letters (except I, O, Q) and digits.";
  }
  return null;
}

function cleanField(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  const s = String(value).trim();
  if (!s || /^not applicable$/i.test(s)) {
    return "";
  }
  return s;
}

export function parseVinDecodeResponse(payload: unknown): DecodedVehicle | VinDecodeError {
  if (!payload || typeof payload !== "object") {
    return { error: "Invalid decode response." };
  }
  const results = (payload as { Results?: unknown }).Results;
  if (!Array.isArray(results) || results.length === 0) {
    return { error: "No decode results returned." };
  }
  const row = results[0];
  if (!row || typeof row !== "object") {
    return { error: "Empty decode row." };
  }

  const raw: Record<string, string> = {};
  for (const [key, value] of Object.entries(row as Record<string, unknown>)) {
    const c = cleanField(value);
    if (c) {
      raw[key] = c;
    }
  }

  const r = row as Record<string, unknown>;
  const modelYear = cleanField(r.ModelYear);
  const make = cleanField(r.Make);
  const model = cleanField(r.Model);
  const trim = cleanField(r.Trim) || cleanField(r.Trim2) || cleanField(r.Series) || "";

  if (!make && !model) {
    return { error: "Could not read make or model from decode result." };
  }

  return {
    modelYear,
    make,
    model,
    trim,
    raw
  };
}

export async function decodeVinExtended(vin: string): Promise<DecodedVehicle | VinDecodeError> {
  const err = validateVinFormat(vin);
  if (err) {
    return { error: err };
  }
  const v = normalizeVin(vin);
  const url = `${VPIC_BASE}/${encodeURIComponent(v)}?format=json`;
  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    return { error: "Network error while contacting VIN decode service." };
  }
  if (!response.ok) {
    return { error: `VIN decode request failed (${response.status}).` };
  }
  let json: unknown;
  try {
    json = await response.json();
  } catch {
    return { error: "Invalid JSON from VIN decode service." };
  }
  return parseVinDecodeResponse(json);
}
