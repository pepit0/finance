import type { CrmCreditApplicationInfo, CrmCustomer, CrmUserDirectoryRow } from "../types/crm";
import type { CrmSystemLeadListRow } from "../types/crm";
import { directoryPersonLabel, directoryUsername, isWebsiteLeadCustomer } from "./crmDirectoryAdmin";
import { formatCreditAppLegalName } from "./creditAppName";

export const SYSTEM_LEAD_COMMENT_PREFIX = "Website pre-approval application";

export function isSystemLeadActivityComment(body: string): boolean {
  return body.trimStart().startsWith(SYSTEM_LEAD_COMMENT_PREFIX);
}

export function formatLeadSheetTimestamp(date: Date): string {
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function mergeSeedIntoCreditAppInfo(
  base: CrmCreditApplicationInfo,
  seed: Partial<CrmCreditApplicationInfo>
): CrmCreditApplicationInfo {
  const merged = { ...base };
  for (const [key, value] of Object.entries(seed)) {
    const field = key as keyof CrmCreditApplicationInfo;
    if (typeof value === "boolean") {
      if (!merged[field] && value) {
        (merged[field] as boolean) = value;
      }
      continue;
    }
    if (typeof value === "string" && !String(merged[field] ?? "").trim()) {
      (merged[field] as string) = value;
    }
  }
  return merged;
}

export function leadSheetSourceLabelForCustomer(customer: CrmCustomer): string {
  return isWebsiteLeadCustomer(customer) ? "Website pre-approval" : "CRM credit application";
}

export function leadSheetAssigneeLabelForCustomer(
  customer: CrmCustomer,
  directory: CrmUserDirectoryRow[]
): string | null {
  if (!customer.assigned_to) {
    return null;
  }
  const row = directory.find((entry) => entry.user_id === customer.assigned_to);
  if (row) {
    return directoryUsername(row) ?? directoryPersonLabel(row);
  }
  return customer.assigned_to_email?.trim() || null;
}

export function leadSheetCustomerName(form: CrmCreditApplicationInfo, fallbackDisplayName: string): string {
  return formatCreditAppLegalName(form) || fallbackDisplayName;
}

export function customerStubFromSystemLeadRow(lead: CrmSystemLeadListRow): CrmCustomer {
  const customer = lead.customer;
  return {
    id: lead.customer_id,
    created_at: lead.created_at,
    created_by: null,
    created_by_email: null,
    display_name: customer.display_name,
    email: customer.email,
    phone: customer.phone,
    secondary_phone: null,
    date_of_birth: null,
    status: customer.status ?? "active",
    pipeline_stage: "fresh_lead",
    lost_at: null,
    last_call_at: null,
    assigned_to: lead.assigned_to,
    assigned_to_email: lead.assigned_to_email,
    profile_metadata: customer.profile_metadata ?? null
  };
}
