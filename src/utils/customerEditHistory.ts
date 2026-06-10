import type { CrmCreditApplicationInfo, CrmCustomerEditChange, CrmCustomerEditSnapshot } from "../types/crm";
import { formatCanadianProvince } from "./canadianProvince";
import { formatCreditScoreBandDisplay } from "./creditScoreBand";
import { formatEmploymentStatusDisplay } from "./employmentStatus";
import { formatHomeStatusDisplay } from "./homeStatus";
import { formatPhoneDisplay } from "./phoneFormat";
import { formatTenureDisplay } from "./tenure";

const EMPTY = "(empty)";

const PROFILE_FIELDS: { field: string; label: string }[] = [
  { field: "display_name", label: "Full name" },
  { field: "phone", label: "Primary phone" },
  { field: "secondary_phone", label: "Secondary phone" },
  { field: "email", label: "Email" },
  { field: "date_of_birth", label: "Date of birth" },
  { field: "assigned_to_email", label: "Assigned to" },
  { field: "status", label: "Status" }
];

const CREDIT_APP_FIELDS: { field: keyof CrmCreditApplicationInfo; label: string }[] = [
  { field: "first_name", label: "First name" },
  { field: "middle_name", label: "Middle name" },
  { field: "last_name", label: "Last name" },
  { field: "phone", label: "Primary phone" },
  { field: "secondary_phone", label: "Secondary phone" },
  { field: "email", label: "Email" },
  { field: "sin", label: "SIN number" },
  { field: "date_of_birth", label: "Date of birth" },
  { field: "street", label: "Street address" },
  { field: "line2", label: "Unit / suite" },
  { field: "city", label: "City" },
  { field: "province", label: "Province" },
  { field: "postal_code", label: "Postal code" },
  { field: "address_tenure", label: "Time at address" },
  { field: "previous_street", label: "Previous street" },
  { field: "previous_city", label: "Previous city" },
  { field: "previous_province", label: "Previous province" },
  { field: "previous_postal_code", label: "Previous postal code" },
  { field: "previous_address_tenure", label: "Time at previous address" },
  { field: "home_status", label: "Home" },
  { field: "home_monthly_payment_cad", label: "Monthly payment" },
  { field: "mortgage_amount_cad", label: "Mortgage amount" },
  { field: "mortgage_holder", label: "Mortgage holder" },
  { field: "home_market_value_cad", label: "Market value" },
  { field: "employer", label: "Employer" },
  { field: "job_title", label: "Job title" },
  { field: "work_street", label: "Work address" },
  { field: "work_city", label: "Work city" },
  { field: "work_province", label: "Work province" },
  { field: "job_tenure", label: "Time at job" },
  { field: "previous_employer", label: "Previous employer" },
  { field: "previous_job_title", label: "Previous job title" },
  { field: "previous_work_street", label: "Previous work address" },
  { field: "previous_work_city", label: "Previous work city" },
  { field: "previous_work_province", label: "Previous work province" },
  { field: "previous_job_tenure", label: "Time at previous job" },
  { field: "employment_status", label: "Employment status" },
  { field: "employment_other_description", label: "Employment detail" },
  { field: "gross_monthly_income_cad", label: "Main monthly income" },
  { field: "other_monthly_income_cad", label: "Other monthly income" },
  { field: "other_income_description", label: "Other income description" },
  { field: "monthly_budget_cad", label: "Monthly payment budget" },
  { field: "down_payment_cad", label: "Down payment" },
  { field: "credit_score_band", label: "Credit score" },
  { field: "vehicle_interest", label: "Vehicle interest" },
  { field: "has_trade", label: "Has trade-in" },
  { field: "trade_year", label: "Trade year" },
  { field: "trade_make", label: "Trade make" },
  { field: "trade_model", label: "Trade model" },
  { field: "trade_kms", label: "Trade odometer" },
  { field: "trade_vin", label: "Trade VIN" },
  { field: "trade_has_registration", label: "Trade registration on file" },
  { field: "has_co_signer", label: "Co-signer" },
  { field: "co_signer_details", label: "Co-signer details" },
  { field: "check_drivers_license", label: "Driver's licence collected" },
  { field: "check_paystubs", label: "Paystubs collected" },
  { field: "consent_contact", label: "Consent to contact" },
  { field: "consent_credit", label: "Consent for credit inquiry" },
  { field: "notes", label: "Finance manager notes" }
];

const ATTACHMENT_FIELDS: (keyof CrmCreditApplicationInfo)[] = [
  "drivers_license_file",
  "paystubs_file",
  "trade_registration_file"
];

function normalizeScalar(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "boolean") {
    return value ? "yes" : "no";
  }
  return String(value).trim();
}

function displayProfileValue(field: string, value: unknown): string {
  const raw = normalizeScalar(value);
  if (!raw) {
    return EMPTY;
  }
  if (field === "phone" || field === "secondary_phone") {
    return formatPhoneDisplay(raw) || raw;
  }
  if (field === "status") {
    return raw === "lost" ? "Lost" : "Active";
  }
  if (field === "assigned_to_email" && raw === "") {
    return "Unassigned";
  }
  return raw;
}

