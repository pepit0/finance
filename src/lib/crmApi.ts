import type { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import type {
  CrmActivity,
  CrmActivityKind,
  CrmCreditApplicationInfo,
  CrmCustomer,
  CrmCustomerLenderOutcomeRow,
  CrmCustomerStatus,
  CrmDirectoryAdminRow,
  CrmLenderOutcome,
  CrmLenderSlug,
  CrmNotification,
  CrmPublicPreapprovalLead,
  CrmSystemLeadListRow,
  CrmUserDirectoryRow
} from "../types/crm";
import { formatCanadianProvince } from "../utils/canadianProvince";
import { normalizeCreditScoreBandCode } from "../utils/creditScoreBand";
import { normalizeEmploymentTypeCode } from "../utils/employmentType";
import { normalizeHomeStatusCode } from "../utils/homeStatus";
import { directoryUsername, isCrmDirectoryMaster } from "../utils/crmDirectoryAdmin";
import { normalizeCreditAppAttachment } from "../utils/crmCreditAppAttachment";
import { normalizeCreditAppNameParts } from "../utils/creditAppName";
import { normalizePhoneForStorage } from "../utils/phoneFormat";

function friendlyError(error: PostgrestError): string {
  const message = error.message ?? "";
  if (/relation|does not exist|schema cache/i.test(message)) {
    return "CRM tables are missing. In Supabase → SQL Editor, run the full script from sql/crm_security.sql, then refresh this page.";
  }
  if (
    /secondary_phone|date_of_birth|column|status|lost_at|last_call_at|author_email|assigned_to|crm_user_directory|crm_directory_admins|display_name|created_by_email|crm_activities_kind_check|violates check constraint|crm_customer_lender_outcomes|crm_public_preapproval_leads|crm_system_leads|crm_notifications|ingest_marketing_preapproval|assign_crm_system_lead|profile_metadata|submit_public_preapproval|reason/i.test(
      message
    )
  ) {
    return "CRM schema is out of date. In Supabase → SQL Editor, run sql/crm_customers_extend.sql, sql/crm_customers_status_and_activity_author.sql, sql/crm_customers_assign_directory_author_trigger.sql, sql/crm_user_directory_display_name_admin.sql, sql/crm_directory_delegated_admins.sql, sql/crm_activities_admin_delete_comments.sql, sql/crm_activities_kind_text.sql, sql/crm_customers_creator_assign_and_email.sql, sql/crm_customer_lender_outcomes.sql, sql/crm_public_preapproval_leads.sql, sql/crm_public_preapproval_leads_admin_delete.sql, sql/crm_marketing_ingest_bridge.sql, sql/crm_customers_admin_delete.sql, sql/crm_customers_delete_rpc.sql, sql/crm_customers_system_website_creator.sql, then refresh this page.";
  }
  if (error.code === "42501" || /permission denied|row-level security|RLS/i.test(message)) {
    return "The database denied this action. Make sure your user is allowed to use CRM (allowlist or CRM role) and try signing out and back in.";
  }
  return message || "Something went wrong.";
}

const CUSTOMER_SELECT =
  "id, created_at, created_by, created_by_email, display_name, email, phone, secondary_phone, date_of_birth, status, lost_at, last_call_at, assigned_to, assigned_to_email, profile_metadata";

const CREDIT_APPLICATION_INFO_KEY = "credit_application_info";

const EMPTY_CREDIT_APPLICATION_INFO: CrmCreditApplicationInfo = {
  first_name: "",
  middle_name: "",
  last_name: "",
  phone: "",
  secondary_phone: "",
  email: "",
  sin: "",
  date_of_birth: "",
  street: "",
  line2: "",
  city: "",
  province: "",
  postal_code: "",
  address_tenure: "",
  previous_street: "",
  previous_city: "",
  previous_province: "",
  previous_postal_code: "",
  previous_address_tenure: "",
  home_status: "",
  home_monthly_payment_cad: "",
  mortgage_amount_cad: "",
  mortgage_holder: "",
  home_market_value_cad: "",
  employer: "",
  job_title: "",
  work_street: "",
  work_city: "",
  work_province: "",
  job_tenure: "",
  previous_employer: "",
  previous_job_title: "",
  previous_work_street: "",
  previous_work_city: "",
  previous_work_province: "",
  previous_job_tenure: "",
  employment_status: "",
  employment_other_description: "",
  employment_type: "",
  gross_monthly_income_cad: "",
  other_monthly_income_cad: "",
  other_income_description: "",
  monthly_budget_cad: "",
  down_payment_cad: "",
  credit_score_band: "",
  vehicle_interest: "",
  has_trade: false,
  trade_year: "",
  trade_make: "",
  trade_model: "",
  trade_kms: "",
  trade_vin: "",
  trade_has_registration: false,
  has_co_signer: false,
  co_signer_details: "",
  check_drivers_license: false,
  check_paystubs: false,
  drivers_license_file: null,
  paystubs_file: null,
  trade_registration_file: null,
  consent_contact: false,
  consent_credit: false,
  notes: ""
};

function safeRecord(value: unknown): Record<string, unknown> | null {
  return value != null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asBoolean(value: unknown): boolean {
  return value === true;
}

function asOptionalNumberString(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  return "";
}

function toPlainEnglish(value: unknown): string {
  const raw = asString(value);
  if (!raw) {
    return "";
  }
  const tokens = raw.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim().split(" ");
  return tokens
    .map((token) => {
      const lower = token.toLowerCase();
      if (lower === "cad" || lower === "sin" || lower === "id") {
        return lower.toUpperCase();
      }
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

/** Keep stored credit-app contact fields aligned when CRM basic info changes. */
function creditAppInfoSyncedFromCustomerBasic(
  basic: {
    display_name: string;
    phone: string;
    secondary_phone: string | null;
    email: string | null;
    date_of_birth: string | null;
  },
  existingRaw: Record<string, unknown> | null | undefined
): CrmCreditApplicationInfo {
  const customerPick = {
    display_name: basic.display_name,
    phone: basic.phone,
    secondary_phone: basic.secondary_phone,
    email: basic.email,
    date_of_birth: basic.date_of_birth
  };
  const base = normalizeCreditApplicationInfo(customerPick, existingRaw ?? null);
  const nameParts = normalizeCreditAppNameParts({}, basic.display_name);
  return {
    ...base,
    ...nameParts,
    phone: basic.phone,
    secondary_phone: basic.secondary_phone ?? "",
    email: basic.email ?? "",
    date_of_birth: basic.date_of_birth ?? ""
  };
}

function normalizeCreditApplicationInfo(
  customer: Pick<CrmCustomer, "display_name" | "phone" | "secondary_phone" | "email" | "date_of_birth">,
  raw?: Record<string, unknown> | null
): CrmCreditApplicationInfo {
  const data = raw ?? null;
  const nameParts = normalizeCreditAppNameParts(
    {
      first_name: asString(data?.first_name),
      middle_name: asString(data?.middle_name),
      last_name: asString(data?.last_name),
      display_name: asString(data?.display_name)
    },
    customer.display_name || ""
  );
  return {
    ...EMPTY_CREDIT_APPLICATION_INFO,
    ...nameParts,
    phone: asString(data?.phone) || customer.phone || "",
    secondary_phone: asString(data?.secondary_phone) || customer.secondary_phone || "",
    email: asString(data?.email) || customer.email || "",
    sin: asString(data?.sin),
    date_of_birth: asString(data?.date_of_birth) || customer.date_of_birth || "",
    street: asString(data?.street),
    line2: asString(data?.line2),
    city: asString(data?.city),
    province: formatCanadianProvince(asString(data?.province)),
    postal_code: asString(data?.postal_code),
    address_tenure: asString(data?.address_tenure),
    previous_street: asString(data?.previous_street),
    previous_city: asString(data?.previous_city),
    previous_province: formatCanadianProvince(asString(data?.previous_province)),
    previous_postal_code: asString(data?.previous_postal_code),
    previous_address_tenure: asString(data?.previous_address_tenure),
    home_status: normalizeHomeStatusCode(asString(data?.home_status)),
    home_monthly_payment_cad: asOptionalNumberString(data?.home_monthly_payment_cad),
    mortgage_amount_cad: asOptionalNumberString(data?.mortgage_amount_cad),
    mortgage_holder: asString(data?.mortgage_holder),
    home_market_value_cad: asOptionalNumberString(data?.home_market_value_cad),
    employer: asString(data?.employer),
    job_title: asString(data?.job_title),
    work_street: asString(data?.work_street),
    work_city: asString(data?.work_city),
    work_province: formatCanadianProvince(asString(data?.work_province)),
    job_tenure: asString(data?.job_tenure),
    previous_employer: asString(data?.previous_employer),
    previous_job_title: asString(data?.previous_job_title),
    previous_work_street: asString(data?.previous_work_street),
    previous_work_city: asString(data?.previous_work_city),
    previous_work_province: formatCanadianProvince(asString(data?.previous_work_province)),
    previous_job_tenure: asString(data?.previous_job_tenure),
    employment_status: asString(data?.employment_status),
    employment_other_description: asString(data?.employment_other_description),
    employment_type: normalizeEmploymentTypeCode(asString(data?.employment_type)),
    gross_monthly_income_cad: asOptionalNumberString(data?.gross_monthly_income_cad),
    other_monthly_income_cad: asOptionalNumberString(data?.other_monthly_income_cad),
    other_income_description: asString(data?.other_income_description),
    monthly_budget_cad: asOptionalNumberString(data?.monthly_budget_cad),
    down_payment_cad: asOptionalNumberString(data?.down_payment_cad),
    credit_score_band: normalizeCreditScoreBandCode(asString(data?.credit_score_band)),
    vehicle_interest: asString(data?.vehicle_interest),
    has_trade: asBoolean(data?.has_trade),
    trade_year: asString(data?.trade_year),
    trade_make: asString(data?.trade_make),
    trade_model: asString(data?.trade_model),
    trade_kms: asString(data?.trade_kms),
    trade_vin: asString(data?.trade_vin),
    trade_has_registration: asBoolean(data?.trade_has_registration),
    has_co_signer:
      asBoolean(data?.has_co_signer) ||
      Boolean(asString(data?.co_signer_details) || asString(data?.co_signer)),
    co_signer_details: asString(data?.co_signer_details) || asString(data?.co_signer),
    check_drivers_license: asBoolean(data?.check_drivers_license),
    check_paystubs: asBoolean(data?.check_paystubs),
    drivers_license_file: normalizeCreditAppAttachment(data?.drivers_license_file),
    paystubs_file: normalizeCreditAppAttachment(data?.paystubs_file),
    trade_registration_file: normalizeCreditAppAttachment(data?.trade_registration_file),
    consent_contact: asBoolean(data?.consent_contact),
    consent_credit: asBoolean(data?.consent_credit),
    notes: asString(data?.notes)
  };
}

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
    created_by_email: row.created_by_email ?? null,
    created_by: row.created_by ?? null,
    profile_metadata: (row.profile_metadata as Record<string, unknown> | null) ?? null
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

  const basic = {
    display_name,
    phone: phoneNorm.value,
    secondary_phone,
    email,
    date_of_birth
  };
  const creditInfo = creditAppInfoSyncedFromCustomerBasic(basic, null);

  const { data, error } = await supabase
    .from("crm_customers")
    .insert({
      display_name,
      phone: phoneNorm.value,
      email,
      secondary_phone,
      date_of_birth,
      status: "active",
      profile_metadata: { [CREDIT_APPLICATION_INFO_KEY]: creditInfo }
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

  const basic = {
    display_name,
    phone: phoneNorm.value,
    secondary_phone,
    email,
    date_of_birth
  };

  const { data: existingRow, error: fetchError } = await supabase
    .from("crm_customers")
    .select("profile_metadata")
    .eq("id", id)
    .single();

  if (fetchError) {
    return { error: friendlyError(fetchError) };
  }

  const existingMetadata = safeRecord(existingRow?.profile_metadata) ?? {};
  const rawInfo = safeRecord(existingMetadata[CREDIT_APPLICATION_INFO_KEY]);
  const syncedInfo = creditAppInfoSyncedFromCustomerBasic(basic, rawInfo);
  const nextMetadata: Record<string, unknown> = {
    ...existingMetadata,
    [CREDIT_APPLICATION_INFO_KEY]: syncedInfo
  };

  const { error } = await supabase
    .from("crm_customers")
    .update({
      display_name,
      phone: phoneNorm.value,
      email,
      secondary_phone,
      date_of_birth,
      profile_metadata: nextMetadata
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

export function getCustomerCreditApplicationInfo(customer: CrmCustomer): CrmCreditApplicationInfo {
  const metadata = safeRecord(customer.profile_metadata);
  const rawInfo = safeRecord(metadata?.[CREDIT_APPLICATION_INFO_KEY]);
  return normalizeCreditApplicationInfo(customer, rawInfo);
}

export async function fetchSystemLeadCreditApplicationSeed(
  customerId: string
): Promise<{ data: Partial<CrmCreditApplicationInfo> | null; error: string | null }> {
  const { data, error } = await supabase
    .from("crm_system_leads")
    .select(
      `created_at, preapproval:crm_public_preapproval_leads (
        display_name,
        email,
        phone,
        date_of_birth,
        street,
        line2,
        city,
        province,
        employer,
        gross_monthly_income_cad,
        vehicle_interest,
        consent_contact,
        consent_credit,
        job_title,
        other_monthly_income_cad,
        other_income_description,
        monthly_budget_cad,
        down_payment_cad,
        has_co_signer,
        co_signer_details,
        has_trade,
        trade_year,
        trade_make,
        trade_model,
        trade_kms,
        employment_status,
        employment_other_description,
        employment_type,
        credit_score_band,
        address_tenure
      )`
    )
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return { data: null, error: friendlyError(error) };
  }

  const lead = safeRecord(data);
  const preapproval = safeRecord(lead?.preapproval);
  if (!preapproval) {
    return { data: null, error: null };
  }

  return {
    data: {
      ...normalizeCreditAppNameParts({ display_name: asString(preapproval.display_name) }),
      phone: asString(preapproval.phone),
      email: asString(preapproval.email),
      date_of_birth: asString(preapproval.date_of_birth),
      street: asString(preapproval.street),
      line2: asString(preapproval.line2),
      city: asString(preapproval.city),
      province: formatCanadianProvince(asString(preapproval.province)),
      address_tenure: asString(preapproval.address_tenure),
      employer: asString(preapproval.employer),
      job_title: toPlainEnglish(preapproval.job_title),
      job_tenure: asString(preapproval.job_tenure),
      previous_employer: asString(preapproval.previous_employer),
      previous_job_title: asString(preapproval.previous_job_title),
      previous_job_tenure: asString(preapproval.previous_job_tenure),
      employment_status: toPlainEnglish(preapproval.employment_status),
      employment_other_description: toPlainEnglish(preapproval.employment_other_description),
      employment_type: normalizeEmploymentTypeCode(asString(preapproval.employment_type)),
      gross_monthly_income_cad: asOptionalNumberString(preapproval.gross_monthly_income_cad),
      other_monthly_income_cad: asOptionalNumberString(preapproval.other_monthly_income_cad),
      other_income_description: asString(preapproval.other_income_description),
      monthly_budget_cad: asOptionalNumberString(preapproval.monthly_budget_cad),
      down_payment_cad: asOptionalNumberString(preapproval.down_payment_cad),
      has_co_signer:
        asBoolean(preapproval.has_co_signer) ||
        Boolean(asString(preapproval.co_signer_details) || asString(preapproval.co_signer)),
      co_signer_details:
        asString(preapproval.co_signer_details) || toPlainEnglish(preapproval.co_signer),
      credit_score_band: normalizeCreditScoreBandCode(asString(preapproval.credit_score_band)),
      vehicle_interest: toPlainEnglish(preapproval.vehicle_interest),
      has_trade: asBoolean(preapproval.has_trade),
      trade_year: toPlainEnglish(preapproval.trade_year),
      trade_make: toPlainEnglish(preapproval.trade_make),
      trade_model: toPlainEnglish(preapproval.trade_model),
      trade_kms: asString(preapproval.trade_kms),
      consent_contact: asBoolean(preapproval.consent_contact),
      consent_credit: asBoolean(preapproval.consent_credit)
    },
    error: null
  };
}

export async function saveCustomerCreditApplicationInfo(
  customer: CrmCustomer,
  info: CrmCreditApplicationInfo
): Promise<{ error: string | null }> {
  const existingMetadata = safeRecord(customer.profile_metadata) ?? {};
  const nextInfo = normalizeCreditApplicationInfo(customer, info as unknown as Record<string, unknown>);
  const nextMetadata: Record<string, unknown> = {
    ...existingMetadata,
    [CREDIT_APPLICATION_INFO_KEY]: nextInfo
  };

  const { error } = await supabase
    .from("crm_customers")
    .update({ profile_metadata: nextMetadata })
    .eq("id", customer.id);

  if (error) {
    return { error: friendlyError(error) };
  }
  return { error: null };
}

async function resolveCurrentAuthorUsername(): Promise<string | null> {
  await upsertMyCrmDirectoryRow();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) {
    return null;
  }
  const { data: row } = await supabase
    .from("crm_user_directory")
    .select("display_name")
    .eq("user_id", userId)
    .maybeSingle();
  if (!row) {
    return null;
  }
  return directoryUsername(row as Pick<CrmUserDirectoryRow, "display_name">);
}

export async function logCreditApplicationInfoUpdated(customerId: string): Promise<{ error: string | null }> {
  const { data: userData } = await supabase.auth.getUser();
  const authorEmail = userData.user?.email?.trim() ?? "";
  const username = await resolveCurrentAuthorUsername();
  const body = username
    ? `Credit application info updated — by ${username}`
    : "Credit application info updated";

  const { error } = await supabase.from("crm_activities").insert({
    customer_id: customerId,
    kind: "comment",
    body,
    author_email: authorEmail || null
  });

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

const WEB_LEAD_SELECT =
  "id, created_at, display_name, email, phone, date_of_birth, street, line2, city, province, employer, gross_monthly_income_cad, vehicle_interest, consent_contact, consent_credit";

export async function fetchPublicPreapprovalLeads(): Promise<{
  data: CrmPublicPreapprovalLead[];
  error: string | null;
}> {
  const { data, error } = await supabase
    .from("crm_public_preapproval_leads")
    .select(WEB_LEAD_SELECT)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    return { data: [], error: friendlyError(error) };
  }
  return {
    data: (data ?? []).map((r) => {
      const row = r as CrmPublicPreapprovalLead;
      return {
        ...row,
        line2: row.line2 ?? null,
        vehicle_interest: row.vehicle_interest ?? null,
        gross_monthly_income_cad: Number(row.gross_monthly_income_cad)
      };
    }),
    error: null
  };
}

async function deletePublicPreapprovalLeadViaTable(id: string): Promise<{ error: string | null }> {
  const { data: deletedRows, error } = await supabase
    .from("crm_public_preapproval_leads")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) {
    return { error: friendlyError(error) };
  }
  if (!deletedRows?.length) {
    return {
      error: `Could not remove this web lead. ${WEB_LEAD_ADMIN_SQL_HINT}`
    };
  }
  return { error: null };
}

export async function deletePublicPreapprovalLead(id: string): Promise<{ error: string | null }> {
  const { data, error } = await supabase.rpc("delete_crm_public_preapproval_lead", {
    p_lead_id: id
  });

  const result = parseCrmJsonRpcResult(data);
  if (!error && result) {
    if (result.ok) {
      return { error: null };
    }
    if (result.error?.trim()) {
      const msg = result.error.trim();
      if (/directory admin/i.test(msg)) {
        return { error: `${msg} ${WEB_LEAD_ADMIN_SQL_HINT}` };
      }
      return { error: msg };
    }
  }

  if (error && !/delete_crm_public_preapproval_lead|schema cache/i.test(error.message ?? "")) {
    return { error: friendlyError(error) };
  }

  return deletePublicPreapprovalLeadViaTable(id);
}

export async function clearAllPublicPreapprovalLeads(): Promise<{
  deleted: number;
  error: string | null;
}> {
  const { data, error } = await supabase.rpc("clear_crm_public_preapproval_leads_admin");

  const result = parseCrmJsonRpcResult(data);
  if (!error && result?.ok) {
    return { deleted: Number(result.deleted ?? 0), error: null };
  }
  if (!error && result && !result.ok && result.error?.trim()) {
    return { deleted: 0, error: result.error.trim() };
  }

  if (error && !/clear_crm_public_preapproval_leads_admin|schema cache/i.test(error.message ?? "")) {
    return { deleted: 0, error: friendlyError(error) };
  }

  const { data: deletedRows, error: tableError } = await supabase
    .from("crm_public_preapproval_leads")
    .delete()
    .select("id");

  if (tableError) {
    return { deleted: 0, error: friendlyError(tableError) };
  }
  return { deleted: deletedRows?.length ?? 0, error: null };
}

type CrmJsonRpcResult = { ok: boolean; error?: string; deleted?: number };

function parseCrmJsonRpcResult(data: unknown): CrmJsonRpcResult | null {
  if (data != null && typeof data === "object" && "ok" in data) {
    return data as CrmJsonRpcResult;
  }
  return null;
}

const WEB_LEAD_ADMIN_SQL_HINT =
  "Run sql/crm_public_preapproval_leads_admin_delete.sql in Supabase, then sign out and back in.";

type DeleteCrmCustomerResult = { ok: boolean; error?: string };

export type CrmDirectoryAdminStatus = {
  /** Show directory-admin UI (delete, activity moderation, etc.). */
  isAdmin: boolean;
  /** Matches public.crm_user_directory_admin() in Supabase (required for delete RPC). */
  dbAdmin: boolean;
  clientMaster: boolean;
  delegatedRow: boolean;
  error: string | null;
};

export async function resolveCrmDirectoryAdminStatus(): Promise<CrmDirectoryAdminStatus> {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user ?? null;
  const email = user?.email?.trim().toLowerCase() ?? "";

  let dbAdmin = false;
  let rpcError: string | null = null;
  const { data: rpcData, error: rpcErr } = await supabase.rpc("crm_user_directory_admin");
  if (rpcErr) {
    rpcError = friendlyError(rpcErr);
  } else {
    dbAdmin = rpcData === true;
  }

  const clientMaster = isCrmDirectoryMaster(user);

  let delegatedRow = false;
  if (email) {
    const { data: rows } = await supabase.from("crm_directory_admins").select("email");
    delegatedRow = (rows ?? []).some((row) => (row.email ?? "").trim().toLowerCase() === email);
  }

  const isAdmin = dbAdmin || clientMaster || delegatedRow;

  return { isAdmin, dbAdmin, clientMaster, delegatedRow, error: rpcError };
}

/** @deprecated Prefer resolveCrmDirectoryAdminStatus */
export async function fetchCrmUserIsDirectoryAdmin(): Promise<{
  isAdmin: boolean;
  error: string | null;
}> {
  const status = await resolveCrmDirectoryAdminStatus();
  return { isAdmin: status.isAdmin, error: status.error };
}

const DIRECTORY_ADMIN_SQL_HINT =
  "Run sql/crm_directory_set_master_email.sql in Supabase with your CRM sign-in email (same as VITE_CRM_DIRECTORY_MASTER_EMAIL), then sql/crm_customers_delete_rpc.sql, sign out, and sign back in.";

export function directoryAdminSetupMessage(status: CrmDirectoryAdminStatus): string | null {
  if (!status.isAdmin) {
    return null;
  }
  if (status.dbAdmin) {
    return null;
  }
  if (status.clientMaster) {
    return `Directory admin is enabled in .env but Supabase does not recognize your account yet. ${DIRECTORY_ADMIN_SQL_HINT}`;
  }
  if (status.delegatedRow) {
    return `You appear in directory admins, but Supabase still reports non-admin. Confirm the email on your account matches the row in crm_directory_admins, then sign out and back in.`;
  }
  return null;
}

export async function deleteCustomer(id: string): Promise<{ error: string | null }> {
  const { data, error } = await supabase.rpc("delete_crm_customer", {
    p_customer_id: id
  });

  if (!error && data != null && typeof data === "object" && "ok" in data) {
    const result = data as DeleteCrmCustomerResult;
    if (result.ok) {
      return { error: null };
    }
    if (result.error?.trim()) {
      const msg = result.error.trim();
      if (/permission to delete/i.test(msg)) {
        return { error: `${msg} ${DIRECTORY_ADMIN_SQL_HINT}` };
      }
      return { error: msg };
    }
  }

  if (error && !/delete_crm_customer|schema cache/i.test(error.message ?? "")) {
    return { error: friendlyError(error) };
  }

  const { data: deletedRows, error: tableError } = await supabase
    .from("crm_customers")
    .delete()
    .eq("id", id)
    .select("id");

  if (tableError) {
    return { error: friendlyError(tableError) };
  }
  if (!deletedRows?.length) {
    return {
      error:
        "Delete was not allowed or the customer was already removed. Run sql/crm_customers_admin_delete.sql and sql/crm_customers_delete_rpc.sql in Supabase, confirm you are a directory admin, then try again."
    };
  }
  return { error: null };
}

const SYSTEM_LEAD_SELECT = `
  id,
  created_at,
  marketing_lead_id,
  preapproval_lead_id,
  customer_id,
  assigned_to,
  assigned_to_email,
  assigned_at,
  customer:crm_customers (
    id,
    display_name,
    email,
    phone,
    status,
    profile_metadata
  ),
  preapproval:crm_public_preapproval_leads (
    display_name,
    email,
    phone,
    vehicle_interest,
    employer,
    gross_monthly_income_cad
  )
`;

export async function fetchUnassignedSystemLeads(): Promise<{
  data: CrmSystemLeadListRow[];
  error: string | null;
}> {
  const { data, error } = await supabase
    .from("crm_system_leads")
    .select(SYSTEM_LEAD_SELECT)
    .is("assigned_to", null)
    .eq("customer.status", "active")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return { data: [], error: friendlyError(error) };
  }

  return {
    data: (data ?? []) as unknown as CrmSystemLeadListRow[],
    error: null
  };
}

export async function assignCrmSystemLead(
  systemLeadId: string,
  assignedTo: string | null,
  assignedToEmail: string | null
): Promise<{ error: string | null }> {
  const { data, error } = await supabase.rpc("assign_crm_system_lead", {
    p_system_lead_id: systemLeadId,
    p_assigned_to: assignedTo,
    p_assigned_to_email: assignedToEmail
  });

  if (error) {
    return { error: friendlyError(error) };
  }

  const row = data as { ok?: boolean; error?: string } | null;
  if (!row?.ok) {
    return { error: row?.error ?? "Could not assign system lead." };
  }
  return { error: null };
}

export async function fetchUnreadNotificationCount(): Promise<{ count: number; error: string | null }> {
  const { count, error } = await supabase
    .from("crm_notifications")
    .select("id", { count: "exact", head: true })
    .is("read_at", null);

  if (error) {
    return { count: 0, error: friendlyError(error) };
  }
  return { count: count ?? 0, error: null };
}

export async function fetchRecentNotifications(limit = 20): Promise<{
  data: CrmNotification[];
  error: string | null;
}> {
  const { data, error } = await supabase
    .from("crm_notifications")
    .select("id, created_at, user_id, type, title, body, system_lead_id, customer_id, read_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return { data: [], error: friendlyError(error) };
  }
  return {
    data: (data ?? []).map((r) => ({
      ...(r as CrmNotification),
      system_lead_id: (r as CrmNotification).system_lead_id ?? null,
      customer_id: (r as CrmNotification).customer_id ?? null,
      read_at: (r as CrmNotification).read_at ?? null
    })),
    error: null
  };
}

export async function markNotificationRead(notificationId: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("crm_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId);

  if (error) {
    return { error: friendlyError(error) };
  }
  return { error: null };
}

export async function markAllNotificationsRead(): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("crm_notifications")
    .update({ read_at: new Date().toISOString() })
    .is("read_at", null);

  if (error) {
    return { error: friendlyError(error) };
  }
  return { error: null };
}

export async function deleteNotification(notificationId: string): Promise<{ error: string | null }> {
  const { data: deletedRows, error } = await supabase
    .from("crm_notifications")
    .delete()
    .eq("id", notificationId)
    .select("id");

  if (error) {
    return { error: friendlyError(error) };
  }
  if (!deletedRows?.length) {
    return {
      error:
        "Could not dismiss this alert. Run sql/crm_notifications_delete.sql in Supabase, then try again."
    };
  }
  return { error: null };
}
