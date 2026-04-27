import { useCallback, useEffect, useMemo, useState } from "react";
import type { BookGrid } from "../types/vehicleBook";
import { BOOK_CONDITIONS, BOOK_REGIONS } from "../types/vehicleBook";
import { getStubBookValues } from "../utils/stubBookValuation";
import type { DecodedVehicle } from "../utils/vpicDecode";
import { decodeVinExtended, validateVinFormat } from "../utils/vpicDecode";

const money = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
  maximumFractionDigits: 0
});

export type PickCostValueMeta = { condition: string; region: string };

/** Shown next to the lender PDF viewer when a VIN has been decoded. */
export type VehicleBookGuideCaption = {
  modelYear: string;
  odometerLabel: string;
  vehicleName: string;
  trimLabel: string;
};

export interface VehicleBookPanelProps {
  onPickCostValue?: (amount: number, meta: PickCostValueMeta) => void;
  onVehicleGuideCaptionChange?: (caption: VehicleBookGuideCaption | null) => void;
}

function uniqueTrimCandidates(decoded: DecodedVehicle | null): string[] {
  if (!decoded) {
    return [];
  }
  const candidates = [
    decoded.trim,
    decoded.raw.Series ?? "",
    decoded.raw.Trim2 ?? "",
    decoded.model ? `${decoded.model}`.trim() : ""
  ]
    .map((s) => s.trim())
    .filter(Boolean);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const c of candidates) {
    const key = c.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(c);
    }
  }
  return out.length > 0 ? out : ["(unspecified)"];
}

function buildVehicleName(decoded: DecodedVehicle): string {
  const parts = [decoded.make.trim(), decoded.model.trim()].filter(Boolean);
  return parts.join(" ").trim() || "—";
}

function buildOdometerLabel(odometerKmField: string): string {
  const raw = odometerKmField.trim();
  if (raw === "") {
    return "odometer not entered (km)";
  }
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) {
    return "invalid odometer (km)";
  }
  return `${new Intl.NumberFormat("en-CA").format(n)} km`;
}

