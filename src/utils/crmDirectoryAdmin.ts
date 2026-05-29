import type { CrmUserDirectoryRow } from "../types/crm";
import type { User } from "@supabase/supabase-js";

/**
 * Must match the email hardcoded in `public.crm_user_directory_master()` in Supabase (see SQL migrations).
 * Set in `.env.local` / Vercel as `VITE_CRM_DIRECTORY_MASTER_EMAIL` so your address is not committed to git.
 */
const raw = import.meta.env.VITE_CRM_DIRECTORY_MASTER_EMAIL as string | undefined;
export const CRM_DIRECTORY_MASTER_EMAIL = typeof raw === "string" ? raw.trim().toLowerCase() : "";

export function isCrmDirectoryMaster(user: User | null): boolean {
  return user?.email?.trim().toLowerCase() === CRM_DIRECTORY_MASTER_EMAIL;
}

/** UX helper: master or delegated row exists (pass `hasDelegatedAdminRow` from a `crm_directory_admins` lookup). */
export function isCrmDirectoryAdminClient(user: User | null, hasDelegatedAdminRow: boolean): boolean {
  return isCrmDirectoryMaster(user) || hasDelegatedAdminRow;
}

export function directoryPersonLabel(row: { display_name: string | null; email: string }): string {
  const n = row.display_name?.trim();
  return n || row.email;
}

/** Team username for activity attribution — display name only, no email fallback. */
export function directoryUsername(row: { display_name: string | null }): string | null {
  const n = row.display_name?.trim();
  return n || null;
}

export const WEBSITE_LEAD_CREATOR_LABEL = "System - Website app";

export function isWebsiteLeadCustomer(customer: {
  created_by: string | null;
  profile_metadata?: Record<string, unknown> | null;
}): boolean {
  const meta = customer.profile_metadata;
  return meta?.source === "marketing" || (customer.created_by == null && Boolean(meta?.marketing_lead_id));
}

export function profileCreatorLabel(
  customer: {
    created_by: string | null;
    created_by_email: string | null;
    profile_metadata?: Record<string, unknown> | null;
  },
  directory: CrmUserDirectoryRow[]
): string {
  if (isWebsiteLeadCustomer(customer)) {
    const fromEmail = customer.created_by_email?.trim();
    if (fromEmail) {
      return fromEmail;
    }
    const metaDisplay = customer.profile_metadata?.creator_display;
    if (typeof metaDisplay === "string" && metaDisplay.trim()) {
      return metaDisplay.trim();
    }
    return WEBSITE_LEAD_CREATOR_LABEL;
  }

  if (!customer.created_by) {
    return "Unknown";
  }

  const row = directory.find((d) => d.user_id === customer.created_by);
  if (row) {
    return directoryPersonLabel(row);
  }
  const e = customer.created_by_email?.trim();
  if (e) {
    return e;
  }
  return "Unknown";
}
