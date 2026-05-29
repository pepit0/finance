export type EmploymentTypeCode = "full_time" | "part_time" | "";

export const EMPLOYMENT_TYPE_OPTIONS: { value: EmploymentTypeCode; label: string }[] = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" }
];

const EMPLOYMENT_TYPE_LABEL_BY_CODE = Object.fromEntries(
  EMPLOYMENT_TYPE_OPTIONS.map((opt) => [opt.value, opt.label])
) as Record<Exclude<EmploymentTypeCode, "">, string>;

export function normalizeEmploymentTypeCode(value: string | null | undefined): EmploymentTypeCode {
  const raw = String(value ?? "").trim();
  if (!raw) {
    return "";
  }
  const key = raw.toLowerCase().replace(/[\s-]+/g, "_");
  if (key in EMPLOYMENT_TYPE_LABEL_BY_CODE) {
    return key as EmploymentTypeCode;
  }
  if (key === "fulltime" || key.startsWith("full")) {
    return "full_time";
  }
  if (key === "parttime" || key.startsWith("part")) {
    return "part_time";
  }
  return "";
}

export function formatEmploymentTypeDisplay(code: string | null | undefined): string {
  const normalized = normalizeEmploymentTypeCode(code);
  if (!normalized) {
    return "";
  }
  return EMPLOYMENT_TYPE_LABEL_BY_CODE[normalized];
}
