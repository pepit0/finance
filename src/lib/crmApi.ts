import type { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import type {
  CrmActivity,
  CrmActivityKind,
  CrmCustomer,
  CrmCustomerLenderOutcomeRow,
  CrmCustomerStatus,
  CrmDirectoryAdminRow,
  CrmLenderOutcome,
  CrmLenderSlug,
  CrmUserDirectoryRow
} from "../types/crm";
import { normalizePhoneForStorage } from "../utils/phoneFormat";

function friendlyError(error: PostgrestError): string {
  const message = error.message ?? "";
  if (/relation|does not exist|schema cache/i.test(message)) {
    return "CRM tables are missing. In Supabase → SQL Editor, run the full script from sql/crm_security.sql, then refresh this page.";
  }
  if (
    /secondary_phone|date_of_birth|column|status|lost_at|last_call_at|author_email|assigned_to|crm_user_directory|crm_directory_admins|display_name|created_by_email|crm_activities_kind_check|violates check constraint|crm_customer_lender_outcomes|reason/i.test(
      message
    )
  ) {
    return "CRM schema is out of date. In Supabase → SQL Editor, run sql/crm_customers_extend.sql, sql/crm_customers_status_and_activity_author.sql, sql/crm_customers_assign_directory_author_trigger.sql, sql/crm_user_directory_display_name_admin.sql, sql/crm_directory_delegated_admins.sql, sql/crm_activities_admin_delete_comments.sql, sql/crm_activities_kind_text.sql, sql/crm_customers_creator_assign_and_email.sql, sql/crm_customer_lender_outcomes.sql (adds lender outcomes and the reason column), then refresh this page.";
  }
  if (error.code === "42501" || /permission denied|row-level security|RLS/i.test(message)) {
    return "The database denied this action. Make sure your user is allowed to use CRM (allowlist or CRM role) and try signing out and back in.";
  }
  return message || "Something went wrong.";
}

const CUSTOMER_SELECT =
  "id, created_at, created_by, created_by_email, display_name, email, phone, secondary_phone, date_of_birth, status, lost_at, last_call_at, assigned_to, assigned_to_email";

function normalizeCustomer(row: CrmCustomer): CrmCustomer {
  const status = row.status === "lost" ? "lost" : "active";
  return {
    ...row,
    secondary_phone: row.secondary_phone ?? null,
    date_of_birth: row.date_of_birth ?? null,
    status,
    lost_at: row.lost_at ?? null,
    last_call_at: row.last_call_at ?? null,
    assigned_to: row.assigned_to ?? null,
    assigned_to_email: row.assigned_to_email ?? null,
    created_by_email: row.created_by_email ?? null
  };
}

export async function fetchCustomers(options: {
  status: CrmCustomerStatus;
}): Promise<{ data: CrmCustomer[]; error: string | null }> {
  const { data, error } = await supabase
    .from("crm_customers")
    .select(CUSTOMER_SELECT)
    .eq("status", options.status)
    .order("created_at", { ascending: false });

  if (error) {
    return { data: [], error: friendlyError(error) };
  }
  return { data: (data ?? []).map((r) => normalizeCustomer(r as CrmCustomer)), error: null };
}

export async function fetchActivities(customerId: string): Promise<{ data: CrmActivity[]; error: string | null }> {
  const { data, error } = await supabase
    .from("crm_activities")
    .select("id, created_at, customer_id, author_id, author_email, kind, body")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (error) {
    return { data: [], error: friendlyError(error) };
  }
  return {
    data: (data ?? []).map((r) => ({
      ...(r as CrmActivity),
      author_email: (r as CrmActivity).author_email ?? null
    })),
    error: null
  };
}

export type InsertCustomerInput = {
  display_name: string;
  phone: string;
  email: string;
  secondary_phone: string;
  date_of_birth: string;
};

export async function insertCustomer(input: InsertCustomerInput): Promise<{ id: string | null; error: string | null }> {
  const display_name = input.display_name.trim();
  if (!display_name) {
    return { id: null, error: "Customer name is required." };
  }
  const phoneNorm = normalizePhoneForStorage(input.phone);
  if (phoneNorm.error) {
    return { id: null, error: phoneNorm.error };
  }
  if (!phoneNorm.value) {
    return { id: null, error: "Phone number is required." };
  }

  const email = input.email.trim() || null;
  const secNorm = normalizePhoneForStorage(input.secondary_phone);
  if (secNorm.error) {
    return { id: null, error: secNorm.error };
  }
  const secondary_phone = secNorm.value;
  const dob = input.date_of_birth.trim();
  const date_of_birth = dob.length > 0 ? dob : null;

  const { data, error } = await supabase
    .from("crm_customers")
    .insert({
      display_name,
      phone: phoneNorm.value,
      email,
      secondary_phone,
      date_of_birth,
      status: "active"
    })
    .select("id")
    .single();

  if (error) {
    return { id: null, error: friendlyError(error) };
  }
  return { id: data?.id ?? null, error: null };
}

export type UpdateCustomerInput = {
  display_name: string;
  phone: string;
  email: string;
  secondary_phone: string;
  date_of_birth: string;
};

export async function updateCustomer(id: string, patch: UpdateCustomerInput): Promise<{ error: string | null }> {
  const display_name = patch.display_name.trim();
  if (!display_name) {
    return { error: "Customer name is required." };
  }
  const phoneNorm = normalizePhoneForStorage(patch.phone);
  if (phoneNorm.error) {
    return { error: phoneNorm.error };
  }
  if (!phoneNorm.value) {
    return { error: "Phone number is required." };
  }

  const email = patch.email.trim() || null;
  const secNorm = normalizePhoneForStorage(patch.secondary_phone);
  if (secNorm.error) {
    return { error: secNorm.error };
  }
  const secondary_phone = secNorm.value;
  const dob = patch.date_of_birth.trim();
  const date_of_birth = dob.length > 0 ? dob : null;

  const { error } = await supabase
    .from("crm_customers")
    .update({
      display_name,
      phone: phoneNorm.value,
      email,
      secondary_phone,
      date_of_birth
    })
    .eq("id", id);

  if (error) {
    return { error: friendlyError(error) };
  }
  return { error: null };
}

export async function updateCustomerAssignment(
  id: string,
  patch: { assigned_to: string | null; assigned_to_email: string | null }
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("crm_customers")
    .update({
      assigned_to: patch.assigned_to,
      assigned_to_email: patch.assigned_to_email
    })
    .eq("id", id);

  if (error) {
    return { error: friendlyError(error) };
  }
  return { error: null };
}

export async function fetchCrmUserDirectory(): Promise<{ data: CrmUserDirectoryRow[]; error: string | null }> {
  const { data, error } = await supabase
    .from("crm_user_directory")
    .select("user_id, email, updated_at, display_name")
    .order("email", { ascending: true });

  if (error) {
    return { data: [], error: friendlyError(error) };
  }
  return {
    data: (data ?? []).map((r) => ({
      ...(r as CrmUserDirectoryRow),
      display_name: (r as CrmUserDirectoryRow).display_name ?? null
    })),
    error: null
  };
}

export async function fetchCrmDirectoryAdmins(): Promise<{ data: CrmDirectoryAdminRow[]; error: string | null }> {
  const { data, error } = await supabase
    .from("crm_directory_admins")
    .select("email, created_at")
    .order("email", { ascending: true });

  if (error) {
    return { data: [], error: friendlyError(error) };
  }
  return { data: (data ?? []) as CrmDirectoryAdminRow[], error: null };
}

export async function insertDirectoryAdmin(email: string): Promise<{ error: string | null }> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) {
    return { error: "Email is required." };
  }
  const { error } = await supabase.from("crm_directory_admins").insert({ email: normalized });
  if (error) {
    return { error: friendlyError(error) };
  }
  return { error: null };
}