function formatAttachmentFiles(value: unknown): string {
  if (Array.isArray(value)) {
    const names = value
      .map((item) => (item && typeof item === "object" ? String((item as { file_name?: string }).file_name ?? "").trim() : ""))
      .filter(Boolean);
    if (names.length === 0) {
      return "Not uploaded";
    }
    return names.length === 1 ? `Uploaded: ${names[0]}` : `Uploaded: ${names.length} files (${names.join(", ")})`;
  }
  const attachment = value as { file_name?: string } | null;
  const name = attachment?.file_name?.trim();
  return name ? `Uploaded: ${name}` : "Not uploaded";
}

function displayCreditAppValue(field: keyof CrmCreditApplicationInfo, value: unknown): string {
  if (ATTACHMENT_FIELDS.includes(field)) {
    return formatAttachmentFiles(value);
  }
  const raw = normalizeScalar(value);
  if (!raw) {
    return EMPTY;
  }
  if (field === "phone" || field === "secondary_phone") {
    return formatPhoneDisplay(raw) || raw;
  }
  if (field === "province" || field === "previous_province" || field === "work_province" || field === "previous_work_province") {
    return formatCanadianProvince(raw);
  }
  if (field === "credit_score_band") {
    return formatCreditScoreBandDisplay(raw) || raw;
  }
  if (field === "employment_status") {
    return formatEmploymentStatusDisplay(raw) || raw;
  }
  if (field === "home_status") {
    return formatHomeStatusDisplay(raw) || raw;
  }
  if (field === "address_tenure" || field === "previous_address_tenure" || field === "job_tenure" || field === "previous_job_tenure") {
    return formatTenureDisplay(raw) || raw;
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  return raw;
}

function attachmentSnapshot(value: unknown): string {
  if (Array.isArray(value)) {
    return value
      .map((item) =>
        item && typeof item === "object" ? String((item as { storage_path?: string }).storage_path ?? "").trim() : ""
      )
      .filter(Boolean)
      .sort()
      .join("|");
  }
  const attachment = value as { storage_path?: string } | null;
  return attachment?.storage_path?.trim() ?? "";
}

function diffField(
  field: string,
  label: string,
  oldValue: unknown,
  newValue: unknown,
  format: (field: string, value: unknown) => string
): CrmCustomerEditChange | null {
  const oldNorm = normalizeScalar(oldValue);
  const newNorm = normalizeScalar(newValue);
  if (oldNorm === newNorm) {
    return null;
  }
  return {
    field,
    label,
    old: format(field, oldValue),
    new: format(field, newValue)
  };
}

export function diffProfileSnapshot(
  before: CrmCustomerEditSnapshot,
  after: CrmCustomerEditSnapshot
): CrmCustomerEditChange[] {
  const changes: CrmCustomerEditChange[] = [];
  for (const { field, label } of PROFILE_FIELDS) {
    const change = diffField(
      field,
      label,
      before[field as keyof CrmCustomerEditSnapshot],
      after[field as keyof CrmCustomerEditSnapshot],
      displayProfileValue
    );
    if (change) {
      changes.push(change);
    }
  }
  return changes;
}

export function diffCreditAppSnapshot(
  before: CrmCreditApplicationInfo,
  after: CrmCreditApplicationInfo
): CrmCustomerEditChange[] {
  const changes: CrmCustomerEditChange[] = [];
  for (const { field, label } of CREDIT_APP_FIELDS) {
    const change = diffField(field, label, before[field], after[field], displayCreditAppValue);
    if (change) {
      changes.push(change);
    }
  }
  for (const field of ATTACHMENT_FIELDS) {
    const label =
      field === "drivers_license_file"
        ? "Driver's licence files"
        : field === "paystubs_file"
          ? "Paystubs files"
          : "Trade registration file";
    const oldSnap = attachmentSnapshot(before[field]);
    const newSnap = attachmentSnapshot(after[field]);
    if (oldSnap === newSnap) {
      continue;
    }
    changes.push({
      field,
      label,
      old: formatAttachmentFiles(before[field]),
      new: formatAttachmentFiles(after[field])
    });
  }
  return changes;
}

export function buildCreatedChanges(snapshot: CrmCustomerEditSnapshot): CrmCustomerEditChange[] {
  const changes = diffProfileSnapshot(emptySnapshot(), snapshot);
  const creditChanges = diffCreditAppSnapshot(
    {} as CrmCreditApplicationInfo,
    snapshot.credit_application_info
  );
  const merged = [...changes];
  for (const item of creditChanges) {
    if (!merged.some((row) => row.field === item.field)) {
      merged.push(item);
    }
  }
  return merged;
}

export function buildEditSummary(source: string, changes: CrmCustomerEditChange[]): string {
  if (changes.length === 0) {
    return source;
  }
  const labels = changes.slice(0, 4).map((c) => c.label);
  const suffix = changes.length > 4 ? ` +${changes.length - 4} more` : "";
  return `${labels.join(", ")}${suffix}`;
}

export function emptySnapshot(): CrmCustomerEditSnapshot {
  return {
    display_name: "",
    phone: null,
    secondary_phone: null,
    email: null,
    date_of_birth: null,
    assigned_to: null,
    assigned_to_email: null,
    status: "active",
    lost_at: null,
    credit_application_info: {} as CrmCreditApplicationInfo
  };
}

export function sourceLabel(source: string): string {
  switch (source) {
    case "created":
      return "Created";
    case "profile":
      return "Profile";
    case "credit_app":
      return "Credit app";
    case "assignment":
      return "Assignment";
    case "status":
      return "Status";
    case "restore":
      return "Restore";
    default:
      return source;
  }
}
