/** Website pre-approval stores payment budget as coded integers in some flows. */
const BUDGET_CODE_LABELS: Record<number, string> = {
  199: "Less than $200/month",
  1001: "$1000+/month"
};

/** Human-readable label for summary, hints, and edit fields. */
export function formatMonthlyBudgetCadDisplay(value: string | null | undefined): string {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) {
    return "";
  }
  const asNumber = Number(trimmed);
  if (Number.isFinite(asNumber) && BUDGET_CODE_LABELS[asNumber]) {
    return BUDGET_CODE_LABELS[asNumber];
  }
  if (/^\d+$/.test(trimmed)) {
    return `$${trimmed}/month`;
  }
  return trimmed;
}
