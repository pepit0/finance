export type ApprovalGrossInput = {
  maxVehiclePrice: number;
  sellPrice: number;
  /** Landed / in-deal cost before mechanic shop. */
  baseCost: number;
  /** Mechanic shop bill; omit or null for zero. */
  shopBill?: number | null;
  backGross?: number | null;
};

export type ApprovalGrossResult =
  | {
      ok: true;
      /** baseCost + shop (shop omitted counts as 0). */
      totalCost: number;
      frontGross: number;
      totalGross: number;
      sellOverApprovalCap: boolean;
      /** True when backGross was provided (total includes it). */
      includesBack: boolean;
    }
  | { ok: false; errors: string[] };

export function computeApprovalGross(input: ApprovalGrossInput): ApprovalGrossResult {
  const errors: string[] = [];
  const { maxVehiclePrice, sellPrice, baseCost } = input;
  const back = input.backGross;
  const shopRaw = input.shopBill;

  if (!Number.isFinite(maxVehiclePrice) || maxVehiclePrice < 0) {
    errors.push("Max vehicle price must be a non-negative number.");
  }
  if (!Number.isFinite(sellPrice) || sellPrice < 0) {
    errors.push("Sell price must be a non-negative number.");
  }
  if (!Number.isFinite(baseCost) || baseCost < 0) {
    errors.push("Cost must be a non-negative number.");
  }
  if (shopRaw != null && (!Number.isFinite(shopRaw) || shopRaw < 0)) {
    errors.push("Shop bill must be empty or a non-negative number.");
  }
  if (back != null && back !== undefined && (!Number.isFinite(back) || back < 0)) {
    errors.push("Back gross must be empty or a non-negative number.");
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const shop = shopRaw == null || shopRaw === undefined ? 0 : shopRaw;
  const totalCost = baseCost + shop;
  const frontGross = sellPrice - totalCost;
  const sellOverApprovalCap = sellPrice > maxVehiclePrice;
  const includesBack = back != null && back !== undefined && Number.isFinite(back);
  const totalGross = frontGross + (includesBack ? (back as number) : 0);

  if (!Number.isFinite(frontGross) || !Number.isFinite(totalGross) || !Number.isFinite(totalCost)) {
    return { ok: false, errors: ["Could not compute gross from the given values."] };
  }

  return {
    ok: true,
    totalCost,
    frontGross,
    totalGross,
    sellOverApprovalCap,
    includesBack
  };
}