export async function deleteDirectoryAdmin(email: string): Promise<{ error: string | null }> {
  const normalized = email.trim().toLowerCase();
  const { error } = await supabase.from("crm_directory_admins").delete().eq("email", normalized);
  if (error) {
    return { error: friendlyError(error) };
  }
  return { error: null };
}

export async function updateDirectoryDisplayName(
  userId: string,
  displayName: string | null
): Promise<{ error: string | null }> {
  const trimmed = displayName?.trim() ?? "";
  const value = trimmed.length > 0 ? trimmed : null;
  const { error } = await supabase
    .from("crm_user_directory")
    .update({
      display_name: value,
      updated_at: new Date().toISOString()
    })
    .eq("user_id", userId);

  if (error) {
    return { error: friendlyError(error) };
  }
  return { error: null };
}

/** Registers the signed-in user in the team directory (for assignee picklists). */
export async function upsertMyCrmDirectoryRow(): Promise<{ error: string | null }> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user?.id || !user.email?.trim()) {
    return { error: null };
  }
  const { error } = await supabase.from("crm_user_directory").upsert(
    {
      user_id: user.id,
      email: user.email.trim(),
      updated_at: new Date().toISOString()
    },
    { onConflict: "user_id" }
  );
  if (error) {
    return { error: friendlyError(error) };
  }
  return { error: null };
}

