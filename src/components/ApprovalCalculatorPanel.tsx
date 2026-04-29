import { useCallback, useMemo, useState } from "react";
import { computeApprovalGross, type ApprovalGrossResult } from "../utils/approvalGross";
import { computeApprovalVehicle, type ApprovalVehicleResult } from "../utils/approvalVehicleCalculator";
import { InventoryMatchesPanel } from "./InventoryMatchesPanel";

const money = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
  maximumFractionDigits: 2
});

function parseOptionalNumber(raw: string): number | null | undefined {
  const t = raw.trim();
  if (t === "") {
    return undefined;
  }
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function parseRequiredNumber(raw: string): number | null {
  const t = raw.trim();
  if (t === "") {
    return null;
  }
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export interface ApprovalCalculatorPanelProps {
  costValueCad: string;
  onCostValueCadChange: (value: string) => void;
}

type GrossUiOutcome =
  | null
  | { grossUi: "incomplete" }
  | { grossUi: "backParseError"; message: string }
  | { grossUi: "shopParseError"; message: string }
  | { grossUi: "tradeParseError"; message: string }
  | ApprovalGrossResult;

export function ApprovalCalculatorPanel({ costValueCad, onCostValueCadChange }: ApprovalCalculatorPanelProps) {
  const [monthlyPayment, setMonthlyPayment] = useState("");
  const [annualRatePercent, setAnnualRatePercent] = useState("");
  const [termMonths, setTermMonths] = useState("");
  const [ltvPercent, setLtvPercent] = useState("");
  const [maxAmountFinanced, setMaxAmountFinanced] = useState("");
  const [shopBillCad, setShopBillCad] = useState("");
  const [sellPriceCad, setSellPriceCad] = useState("");
  const [backGrossCad, setBackGrossCad] = useState("");
  const [tradeInAcvCad, setTradeInAcvCad] = useState("");
  const [tradeInOwingCad, setTradeInOwingCad] = useState("");

  type VehicleUiResult =
    | null
    | { parseError: string }
    | ApprovalVehicleResult;

  const result = useMemo((): VehicleUiResult => {
    const pmt = parseRequiredNumber(monthlyPayment);
    const apr = parseRequiredNumber(annualRatePercent);
    const termRaw = parseRequiredNumber(termMonths);
    const ltv = parseRequiredNumber(ltvPercent);
    const maxFin = parseOptionalNumber(maxAmountFinanced);

    if (pmt === null || apr === null || termRaw === null || ltv === null) {
      return null;
    }
    if (maxFin === null) {
      return { parseError: "Max amount financed must be a valid number or empty." };
    }

    const term = Math.round(termRaw);
    if (term !== termRaw) {
      return { parseError: "Term must be a whole number of months." };
    }

    return computeApprovalVehicle({
      monthlyPayment: pmt,
      annualRatePercent: apr,
      termMonths: term,
      ltvPercent: ltv,
      maxAmountFinanced: maxFin
    });
  }, [monthlyPayment, annualRatePercent, termMonths, ltvPercent, maxAmountFinanced]);

  const grossOutcome = useMemo((): GrossUiOutcome => {
    if (!result || "parseError" in result || !result.ok) {
      return null;
    }
    const sell = parseRequiredNumber(sellPriceCad);
    const baseCost = parseRequiredNumber(costValueCad);
    if (sell === null || baseCost === null) {
      return { grossUi: "incomplete" };
    }
    const shop = parseOptionalNumber(shopBillCad);
    if (shop === null) {
      return { grossUi: "shopParseError", message: "Shop bill must be a valid number or empty." };
    }
    const back = parseOptionalNumber(backGrossCad);
    if (back === null) {
      return { grossUi: "backParseError", message: "Back gross must be a valid number or empty." };
    }
    const tradeAcv = parseOptionalNumber(tradeInAcvCad);
    const tradeOwing = parseOptionalNumber(tradeInOwingCad);
    if (tradeAcv === null || tradeOwing === null) {
      return {
        grossUi: "tradeParseError",
        message: "Trade-in ACV and amount owing must be valid numbers or left blank."
      };
    }
    return computeApprovalGross({
      maxVehiclePrice: result.maxVehiclePrice,
      sellPrice: sell,
      baseCost,
      shopBill: shop,
      backGross: back,
      tradeInAcv: tradeAcv,
      tradeInOwing: tradeOwing
    });
  }, [result, sellPriceCad, costValueCad, shopBillCad, backGrossCad, tradeInAcvCad, tradeInOwingCad]);

  const vehicleOk = result && !("parseError" in result) && result.ok;

  const grossOkResult =
    grossOutcome && "ok" in grossOutcome && grossOutcome.ok ? grossOutcome : null;
  const panelTintClass =
    vehicleOk && grossOkResult
      ? grossOkResult.sellOverApprovalCap || grossOkResult.frontGross < 0
        ? "calculatorPanelTintWarn"
        : "calculatorPanelTintFit"
      : "";

  const clearApprovalForm = useCallback(() => {
    setMonthlyPayment("");
    setAnnualRatePercent("");
    setTermMonths("");
    setLtvPercent("");
    setMaxAmountFinanced("");
    setShopBillCad("");
    setSellPriceCad("");
    setBackGrossCad("");
    setTradeInAcvCad("");
    setTradeInOwingCad("");
    onCostValueCadChange("");
  }, [onCostValueCadChange]);

  return (
    <section className={["calculatorPanel", panelTintClass].filter(Boolean).join(" ")}>
      <header className="calculatorHeader">
        <div className="calculatorPanelHeaderRow">
          <h2>Approval vehicle calculator</h2>
          <button type="button" className="calculatorPanelClearBtn" onClick={clearApprovalForm}>
            Clear
          </button>
        </div>
      </header>

      <div className="calculatorSection">
        <h3 className="calculatorSubheading">Approval</h3>
        <div className="calculatorForm">
          <label>
            Monthly payment
            <input
              type="text"
              inputMode="decimal"
              value={monthlyPayment}
              onChange={(e) => setMonthlyPayment(e.target.value)}
              placeholder="e.g. 425"
              autoComplete="off"
            />
          </label>
          <label>
            Annual rate %
            <input
              type="text"
              inputMode="decimal"
              value={annualRatePercent}
              onChange={(e) => setAnnualRatePercent(e.target.value)}
              placeholder="e.g. 8.99"
              autoComplete="off"
            />
          </label>
          <label>
            Term (months)
            <input
              type="text"
              inputMode="numeric"
              value={termMonths}
              onChange={(e) => setTermMonths(e.target.value)}
              placeholder="e.g. 72"
              autoComplete="off"
            />
          </label>
          <label>
            LTV %
            <input
              type="text"
              inputMode="decimal"
              value={ltvPercent}
              onChange={(e) => setLtvPercent(e.target.value)}
              placeholder="e.g. 120"
              autoComplete="off"
            />
          </label>
          <label className="calculatorFullWidth">
            Max amount financed (optional)
            <input
              type="text"
              inputMode="decimal"
              value={maxAmountFinanced}
              onChange={(e) => setMaxAmountFinanced(e.target.value)}
              placeholder="Leave blank to estimate from payment"
              autoComplete="off"
            />
          </label>
        </div>
      </div>

      <div className="calculatorSection">
        <h3 className="calculatorSubheading">Desired gross</h3>
        <div className="calculatorForm">
          <div className="calculatorFullWidth calculatorCostShopRow">
            <div className="calculatorCostField">
              <label htmlFor="approval-cost-input">Cost</label>
              <input
                id="approval-cost-input"
                type="text"
                inputMode="decimal"
                value={costValueCad}
                onChange={(e) => onCostValueCadChange(e.target.value)}
                placeholder="e.g. 18500"
                autoComplete="off"
              />
              <p className="calculatorFieldHint">Click a cell in the vehicle book grid to fill.</p>
            </div>
            <label>
              Shop / mechanic (optional)
              <input
                type="text"
                inputMode="decimal"
                value={shopBillCad}
                onChange={(e) => setShopBillCad(e.target.value)}
                placeholder="0 or leave blank"
                autoComplete="off"
              />
            </label>
          </div>
          <div className="calculatorFullWidth calculatorCostShopRow">
            <label>
              Trade-in ACV (optional)
              <input
                type="text"
                inputMode="decimal"
                value={tradeInAcvCad}
                onChange={(e) => setTradeInAcvCad(e.target.value)}
                placeholder="e.g. 8000"
                autoComplete="off"
              />
            </label>
            <label>
              Owing on trade (optional)
              <input
                type="text"
                inputMode="decimal"
                value={tradeInOwingCad}
                onChange={(e) => setTradeInOwingCad(e.target.value)}
                placeholder="e.g. 4500"
                autoComplete="off"
              />
            </label>
          </div>
          <label className="calculatorFullWidth">
            Intended sell price
            <input
              type="text"
              inputMode="decimal"
              value={sellPriceCad}
              onChange={(e) => setSellPriceCad(e.target.value)}
              placeholder="e.g. 26995"
              autoComplete="off"
            />
          </label>
          <label className="calculatorFullWidth">
            Back gross (optional)
            <input
              type="text"
              inputMode="decimal"
              value={backGrossCad}
              onChange={(e) => setBackGrossCad(e.target.value)}
              placeholder="e.g. 1200"
              autoComplete="off"
            />
          </label>
        </div>
      </div>

      <div className="calculatorResults" aria-live="polite">
        {result === null ? <p className="calculatorHint">Fill in payment, rate, term, and LTV to see results.</p> : null}
        {result && "parseError" in result ? <p className="calculatorError">{result.parseError}</p> : null}
        {result && !("parseError" in result) && !result.ok ? (
          <ul className="calculatorErrorList">
            {result.errors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        ) : null}
        {vehicleOk && result && !("parseError" in result) && result.ok ? (
          <div className="calculatorVehicleResults">
            <div className="calculatorResultCards">
              <div className="calculatorResultCard">
                <h3>Amount financed (used)</h3>
                <p className="calculatorResultValue">{money.format(result.principalUsed)}</p>
                {result.cappedByMax ? (
                  <p className="calculatorResultNote">
                    Capped by max amount financed (payment would support {money.format(result.principalFromPayment)}).
                  </p>
                ) : (
                  <p className="calculatorResultNote">
                    From payment: {money.format(result.principalFromPayment)}
                    {maxAmountFinanced.trim() ? "" : " (estimated)"}.
                  </p>
                )}
              </div>
              <div className="calculatorResultCard">
                <h3>Max vehicle price (LTV-based)</h3>
                <p className="calculatorResultValue">{money.format(result.maxVehiclePrice)}</p>
              </div>
              <div className="calculatorResultCard">
                <h3>Implied payment at amount used</h3>
                <p className="calculatorResultValue">{money.format(result.impliedPaymentFromPrincipalUsed)}</p>
                <p className="calculatorResultNote">Compare to your entered monthly payment.</p>
              </div>
            </div>
            <InventoryMatchesPanel approvedMaxPriceCad={result.maxVehiclePrice} />
          </div>
        ) : null}

        {grossOutcome && "grossUi" in grossOutcome && grossOutcome.grossUi === "backParseError" ? (
          <p className="calculatorError calculatorGrossBlock">{grossOutcome.message}</p>
        ) : null}
        {grossOutcome && "grossUi" in grossOutcome && grossOutcome.grossUi === "shopParseError" ? (
          <p className="calculatorError calculatorGrossBlock">{grossOutcome.message}</p>
        ) : null}
        {grossOutcome && "grossUi" in grossOutcome && grossOutcome.grossUi === "tradeParseError" ? (
          <p className="calculatorError calculatorGrossBlock">{grossOutcome.message}</p>
        ) : null}
        {grossOutcome && "grossUi" in grossOutcome && grossOutcome.grossUi === "incomplete" && vehicleOk ? (
          <p className="calculatorHint calculatorGrossBlock">
            Enter cost and intended sell price to see desired gross (shop bill and trade fields are optional).
          </p>
        ) : null}
        {grossOutcome && "ok" in grossOutcome && grossOutcome.ok ? (
          <div className="calculatorGrossBlock">
            {grossOutcome.sellOverApprovalCap || grossOutcome.frontGross < 0 ? (
              <p className="calculatorGrossNote">
                {[
                  grossOutcome.sellOverApprovalCap ? "Sell is above the modeled approval max vehicle price." : "",
                  grossOutcome.frontGross < 0 ? "Front gross is negative with these inputs." : ""
                ]
                  .filter(Boolean)
                  .join(" ")}
              </p>
            ) : null}
            <div className="calculatorResultCards">
              <div className="calculatorResultCard">
                <h3>Total cost (cost + shop)</h3>
                <p className="calculatorResultValue">{money.format(grossOutcome.totalCost)}</p>
                <p className="calculatorResultNote">Front gross starts from sell minus this amount.</p>
              </div>
              {tradeInAcvCad.trim() || tradeInOwingCad.trim() ? (
                <div className="calculatorResultCard">
                  <h3>Trade (ACV − payoff)</h3>
                  <p className="calculatorResultValue">{money.format(grossOutcome.tradeNetCad)}</p>
                  <p className="calculatorResultNote">
                    Added to front gross (equity helps; negative when payoff exceeds ACV).
                  </p>
                </div>
              ) : null}
              <div className="calculatorResultCard">
                <h3>Front gross</h3>
                <p className="calculatorResultValue">{money.format(grossOutcome.frontGross)}</p>
                <p className="calculatorResultNote">Sell − total cost ± trade (ACV − payoff).</p>
              </div>
              <div className="calculatorResultCard">
                <h3>Total gross{grossOutcome.includesBack ? " (front + back)" : ""}</h3>
                <p className="calculatorResultValue">{money.format(grossOutcome.totalGross)}</p>
                {!grossOutcome.includesBack ? (
                  <p className="calculatorResultNote">Add back gross to include F&amp;I in the total.</p>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
        {grossOutcome && "ok" in grossOutcome && !grossOutcome.ok ? (
          <ul className="calculatorErrorList calculatorGrossBlock">
            {grossOutcome.errors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