export function VehicleBookPanel({
  onPickCostValue,
  onVehicleGuideCaptionChange
}: VehicleBookPanelProps = {}) {
  const [vinInput, setVinInput] = useState("");
  const [odometerKm, setOdometerKm] = useState("");
  const [decoding, setDecoding] = useState(false);
  const [decodeError, setDecodeError] = useState<string | null>(null);
  const [decoded, setDecoded] = useState<DecodedVehicle | null>(null);

  const [selectedTrim, setSelectedTrim] = useState("");
  const [trimOverride, setTrimOverride] = useState("");

  const [bookGrid, setBookGrid] = useState<BookGrid | null>(null);
  const [bookError, setBookError] = useState<string | null>(null);

  const trimOptions = useMemo(() => uniqueTrimCandidates(decoded), [decoded]);

  useEffect(() => {
    if (trimOptions.length > 0 && !trimOptions.includes(selectedTrim)) {
      setSelectedTrim(trimOptions[0]);
    }
  }, [trimOptions, selectedTrim]);

  useEffect(() => {
    if (!onVehicleGuideCaptionChange) {
      return;
    }
    if (!decoded) {
      onVehicleGuideCaptionChange(null);
      return;
    }
    const trimLabel = (trimOverride.trim() || selectedTrim).trim() || "(unspecified)";
    onVehicleGuideCaptionChange({
      modelYear: decoded.modelYear.trim() || "—",
      odometerLabel: buildOdometerLabel(odometerKm),
      vehicleName: buildVehicleName(decoded),
      trimLabel
    });
  }, [decoded, odometerKm, onVehicleGuideCaptionChange, trimOverride, selectedTrim]);

  const trimKey = (trimOverride.trim() || selectedTrim).trim() || "(unspecified)";

  const parseMileageKm = (): number | null => {
    const kmRaw = odometerKm.trim();
    if (kmRaw === "") {
      return 0;
    }
    const mileageKm = Number(kmRaw);
    if (!Number.isFinite(mileageKm) || mileageKm < 0) {
      return null;
    }
    return mileageKm;
  };

  const applyStubBookForDecoded = (d: DecodedVehicle) => {
    const mileageKm = parseMileageKm();
    if (mileageKm === null) {
      setBookError("Odometer must be empty or a non-negative number (km).");
      setBookGrid(null);
      return;
    }
    const opts = uniqueTrimCandidates(d);
    const tk = (trimOverride.trim() || opts[0] || "(unspecified)").trim();
    setBookGrid(
      getStubBookValues({
        vin: vinInput.trim().toUpperCase(),
        trimKey: tk,
        mileageKm
      })
    );
    setBookError(null);
  };

  const runDecode = async (): Promise<DecodedVehicle | null> => {
    setDecodeError(null);
    setDecoded(null);
    setBookGrid(null);
    setBookError(null);

    const localErr = validateVinFormat(vinInput);
    if (localErr) {
      setDecodeError(localErr);
      return null;
    }

    setDecoding(true);
    try {
      const result = await decodeVinExtended(vinInput);
      if ("error" in result) {
        setDecodeError(result.error);
        return null;
      }
      setDecoded(result);
      const opts = uniqueTrimCandidates(result);
      setSelectedTrim(opts[0] ?? "");
      return result;
    } finally {
      setDecoding(false);
    }
  };

  const runBookValues = () => {
    setBookError(null);
    setBookGrid(null);

    const vinErr = validateVinFormat(vinInput);
    if (vinErr) {
      setBookError(vinErr);
      return;
    }
    if (!decoded) {
      setBookError("Decode the VIN first.");
      return;
    }

    const mileageKm = parseMileageKm();
    if (mileageKm === null) {
      setBookError("Odometer must be empty or a non-negative number (km).");
      return;
    }

    setBookGrid(
      getStubBookValues({
        vin: vinInput.trim().toUpperCase(),
        trimKey,
        mileageKm
      })
    );
  };

  const refreshDecodeAndBook = async () => {
    const d = await runDecode();
    if (d) {
      applyStubBookForDecoded(d);
    }
  };

  const clearVehicleBook = useCallback(() => {
    setVinInput("");
    setOdometerKm("");
    setDecodeError(null);
    setDecoded(null);
    setSelectedTrim("");
    setTrimOverride("");
    setBookGrid(null);
    setBookError(null);
    setDecoding(false);
  }, []);

  return (
    <section className="calculatorPanel vehicleBookPanel">
      <header className="calculatorHeader">
        <div className="calculatorPanelHeaderRow">
          <h2>Vehicle book (VIN)</h2>
          <button type="button" className="calculatorPanelClearBtn" onClick={clearVehicleBook}>
            Clear
          </button>
        </div>
        <p className="calculatorIntro">Values are placeholders until a licensed Canadian book API is connected.</p>
      </header>

      <p className="demoBookBanner" role="alert">
        Demo book values only — not for lending or retail decisions.
      </p>

      <div className="vehicleBookForm">
        <label className="vehicleBookFullWidth">
          VIN (17 characters)
          <input
            type="text"
            value={vinInput}
            onChange={(e) => setVinInput(e.target.value.toUpperCase())}
            placeholder="e.g. 5UXWX7C5XBA000000"
            maxLength={17}
            spellCheck={false}
            autoComplete="off"
          />
        </label>
        <label>
          Odometer (km, optional)
          <input
            type="text"
            inputMode="numeric"
            value={odometerKm}
            onChange={(e) => setOdometerKm(e.target.value)}
            placeholder="e.g. 95000"
            autoComplete="off"
          />
        </label>
        <div className="vehicleBookActions">
          <button type="button" className="vehicleBookPrimaryBtn" onClick={runDecode} disabled={decoding}>
            {decoding ? "Decoding…" : "Decode VIN"}
          </button>
          <button type="button" className="vehicleBookSecondaryBtn" onClick={runBookValues}>
            Get demo book values
          </button>
          <button type="button" className="vehicleBookSecondaryBtn" onClick={refreshDecodeAndBook} disabled={decoding}>
            Refresh
          </button>
        </div>
      </div>

      {decodeError ? <p className="calculatorError">{decodeError}</p> : null}

      {decoded ? (
        <div className="vehicleDecodeSummary">
          <h3>Decoded vehicle</h3>
          <p>
            <strong>{[decoded.modelYear, decoded.make, decoded.model].filter(Boolean).join(" ")}</strong>
            {decoded.trim ? ` — ${decoded.trim}` : null}
          </p>
          <label>
            Trim selection
            <select value={selectedTrim} onChange={(e) => setSelectedTrim(e.target.value)}>
              {trimOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label>
            Trim override (optional)
            <input
              type="text"
              value={trimOverride}
              onChange={(e) => setTrimOverride(e.target.value)}
              placeholder="Overrides dropdown for demo book key"
              autoComplete="off"
            />
          </label>
        </div>
      ) : null}

      {bookError ? <p className="calculatorError">{bookError}</p> : null}

      {bookGrid ? (
        <div className="bookTableWrap">
          {onPickCostValue ? (
            <p className="bookPickHint">
              Click a cell to send that demo value to the approval calculator cost field.
            </p>
          ) : null}
          <table className="bookValueTable">
            <caption className="srOnly">Demo book values by condition and region</caption>
            <thead>
              <tr>
                <th scope="col">Condition</th>
                {BOOK_REGIONS.map((region) => (
                  <th key={region} scope="col">
                    {region}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {BOOK_CONDITIONS.map((condition) => (
                <tr key={condition}>
                  <th scope="row">{condition}</th>
                  {BOOK_REGIONS.map((region) => {
                    const amount = bookGrid[condition][region];
                    return (
                      <td key={region}>
                        {onPickCostValue ? (
                          <button
                            type="button"
                            className="bookCellBtn"
                            onClick={() => onPickCostValue(amount, { condition, region })}
                          >
                            {money.format(amount)}
                          </button>
                        ) : (
                          money.format(amount)
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