export async function markCustomerLost(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("crm_customers")
    .update({
      status: "lost",
      lost_at: new Date().toISOString()
    })
    .eq("id", id);

  if (error) {
    return { error: friendlyError(error) };
  }
  return { error: null };
}

export async function restoreCustomer(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("crm_customers")
    .update({
      status: "active",
      lost_at: null
    })
    .eq("id", id);

  if (error) {
    return { error: friendlyError(error) };
  }
  return { error: null };
}

export async function insertActivity(input: {
  customer_id: string;
  kind: CrmActivityKind;
  body: string;
}): Promise<{ error: string | null }> {
  const body = input.body.trim();
  if (!body) {
    return { error: "Please enter notes for this call or comment." };
  }

  const { data: userData } = await supabase.auth.getUser();
  const author_email = userData.user?.email ?? null;

  const { error } = await supabase.from("crm_activities").insert({
    customer_id: input.customer_id,
    kind: input.kind,
    body,
    author_email
  });

  if (error) {
    return { error: friendlyError(error) };
  }
  return { error: null };
}

export async function deleteCrmActivity(activityId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from("crm_activities").delete().eq("id", activityId);
  if (error) {
    return { error: friendlyError(error) };
  }
  return { error: null };
}

export async function fetchCrmCounts(): Promise<{
  customerCount: number;
  activityCount: number;
  error: string | null;
}> {
  const customers = await supabase
    .from("crm_customers")
    .select("id", { count: "exact", head: true })
    .eq("status", "active");
  if (customers.error) {
    return { customerCount: 0, activityCount: 0, error: friendlyError(customers.error) };
  }
  const activities = await supabase.from("crm_activities").select("id", { count: "exact", head: true });
  if (activities.error) {
    return {
      customerCount: customers.count ?? 0,
      activityCount: 0,
      error: friendlyError(activities.error)
    };
  }
  return {
    customerCount: customers.count ?? 0,
    activityCount: activities.count ?? 0,
    error: null
  };
}

export async function fetchCustomerLenderOutcomes(
  customerId: string
): Promise<{ data: CrmCustomerLenderOutcomeRow[]; error: string | null }> {
  const { data, error } = await supabase
    .from("crm_customer_lender_outcomes")
    .select("customer_id, lender_slug, outcome, reason, updated_at")
    .eq("customer_id", customerId);

  if (error) {
    return { data: [], error: friendlyError(error) };
  }
  const rows = (data ?? []) as CrmCustomerLenderOutcomeRow[];
  return {
    data: rows.map((r) => ({
      ...r,
      reason: r.reason ?? null
    })),
    error: null
  };
}

export async function upsertCustomerLenderOutcome(
  customerId: string,
  lenderSlug: CrmLenderSlug,
  outcome: CrmLenderOutcome,
  reason: string | null
): Promise<{ error: string | null }> {
  const trimmed = reason?.trim() ?? "";
  const { error } = await supabase.from("crm_customer_lender_outcomes").upsert(
    {
      customer_id: customerId,
      lender_slug: lenderSlug,
      outcome,
      reason: trimmed.length > 0 ? trimmed : null,
      updated_at: new Date().toISOString()
    },
    { onConflict: "customer_id,lender_slug" }
  );
  if (error) {
    return { error: friendlyError(error) };
  }
  return { error: null };
}

export async function deleteCustomerLenderOutcome(
  customerId: string,
  lenderSlug: CrmLenderSlug
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("crm_customer_lender_outcomes")
    .delete()
    .eq("customer_id", customerId)
    .eq("lender_slug", lenderSlug);
  if (error) {
    return { error: friendlyError(error) };
  }
  return { error: null };
}

/** Hard delete (not exposed in CRM UI). */
export async function deleteCustomer(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from("crm_customers").delete().eq("id", id);
  if (error) {
    return { error: friendlyError(error) };
  }
  return { error: null };
}
