export type EmploymentStatusCode =
  | "full_time"
  | "part_time"
  | "retired"
  | "at_home"
  | "disabled"
  | "other"
  | "";

export const EMPLOYMENT_STATUS_OPTIONS: { value: Exclude<EmploymentStatusCode, "">; label: string }[] = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "retired", label: "Retired" },
  { value: "at_home", label: "At home" },
  { value: "disabled", label: "Disabled" },
  { value: "other", label: "Other" }
];

const EMPLOYMENT_STATUS_LABEL_BY_CODE = Object.fromEntries(
  EMPLOYMENT_STATUS_OPTIONS.map((opt) => [opt.value, opt.label])
) as Record<Exclude<EmploymentStatusCode, "">, string>;

const EMPLOYMENT_STATUS_ALIASES: Record<string, EmploymentStatusCode> = {
  full_time: "full_time",
  fulltime: "full_time",
  "full-time": "full_time",
  "full time": "full_time",
  part_time: "part_time",
  parttime: "part_time",
  "part-time": "part_time",
  "part time": "part_time",
  retired: "retired",
  retirement: "retired",
  at_home: "at_home",
  athome: "at_home",
  "at home": "at_home",
  stay_at_home: "at_home",
  "stay at home": "at_home",
  homemaker: "at_home",
  disabled: "disabled",
  disability: "disabled",
  other: "other"
};

export function normalizeEmploymentStatusCode(value: string | null | undefined): EmploymentStatusCode {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) {
    return "";
  }
  const lower = trimmed.toLowerCase();
  if (EMPLOYMENT_STATUS_ALIASES[lower]) {
    return EMPLOYMENT_STATUS_ALIASES[lower];
  }
  const slug = lower.replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  if (EMPLOYMENT_STATUS_ALIASES[slug]) {
    return EMPLOYMENT_STATUS_ALIASES[slug];
  }
  const direct = EMPLOYMENT_STATUS_OPTIONS.find((opt) => opt.value === slug);
  return direct?.value ?? "";
}

export function formatEmploymentStatusDisplay(code: string | null | undefined): string {
  const normalized = normalizeEmploymentStatusCode(code);
  if (!normalized) {
    const raw = String(code ?? "").trim();
    return raw;
  }
  return EMPLOYMENT_STATUS_LABEL_BY_CODE[normalized];
}

export function isEmploymentStatusOther(code: string | null | undefined): boolean {
  return normalizeEmploymentStatusCode(code) === "other";
}

/** Keep legacy `employment_type` in sync for website leads and older data. */
export function employmentTypeFromStatus(status: string | null | undefined): string {
  const normalized = normalizeEmploymentStatusCode(status);
  if (normalized === "full_time" || normalized === "part_time") {
    return normalized;
  }
  return "";
}
