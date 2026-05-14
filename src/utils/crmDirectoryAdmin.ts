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

export function profileCreatorLabel(
  customer: { created_by: string; created_by_email: string | null },
  directory: CrmUserDirectoryRow[]
): string {
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
