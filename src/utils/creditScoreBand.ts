export type CreditScoreBandCode =
  | "excellent_750_plus"
  | "great_670_750"
  | "good_620_670"
  | "decent_550_619"
  | "poor_300_549"
  | "not_sure";

export const CREDIT_SCORE_BAND_OPTIONS: { value: CreditScoreBandCode; label: string }[] = [
  { value: "excellent_750_plus", label: "Excellent 750+" },
  { value: "great_670_750", label: "Great 670-750" },
  { value: "good_620_670", label: "Good 620-670" },
  { value: "decent_550_619", label: "Decent 550-619" },
  { value: "poor_300_549", label: "Rebuilding 300-549" },
  { value: "not_sure", label: "Customer unsure" }
];

const CREDIT_SCORE_LABEL_BY_CODE = Object.fromEntries(
  CREDIT_SCORE_BAND_OPTIONS.map((opt) => [opt.value, opt.label])
) as Record<CreditScoreBandCode, string>;

/** Map stored / ingested values to a canonical option code. */
export function normalizeCreditScoreBandCode(value: string | null | undefined): string {
  const raw = String(value ?? "").trim();
  if (!raw) {
    return "";
  }

  const key = raw.toLowerCase().replace(/[\s-]+/g, "_");
  if (key in CREDIT_SCORE_LABEL_BY_CODE) {
    return key;
  }

  if (
    key === "poor_300_549" ||
    key === "rebuilding_300_549" ||
    key.includes("rebuilding") ||
    key.includes("poor")
  ) {
    return "poor_300_549";
  }

  if (
    key === "not_sure" ||
    key === "unsure" ||
    key === "im_not_sure" ||
    key === "i_m_not_sure" ||
    key === "prefer_not_to_say" ||
    key === "dont_know" ||
    key === "do_not_know"
  ) {
    return "not_sure";
  }

  if (key.includes("excellent") || key.includes("750")) {
    return "excellent_750_plus";
  }
  if (key.includes("great") || key.includes("670")) {
    return "great_670_750";
  }
  if (key.includes("good") || key.includes("620")) {
    return "good_620_670";
  }
  if (key.includes("decent") || key.includes("550")) {
    return "decent_550_619";
  }

  return raw;
}

export function formatCreditScoreBandDisplay(value: string | null | undefined): string {
  const code = normalizeCreditScoreBandCode(value);
  if (!code) {
    return "";
  }
  return CREDIT_SCORE_LABEL_BY_CODE[code as CreditScoreBandCode] ?? code;
}
