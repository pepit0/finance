export type ApprovalVehicleInput = {
  monthlyPayment: number;
  annualRatePercent: number;
  termMonths: number;
  ltvPercent: number;
  /** When set, principal used = min(PV from payment, this cap). */
  maxAmountFinanced?: number | null;
};

export type ApprovalVehicleResult =
  | {
      ok: true;
      principalFromPayment: number;
      principalUsed: number;
      cappedByMax: boolean;
      maxVehiclePrice: number;
      impliedPaymentFromPrincipalUsed: number;
    }
  | { ok: false; errors: string[] };

function presentValueFromPayment(payment: number, monthlyRate: number, termMonths: number): number {
  if (termMonths <= 0 || !Number.isFinite(termMonths)) {
    return NaN;
  }
  if (payment < 0 || !Number.isFinite(payment)) {
    return NaN;
  }
  if (monthlyRate === 0) {
    return payment * termMonths;
  }
  const factor = 1 - Math.pow(1 + monthlyRate, -termMonths);
  return (payment * factor) / monthlyRate;
}

/** Ordinary annuity: payment given principal, monthly rate, term. */
export function paymentFromPrincipal(principal: number, monthlyRate: number, termMonths: number): number {
  if (termMonths <= 0 || !Number.isFinite(termMonths)) {
    return NaN;
  }
  if (principal < 0 || !Number.isFinite(principal)) {
    return NaN;
  }
  if (monthlyRate === 0) {
    return principal / termMonths;
  }
  const factor = (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / (Math.pow(1 + monthlyRate, termMonths) - 1);
  return principal * factor;
}

export function computeApprovalVehicle(input: ApprovalVehicleInput): ApprovalVehicleResult {
  const errors: string[] = [];

  const pmt = input.monthlyPayment;
  const apr = input.annualRatePercent;
  const n = input.termMonths;
  const ltv = input.ltvPercent;
  const maxFin = input.maxAmountFinanced;

  if (!Number.isFinite(pmt) || pmt <= 0) {
    errors.push("Monthly payment must be a positive number.");
  }
  if (!Number.isFinite(apr) || apr < 0) {
    errors.push("Annual rate must be zero or a positive number.");
  }
  if (!Number.isFinite(n) || n <= 0 || !Number.isInteger(n)) {
    errors.push("Term must be a positive whole number of months.");
  }
  if (!Number.isFinite(ltv) || ltv <= 0) {
    errors.push("LTV must be a positive percentage.");
  }
  if (maxFin != null && maxFin !== undefined) {
    if (!Number.isFinite(maxFin) || maxFin < 0) {
      errors.push("Max amount financed must be empty or a non-negative number.");
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const monthlyRate = apr / 100 / 12;
  const principalFromPayment = presentValueFromPayment(pmt, monthlyRate, n);

  if (!Number.isFinite(principalFromPayment) || principalFromPayment < 0) {
    return { ok: false, errors: ["Could not compute amount financed from the given values."] };
  }

  let principalUsed = principalFromPayment;
  let cappedByMax = false;

  if (maxFin != null && maxFin !== undefined && Number.isFinite(maxFin)) {
    principalUsed = Math.min(principalFromPayment, maxFin);
    cappedByMax = principalUsed < principalFromPayment;
  }

  const maxVehiclePrice = principalUsed / (ltv / 100);
  const impliedPaymentFromPrincipalUsed = paymentFromPrincipal(principalUsed, monthlyRate, n);

  if (!Number.isFinite(maxVehiclePrice) || maxVehiclePrice < 0) {
    return { ok: false, errors: ["Could not compute max vehicle price."] };
  }
  if (!Number.isFinite(impliedPaymentFromPrincipalUsed)) {
    return { ok: false, errors: ["Could not compute implied payment."] };
  }

  return {
    ok: true,
    principalFromPayment,
    principalUsed,
    cappedByMax,
    maxVehiclePrice,
    impliedPaymentFromPrincipalUsed
  };
}
