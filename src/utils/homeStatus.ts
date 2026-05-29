export type HomeStatusCode = "with_parents" | "rent" | "own_mortgage" | "own_clear" | "";

export const HOME_STATUS_OPTIONS: { value: HomeStatusCode; label: string }[] = [
  { value: "with_parents", label: "With parents" },
  { value: "rent", label: "Rent" },
  { value: "own_mortgage", label: "Own with mortgage" },
  { value: "own_clear", label: "Own free & clear" }
];

const HOME_STATUS_ALIASES: Record<string, HomeStatusCode> = {
  with_parents: "with_parents",
  withparents: "with_parents",
  "with parents": "with_parents",
  parents: "with_parents",
  rent: "rent",
  renting: "rent",
  own_mortgage: "own_mortgage",
  ownwithmortgage: "own_mortgage",
  "own with mortgage": "own_mortgage",
  mortgage: "own_mortgage",
  own_clear: "own_clear",
  ownfreeandclear: "own_clear",
  "own free & clear": "own_clear",
  "own free and clear": "own_clear",
  free_and_clear: "own_clear"
};

export function normalizeHomeStatusCode(value: string | null | undefined): HomeStatusCode {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) {
    return "";
  }
  const lower = trimmed.toLowerCase();
  if (HOME_STATUS_ALIASES[lower]) {
    return HOME_STATUS_ALIASES[lower];
  }
  const slug = lower.replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  if (HOME_STATUS_ALIASES[slug]) {
    return HOME_STATUS_ALIASES[slug];
  }
  const direct = HOME_STATUS_OPTIONS.find((opt) => opt.value === slug);
  return direct?.value ?? "";
}

export function formatHomeStatusDisplay(code: string | null | undefined): string {
  const normalized = normalizeHomeStatusCode(code);
  if (!normalized) {
    return "";
  }
  return HOME_STATUS_OPTIONS.find((opt) => opt.value === normalized)?.label ?? code ?? "";
}

export function showHomeMonthlyPayment(status: HomeStatusCode): boolean {
  return status !== "" && status !== "own_clear";
}

export function isHomeMonthlyPaymentOptional(status: HomeStatusCode): boolean {
  return status === "with_parents";
}
