import type { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import type {
  CrmActivity,
  CrmActivityKind,
  CrmCreditApplicationInfo,
  CrmCallDirection,
  CrmCallLogDirectionFilter,
  CrmCallLogEntry,
  CrmPhoneCallSession,
  CrmCustomer,
  CrmCustomerEditHistoryRow,
  CrmCustomerEditSource,
  CrmCustomerEditSnapshot,
  CrmCustomerEditChange,
  CrmCustomerTask,
  CrmCustomerTaskType,
  CrmCustomerLenderOutcomeRow,
  CrmCustomerStatus,
  CrmPipelineStage,
  CrmPipelineStageConfig,
  CrmDirectoryGroup,
  CrmDirectoryPosition,
  CrmPermissionDef,
  CrmLenderOutcome,
  CrmLenderOutcomeEntry,
  CrmLenderConfig,
  CrmLenderSlug,
  CrmLenderTier,
  CrmNotification,
  CrmPublicPreapprovalLead,
  CrmSmsDirection,
  CrmSmsMessage,
  CrmSmsThread,
  CrmSmsThreadFilter,
  CrmSystemLeadListRow,
  CrmTextLogEntry,
  CrmTodoDailyLog,
  CrmTodoDefaultTemplate,
  CrmTodoItem,
  CrmTodoLogItem,
  CrmUserDirectoryRow
} from "../types/crm";
import { formatCanadianProvince } from "../utils/canadianProvince";
import { normalizeCreditScoreBandCode } from "../utils/creditScoreBand";
import { normalizeEmploymentTypeCode } from "../utils/employmentType";
import {
  employmentTypeFromStatus,
  normalizeEmploymentStatusCode
} from "../utils/employmentStatus";
import { normalizeHomeStatusCode } from "../utils/homeStatus";
import { directoryPersonLabel, directoryUsername, isCrmDirectoryMaster } from "../utils/crmDirectoryAdmin";
import {
  defaultDirectoryGroupSlug,
  nextDirectoryGroupRank,
  uniqueDirectoryGroupSlug
} from "../utils/crmDirectoryGroups";
import {
  CRM_BRANDING_BUCKET,
  CRM_BRANDING_STORAGE_PATHS,
  loadTenantDefaultBrandingFile,
  validateCrmBrandingPng
} from "../utils/crmBrandingAssets";
import { crmTenantDefaultBrandingRecord } from "../utils/crmTenantDefaults";
import {
  leadSheetAssigneeLabelForCustomer,
  leadSheetCustomerName,
  leadSheetSourceLabelForCustomer,
  mergeSeedIntoCreditAppInfo
} from "../utils/crmLeadSheetPrint";
import { normalizeCreditAppAttachment, normalizeCreditAppAttachments } from "../utils/crmCreditAppAttachment";
import { formatCreditAppLegalName, normalizeCreditAppNameParts, type CreditAppNameParts } from "../utils/creditAppName";
import {
  buildCreatedChanges,
  buildEditSummary,
  diffCreditAppSnapshot,
  diffProfileSnapshot,
  emptySnapshot
} from "../utils/customerEditHistory";
import { normalizeHexColor } from "../utils/crmThemeColor";
import { parseCrmPublicLoginBranding } from "../utils/crmLoginTheme";
import { normalizeLenderIconDomain } from "../utils/crmLenderIcon";
import { nextLenderSortOrder, uniqueLenderSlug } from "../utils/crmLenderDefaults";
import { nextPipelineSortOrder, uniquePipelineSlug } from "../utils/pipelineStage";
import { normalizeNanpTo10Digits, normalizePhoneForStorage } from "../utils/phoneFormat";
import { collectMissingCreditAppFieldLabels } from "../components/crm/CrmCreditAppEditForm";

function isMissingRelationError(error: PostgrestError, relation?: string): boolean {
  const message = error.message ?? "";
  if (!/relation|does not exist|schema cache/i.test(message)) {
    return false;
  }
  if (!relation) {
    return true;
  }
  return message.includes(relation);
}

function friendlyError(error: PostgrestError): string {
  const message = error.message ?? "";
  if (isMissingRelationError(error, "crm_directory_groups")) {
    return "Groups table is missing. In Supabase → SQL Editor, run sql/crm_directory_groups.sql (after sql/crm_position_permissions.sql), then refresh this page.";
  }
  if (isMissingRelationError(error, "crm_pipeline_stages")) {
    return "Pipeline stages table is missing. In Supabase → SQL Editor, run sql/crm_pipeline_stages.sql, then refresh this page.";
  }
  if (isMissingRelationError(error, "crm_lenders")) {
    return "Finance lenders table is missing. In Supabase → SQL Editor, run sql/crm_lenders.sql, then refresh this page.";
  }
  if (isMissingRelationError(error)) {
    return "CRM tables are missing. In Supabase → SQL Editor, run the full script from sql/crm_security.sql, then refresh this page.";
  }
  if (
    /crm_customer_edit_history|restore_crm_customer_edit/i.test(
      message
    )
  ) {
    return "CRM schema is out of date. In Supabase → SQL Editor, run sql/crm_customers_extend.sql, sql/crm_customers_status_and_activity_author.sql, sql/crm_customers_assign_directory_author_trigger.sql, sql/crm_user_directory_display_name_admin.sql, sql/crm_user_directory_positions.sql, sql/crm_activities_admin_delete_comments.sql, sql/crm_activities_kind_text.sql, sql/crm_customers_creator_assign_and_email.sql, sql/crm_customer_lender_outcomes.sql, sql/crm_public_preapproval_leads.sql, sql/crm_public_preapproval_leads_admin_delete.sql, sql/crm_marketing_ingest_bridge.sql, sql/crm_customers_admin_delete.sql, sql/crm_customers_delete_rpc.sql, sql/crm_customers_system_website_creator.sql, sql/crm_customer_edit_history.sql, then refresh this page.";
  }
  if (
    /secondary_phone|date_of_birth|column|status|pipeline_stage|lost_at|last_call_at|author_email|assigned_to|crm_user_directory|crm_directory_admins|display_name|created_by_email|crm_activities_kind_check|violates check constraint|crm_customer_lender_outcomes|crm_public_preapproval_leads|crm_system_leads|crm_notifications|ingest_marketing_preapproval|assign_crm_system_lead|profile_metadata|submit_public_preapproval|reason/i.test(
      message
    )
  ) {
    return "CRM schema is out of date. In Supabase → SQL Editor, run sql/crm_customers_extend.sql, sql/crm_customers_status_and_activity_author.sql, sql/crm_customers_assign_directory_author_trigger.sql, sql/crm_user_directory_display_name_admin.sql, sql/crm_user_directory_positions.sql, sql/crm_position_permissions.sql, sql/crm_directory_groups.sql, sql/crm_activities_admin_delete_comments.sql, sql/crm_activities_kind_text.sql, sql/crm_customers_creator_assign_and_email.sql, sql/crm_customer_lender_outcomes.sql, sql/crm_public_preapproval_leads.sql, sql/crm_public_preapproval_leads_admin_delete.sql, sql/crm_marketing_ingest_bridge.sql, sql/crm_customers_admin_delete.sql, sql/crm_customers_delete_rpc.sql, sql/crm_customers_system_website_creator.sql, sql/crm_customer_pipeline_stage.sql, sql/crm_customer_pipeline_stage_lost.sql, sql/crm_pipeline_stages.sql, then refresh this page.";
  }
  if (error.code === "42501" || /permission denied|row-level security|RLS/i.test(message)) {
    return "The database denied this action. Make sure your user is allowed to use CRM (allowlist or CRM role) and try signing out and back in.";
  }
  return message || "Something went wrong.";
}

const CUSTOMER_SELECT =
  "id, created_at, created_by, created_by_email, display_name, email, phone, secondary_phone, date_of_birth, status, pipeline_stage, lost_at, last_call_at, assigned_to, assigned_to_email, profile_metadata";

const PIPELINE_STAGE_SELECT =
  "slug, label, color, sort_order, is_system, is_selectable, requires_credit_app";

const LENDER_SELECT = "slug, tier, label, icon_domain, custom_icon_path, sort_order, updated_at";

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
  work_postal_code: "",
  job_tenure: "",
  previous_employer: "",
  previous_job_title: "",
  previous_work_street: "",
  previous_work_city: "",
  previous_work_province: "",
  previous_work_postal_code: "",
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
  drivers_license_file: [],
  paystubs_file: [],
  trade_registration_file: [],
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
    work_postal_code: asString(data?.work_postal_code),
    job_tenure: asString(data?.job_tenure),
    previous_employer: asString(data?.previous_employer),
    previous_job_title: asString(data?.previous_job_title),
    previous_work_street: asString(data?.previous_work_street),
    previous_work_city: asString(data?.previous_work_city),
    previous_work_province: formatCanadianProvince(asString(data?.previous_work_province)),
    previous_work_postal_code: asString(data?.previous_work_postal_code),
    previous_job_tenure: asString(data?.previous_job_tenure),
    employment_status: (() => {
      const raw = asString(data?.employment_status);
      const fromStatus = normalizeEmploymentStatusCode(raw);
      if (fromStatus) {
        return fromStatus;
      }
      const fromType = normalizeEmploymentTypeCode(asString(data?.employment_type));
      if (fromType) {
        return fromType;
      }
      return raw ? "other" : "";
    })(),
    employment_other_description: (() => {
      const existing = asString(data?.employment_other_description);
      if (existing) {
        return existing;
      }
      const raw = asString(data?.employment_status);
      if (raw && !normalizeEmploymentStatusCode(raw)) {
        return raw;
      }
      return "";
    })(),
    employment_type: (() => {
      const status = normalizeEmploymentStatusCode(asString(data?.employment_status));
      const fromStatus = employmentTypeFromStatus(status);
      if (fromStatus) {
        return fromStatus;
      }
      return normalizeEmploymentTypeCode(asString(data?.employment_type));
    })(),
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
    drivers_license_file: normalizeCreditAppAttachments(data?.drivers_license_file),
    paystubs_file: normalizeCreditAppAttachments(data?.paystubs_file),
    trade_registration_file: normalizeCreditAppAttachments(data?.trade_registration_file),
    consent_contact: asBoolean(data?.consent_contact),
    consent_credit: asBoolean(data?.consent_credit),
    notes: asString(data?.notes)
  };
}

function normalizePipelineStageRow(row: Record<string, unknown>): CrmPipelineStageConfig {
  return {
    slug: String(row.slug ?? ""),
    label: String(row.label ?? ""),
    color: String(row.color ?? "#2563eb"),
    sort_order: Number(row.sort_order ?? 0),
    is_system: Boolean(row.is_system),
    is_selectable: Boolean(row.is_selectable),
    requires_credit_app: Boolean(row.requires_credit_app)
  };
}

function normalizeCustomer(row: CrmCustomer): CrmCustomer {
  const status = row.status === "lost" ? "lost" : "active";
  const rawStage = String(row.pipeline_stage ?? "").trim() || "fresh_lead";
  const pipeline_stage: CrmPipelineStage =
    status === "lost" ? "lost" : rawStage === "lost" ? "fresh_lead" : rawStage;
  return {
    ...row,
    secondary_phone: row.secondary_phone ?? null,
    date_of_birth: row.date_of_birth ?? null,
    status,
    pipeline_stage,
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
    .select(
      "id, created_at, customer_id, author_id, author_email, kind, body, source, twilio_call_sid, call_direction, call_duration_seconds, call_from, call_to, recording_storage_path, call_session_status, call_bridge_connected, call_dial_status, twilio_message_sid, sms_direction, sms_from, sms_to, sms_status"
    )
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (error) {
    return { data: [], error: friendlyError(error) };
  }
  return {
    data: (data ?? []).map((r) => {
      const row = r as CrmActivity;
      return {
        ...row,
        author_email: row.author_email ?? null,
        source: row.source === "twilio" ? "twilio" : "manual",
        twilio_call_sid: row.twilio_call_sid ?? null,
        call_direction: row.call_direction ?? null,
        call_duration_seconds: row.call_duration_seconds ?? null,
        call_from: row.call_from ?? null,
        call_to: row.call_to ?? null,
        recording_storage_path: row.recording_storage_path ?? null,
        call_session_status: row.call_session_status ?? null,
        call_bridge_connected: row.call_bridge_connected ?? null,
        call_dial_status: row.call_dial_status ?? null,
        twilio_message_sid: row.twilio_message_sid ?? null,
        sms_direction: row.sms_direction ?? null,
        sms_from: row.sms_from ?? null,
        sms_to: row.sms_to ?? null,
        sms_status: row.sms_status ?? null
      };
    }),
    error: null
  };
}

function validateCustomerNameParts(parts: CreditAppNameParts): { display_name: string; error: string | null } {
  const first_name = parts.first_name.trim();
  const middle_name = parts.middle_name.trim();
  const last_name = parts.last_name.trim();
  if (!first_name) {
    return { display_name: "", error: "First name is required." };
  }
  if (!last_name) {
    return { display_name: "", error: "Last name is required." };
  }
  return {
    display_name: formatCreditAppLegalName({ first_name, middle_name, last_name }),
    error: null
  };
}

function mergeContactIntoCreditAppInfo(
  info: CrmCreditApplicationInfo,
  contact: {
    phone: string | null;
    secondary_phone: string | null;
    email: string | null;
    date_of_birth: string | null;
  }
): CrmCreditApplicationInfo {
  return {
    ...info,
    phone: contact.phone ?? "",
    secondary_phone: contact.secondary_phone ?? "",
    email: contact.email ?? "",
    date_of_birth: contact.date_of_birth ?? ""
  };
}

function syncCreditAppNamesIntoInfo(
  existingInfo: CrmCreditApplicationInfo,
  nameParts: CreditAppNameParts
): CrmCreditApplicationInfo {
  return {
    ...existingInfo,
    first_name: nameParts.first_name.trim(),
    middle_name: nameParts.middle_name.trim(),
    last_name: nameParts.last_name.trim()
  };
}

function buildCustomerSnapshot(customer: CrmCustomer, creditInfo?: CrmCreditApplicationInfo): CrmCustomerEditSnapshot {
  return {
    display_name: customer.display_name,
    phone: customer.phone,
    secondary_phone: customer.secondary_phone,
    email: customer.email,
    date_of_birth: customer.date_of_birth,
    assigned_to: customer.assigned_to,
    assigned_to_email: customer.assigned_to_email,
    status: customer.status,
    pipeline_stage: customer.pipeline_stage,
    lost_at: customer.lost_at,
    credit_application_info: creditInfo ?? getCustomerCreditApplicationInfo(customer)
  };
}

async function recordCustomerEditHistory(input: {
  customerId: string;
  source: CrmCustomerEditSource;
  snapshotBefore: CrmCustomerEditSnapshot;
  changes: CrmCustomerEditChange[];
}): Promise<void> {
  if (input.changes.length === 0) {
    return;
  }
  const { data: userData } = await supabase.auth.getUser();
  const authorId = userData.user?.id ?? null;
  const authorEmail = userData.user?.email?.trim() || null;
  const summary = buildEditSummary(input.source, input.changes);

  const { error } = await supabase.from("crm_customer_edit_history").insert({
    customer_id: input.customerId,
    author_id: authorId,
    author_email: authorEmail,
    source: input.source,
    summary,
    changes: input.changes,
    snapshot_before: input.snapshotBefore
  });

  if (error) {
    console.warn("Customer edit history not recorded:", error.message);
  }
}

export async function fetchCustomerEditHistory(
  customerId: string,
  limit = 40
): Promise<{ data: CrmCustomerEditHistoryRow[]; error: string | null }> {
  const { data, error } = await supabase
    .from("crm_customer_edit_history")
    .select("id, created_at, customer_id, author_id, author_email, source, summary, changes, snapshot_before")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return { data: [], error: friendlyError(error) };
  }

  return {
    data: (data ?? []).map((row) => ({
      ...(row as CrmCustomerEditHistoryRow),
      author_id: (row as CrmCustomerEditHistoryRow).author_id ?? null,
      author_email: (row as CrmCustomerEditHistoryRow).author_email ?? null,
      changes: Array.isArray((row as CrmCustomerEditHistoryRow).changes)
        ? (row as CrmCustomerEditHistoryRow).changes
        : [],
      snapshot_before: ((row as CrmCustomerEditHistoryRow).snapshot_before ?? emptySnapshot()) as CrmCustomerEditSnapshot
    })),
    error: null
  };
}

export async function restoreCustomerEditHistory(historyId: string): Promise<{ error: string | null }> {
  const { data, error } = await supabase.rpc("restore_crm_customer_edit", {
    p_history_id: historyId
  });

  if (error) {
    return { error: friendlyError(error) };
  }

  const result = data as { ok?: boolean; error?: string } | null;
  if (!result?.ok) {
    return { error: result?.error ?? "Could not restore this version." };
  }
  return { error: null };
}

export type CustomerBasicInfoInput = CreditAppNameParts & {
  phone: string;
  email: string;
  secondary_phone: string;
  date_of_birth: string;
};

export type InsertCustomerInput = CustomerBasicInfoInput;

export async function insertCustomer(input: InsertCustomerInput): Promise<{ id: string | null; error: string | null }> {
  const nameCheck = validateCustomerNameParts(input);
  if (nameCheck.error) {
    return { id: null, error: nameCheck.error };
  }
  const display_name = nameCheck.display_name;

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

  const creditInfo = mergeContactIntoCreditAppInfo(
    syncCreditAppNamesIntoInfo(EMPTY_CREDIT_APPLICATION_INFO, input),
    { phone: phoneNorm.value, secondary_phone, email, date_of_birth }
  );

  const { data, error } = await supabase
    .from("crm_customers")
    .insert({
      display_name,
      phone: phoneNorm.value,
      email,
      secondary_phone,
      date_of_birth,
      status: "active",
      pipeline_stage: "fresh_lead",
      profile_metadata: { [CREDIT_APPLICATION_INFO_KEY]: creditInfo }
    })
    .select("id")
    .single();

  if (error) {
    return { id: null, error: friendlyError(error) };
  }
  const customerId = data?.id ?? null;
  if (customerId) {
    const afterSnapshot: CrmCustomerEditSnapshot = {
      display_name,
      phone: phoneNorm.value,
      secondary_phone,
      email,
      date_of_birth,
      assigned_to: null,
      assigned_to_email: null,
      status: "active",
      pipeline_stage: "fresh_lead",
      lost_at: null,
      credit_application_info: creditInfo
    };
    void recordCustomerEditHistory({
      customerId,
      source: "created",
      snapshotBefore: emptySnapshot(),
      changes: buildCreatedChanges(afterSnapshot)
    });
  }
  return { id: customerId, error: null };
}

export type UpdateCustomerInput = CustomerBasicInfoInput;

export async function updateCustomer(
  id: string,
  patch: UpdateCustomerInput,
  options?: { existingCustomer?: CrmCustomer }
): Promise<{ error: string | null }> {
  const nameCheck = validateCustomerNameParts(patch);
  if (nameCheck.error) {
    return { error: nameCheck.error };
  }
  const display_name = nameCheck.display_name;

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

  let existingMetadata = safeRecord(options?.existingCustomer?.profile_metadata) ?? null;
  if (!existingMetadata) {
    const { data: row, error: fetchError } = await supabase
      .from("crm_customers")
      .select("profile_metadata")
      .eq("id", id)
      .maybeSingle();
    if (fetchError) {
      return { error: friendlyError(fetchError) };
    }
    existingMetadata = safeRecord(row?.profile_metadata) ?? {};
  }

  const existingRaw = safeRecord(existingMetadata[CREDIT_APPLICATION_INFO_KEY]);
  const existingInfo = normalizeCreditApplicationInfo(
    {
      display_name,
      phone: phoneNorm.value,
      secondary_phone,
      email,
      date_of_birth
    },
    existingRaw
  );
  const syncedInfo = mergeContactIntoCreditAppInfo(syncCreditAppNamesIntoInfo(existingInfo, patch), {
    phone: phoneNorm.value,
    secondary_phone,
    email,
    date_of_birth
  });
  const nextMetadata: Record<string, unknown> = {
    ...existingMetadata,
    [CREDIT_APPLICATION_INFO_KEY]: syncedInfo
  };

  let beforeCustomer = options?.existingCustomer ?? null;
  if (!beforeCustomer) {
    const { data: row, error: beforeFetchError } = await supabase
      .from("crm_customers")
      .select(CUSTOMER_SELECT)
      .eq("id", id)
      .maybeSingle();
    if (beforeFetchError) {
      return { error: friendlyError(beforeFetchError) };
    }
    if (!row) {
      return { error: "Customer not found." };
    }
    beforeCustomer = normalizeCustomer(row as CrmCustomer);
  }

  const snapshotBefore = buildCustomerSnapshot(beforeCustomer);
  const afterSnapshot: CrmCustomerEditSnapshot = {
    display_name,
    phone: phoneNorm.value,
    secondary_phone,
    email,
    date_of_birth,
    assigned_to: beforeCustomer.assigned_to,
    assigned_to_email: beforeCustomer.assigned_to_email,
    status: beforeCustomer.status,
    lost_at: beforeCustomer.lost_at,
    credit_application_info: syncedInfo
  };
  const profileChanges = diffProfileSnapshot(snapshotBefore, afterSnapshot);
  const creditChanges = diffCreditAppSnapshot(snapshotBefore.credit_application_info, syncedInfo);
  const changes = [...profileChanges];
  for (const item of creditChanges) {
    if (!changes.some((row) => row.field === item.field)) {
      changes.push(item);
    }
  }

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
  void recordCustomerEditHistory({
    customerId: id,
    source: "profile",
    snapshotBefore,
    changes
  });
  return { error: null };
}

export async function updateCustomerAssignment(
  id: string,
  patch: { assigned_to: string | null; assigned_to_email: string | null }
): Promise<{ error: string | null }> {
  const { data: beforeRow, error: fetchError } = await supabase
    .from("crm_customers")
    .select(CUSTOMER_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (fetchError) {
    return { error: friendlyError(fetchError) };
  }
  if (!beforeRow) {
    return { error: "Customer not found." };
  }

  const beforeCustomer = normalizeCustomer(beforeRow as CrmCustomer);
  const snapshotBefore = buildCustomerSnapshot(beforeCustomer);

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

  const afterSnapshot: CrmCustomerEditSnapshot = {
    ...snapshotBefore,
    assigned_to: patch.assigned_to,
    assigned_to_email: patch.assigned_to_email
  };
  const changes = diffProfileSnapshot(snapshotBefore, afterSnapshot);
  void recordCustomerEditHistory({
    customerId: id,
    source: "assignment",
    snapshotBefore,
    changes
  });
  return { error: null };
}

export async function updateCustomerPipelineStage(
  customerId: string,
  stage: CrmPipelineStage
): Promise<{ error: string | null; missingLabels?: string[] }> {
  const { data: beforeRow, error: fetchError } = await supabase
    .from("crm_customers")
    .select(CUSTOMER_SELECT)
    .eq("id", customerId)
    .maybeSingle();

  if (fetchError) {
    return { error: friendlyError(fetchError) };
  }
  if (!beforeRow) {
    return { error: "Customer not found." };
  }

  const beforeCustomer = normalizeCustomer(beforeRow as CrmCustomer);
  if (beforeCustomer.status === "lost") {
    return { error: "Lost customers cannot change pipeline stage." };
  }
  if (stage === "lost") {
    return { error: "Use Move to lost to set the Lost pipeline stage." };
  }

  const { data: stageRow, error: stageError } = await supabase
    .from("crm_pipeline_stages")
    .select(PIPELINE_STAGE_SELECT)
    .eq("slug", stage)
    .maybeSingle();

  if (stageError) {
    return { error: friendlyError(stageError) };
  }
  if (!stageRow) {
    return { error: "Unknown pipeline stage." };
  }
  const stageConfig = normalizePipelineStageRow(stageRow as Record<string, unknown>);
  if (!stageConfig.is_selectable) {
    return { error: "That pipeline stage cannot be selected manually." };
  }

  if (stageConfig.requires_credit_app) {
    const creditInfo = getCustomerCreditApplicationInfo(beforeCustomer);
    const missingLabels = collectMissingCreditAppFieldLabels(creditInfo);
    if (missingLabels.length > 0) {
      return { error: null, missingLabels };
    }
  }

  const snapshotBefore = buildCustomerSnapshot(beforeCustomer);
  const { error } = await supabase.from("crm_customers").update({ pipeline_stage: stage }).eq("id", customerId);

  if (error) {
    return { error: friendlyError(error) };
  }

  const afterSnapshot: CrmCustomerEditSnapshot = {
    ...snapshotBefore,
    pipeline_stage: stage
  };
  void recordCustomerEditHistory({
    customerId,
    source: "pipeline",
    snapshotBefore,
    changes: diffProfileSnapshot(snapshotBefore, afterSnapshot)
  });
  return { error: null };
}

export function getCustomerCreditApplicationInfo(customer: CrmCustomer): CrmCreditApplicationInfo {
  const metadata = safeRecord(customer.profile_metadata);
  const rawInfo = safeRecord(metadata?.[CREDIT_APPLICATION_INFO_KEY]);
  return normalizeCreditApplicationInfo(customer, rawInfo);
}

const PREAPPROVAL_SEED_SELECT = `
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
`;

export function mapPreapprovalToCreditApplicationSeed(
  preapproval: Record<string, unknown>
): Partial<CrmCreditApplicationInfo> {
  return {
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
  };
}

export async function fetchSystemLeadCreditApplicationSeed(
  customerId: string
): Promise<{ data: Partial<CrmCreditApplicationInfo> | null; error: string | null }> {
  const { data, error } = await supabase
    .from("crm_system_leads")
    .select(`created_at, preapproval:crm_public_preapproval_leads (${PREAPPROVAL_SEED_SELECT})`)
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
    data: mapPreapprovalToCreditApplicationSeed(preapproval),
    error: null
  };
}

export async function fetchLeadSheetPrintPayloadForCustomer(
  customer: CrmCustomer,
  directory: CrmUserDirectoryRow[]
): Promise<
  | {
      form: CrmCreditApplicationInfo;
      customerName: string;
      assigneeLabel: string | null;
      sourceLabel: string;
      notes: string;
    }
  | { error: string }
> {
  const { data: seed, error } = await fetchSystemLeadCreditApplicationSeed(customer.id);
  if (error) {
    return { error };
  }
  if (!seed) {
    return { error: "No website application data found for this lead." };
  }

  const form = mergeSeedIntoCreditAppInfo(getCustomerCreditApplicationInfo(customer), seed);
  return {
    form,
    customerName: leadSheetCustomerName(form, customer.display_name),
    assigneeLabel: leadSheetAssigneeLabelForCustomer(customer, directory),
    sourceLabel: leadSheetSourceLabelForCustomer(customer),
    notes: form.notes ?? ""
  };
}

export async function saveCustomerCreditApplicationInfo(
  customer: CrmCustomer,
  info: CrmCreditApplicationInfo
): Promise<{ error: string | null }> {
  const nextInfo = normalizeCreditApplicationInfo(customer, info as unknown as Record<string, unknown>);
  const display_name = formatCreditAppLegalName(nextInfo) || customer.display_name.trim();

  const phoneNorm = normalizePhoneForStorage(nextInfo.phone);
  if (phoneNorm.error) {
    return { error: phoneNorm.error };
  }
  const secNorm = normalizePhoneForStorage(nextInfo.secondary_phone);
  if (secNorm.error) {
    return { error: secNorm.error };
  }

  const phone = phoneNorm.value ?? customer.phone;
  if (!phone) {
    return { error: "Primary phone is required on the credit application or customer profile." };
  }

  const secondary_phone = secNorm.value ?? customer.secondary_phone;
  const email = nextInfo.email.trim() || customer.email;
  const date_of_birth = nextInfo.date_of_birth.trim() || customer.date_of_birth;

  const syncedInfo = mergeContactIntoCreditAppInfo(nextInfo, {
    phone,
    secondary_phone,
    email,
    date_of_birth
  });

  const existingMetadata = safeRecord(customer.profile_metadata) ?? {};
  const nextMetadata: Record<string, unknown> = {
    ...existingMetadata,
    [CREDIT_APPLICATION_INFO_KEY]: syncedInfo
  };

  const snapshotBefore = buildCustomerSnapshot(customer);
  const afterSnapshot: CrmCustomerEditSnapshot = {
    display_name,
    phone,
    secondary_phone,
    email,
    date_of_birth,
    assigned_to: customer.assigned_to,
    assigned_to_email: customer.assigned_to_email,
    status: customer.status,
    lost_at: customer.lost_at,
    credit_application_info: syncedInfo
  };
  const profileChanges = diffProfileSnapshot(snapshotBefore, afterSnapshot);
  const creditChanges = diffCreditAppSnapshot(snapshotBefore.credit_application_info, syncedInfo);
  const changes = [...creditChanges];
  for (const item of profileChanges) {
    if (!changes.some((row) => row.field === item.field)) {
      changes.push(item);
    }
  }

  const { error } = await supabase
    .from("crm_customers")
    .update({
      display_name,
      phone,
      email,
      secondary_phone,
      date_of_birth,
      profile_metadata: nextMetadata
    })
    .eq("id", customer.id);

  if (error) {
    return { error: friendlyError(error) };
  }
  void recordCustomerEditHistory({
    customerId: customer.id,
    source: "credit_app",
    snapshotBefore,
    changes
  });
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

const DIRECTORY_GROUP_SELECT = "slug, label, rank, sort_order, is_default";

function normalizeDirectoryGroupRow(row: Record<string, unknown>): CrmDirectoryGroup {
  return {
    slug: String(row.slug ?? "").trim(),
    label: String(row.label ?? "").trim(),
    rank: Number(row.rank) || 1,
    sort_order: Number(row.sort_order) || 0,
    is_default: Boolean(row.is_default)
  };
}

function normalizeDirectoryPosition(value: unknown): CrmDirectoryPosition {
  const raw = typeof value === "string" ? value.trim() : "";
  return raw || defaultDirectoryGroupSlug();
}

export async function fetchCrmUserDirectory(): Promise<{ data: CrmUserDirectoryRow[]; error: string | null }> {
  const { data, error } = await supabase
    .from("crm_user_directory")
    .select("user_id, email, updated_at, display_name, avatar_path, callback_phone, position, is_permissions_admin")
    .order("email", { ascending: true });

  if (error) {
    return { data: [], error: friendlyError(error) };
  }
  return {
    data: (data ?? []).map((r) => {
      const row = r as CrmUserDirectoryRow;
      return {
        ...row,
        display_name: row.display_name ?? null,
        avatar_path: row.avatar_path ? String(row.avatar_path) : null,
        callback_phone: row.callback_phone ? String(row.callback_phone) : null,
        position: normalizeDirectoryPosition(row.position),
        is_permissions_admin: Boolean(row.is_permissions_admin)
      };
    }),
    error: null
  };
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

export async function updateDirectoryCallbackPhone(
  userId: string,
  callbackPhone: string | null
): Promise<{ error: string | null }> {
  let value: string | null = null;
  if (callbackPhone != null && callbackPhone.trim() !== "") {
    const normalized = normalizePhoneForStorage(callbackPhone);
    if (normalized.error) {
      return { error: normalized.error };
    }
    value = normalized.value;
  }

  const { error } = await supabase
    .from("crm_user_directory")
    .update({
      callback_phone: value,
      updated_at: new Date().toISOString()
    })
    .eq("user_id", userId);

  if (error) {
    return { error: friendlyError(error) };
  }
  return { error: null };
}

export async function updateDirectoryPosition(
  userId: string,
  position: CrmDirectoryPosition
): Promise<{ error: string | null }> {
  const slug = position.trim();
  if (!slug) {
    return { error: "Invalid position." };
  }
  const { error } = await supabase
    .from("crm_user_directory")
    .update({
      position: slug,
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
  const { data: beforeRow, error: fetchError } = await supabase
    .from("crm_customers")
    .select(CUSTOMER_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (fetchError) {
    return { error: friendlyError(fetchError) };
  }
  if (!beforeRow) {
    return { error: "Customer not found." };
  }

  const beforeCustomer = normalizeCustomer(beforeRow as CrmCustomer);
  const snapshotBefore = buildCustomerSnapshot(beforeCustomer);
  const lostAt = new Date().toISOString();

  const { error } = await supabase
    .from("crm_customers")
    .update({
      status: "lost",
      lost_at: lostAt,
      pipeline_stage: "lost"
    })
    .eq("id", id);

  if (error) {
    return { error: friendlyError(error) };
  }

  const afterSnapshot: CrmCustomerEditSnapshot = {
    ...snapshotBefore,
    status: "lost",
    lost_at: lostAt,
    pipeline_stage: "lost"
  };
  void recordCustomerEditHistory({
    customerId: id,
    source: "status",
    snapshotBefore,
    changes: diffProfileSnapshot(snapshotBefore, afterSnapshot)
  });
  return { error: null };
}

export async function restoreCustomer(id: string): Promise<{ error: string | null }> {
  const { data: beforeRow, error: fetchError } = await supabase
    .from("crm_customers")
    .select(CUSTOMER_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (fetchError) {
    return { error: friendlyError(fetchError) };
  }
  if (!beforeRow) {
    return { error: "Customer not found." };
  }

  const beforeCustomer = normalizeCustomer(beforeRow as CrmCustomer);
  const snapshotBefore = buildCustomerSnapshot(beforeCustomer);

  const { error } = await supabase
    .from("crm_customers")
    .update({
      status: "active",
      lost_at: null,
      pipeline_stage: "fresh_lead"
    })
    .eq("id", id);

  if (error) {
    return { error: friendlyError(error) };
  }

  const afterSnapshot: CrmCustomerEditSnapshot = {
    ...snapshotBefore,
    status: "active",
    lost_at: null,
    pipeline_stage: "fresh_lead"
  };
  void recordCustomerEditHistory({
    customerId: id,
    source: "status",
    snapshotBefore,
    changes: diffProfileSnapshot(snapshotBefore, afterSnapshot)
  });
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

export async function initiateTwilioCall(customerId: string): Promise<{
  ok: boolean;
  message: string | null;
  sessionId: string | null;
  pipelineStage: string | null;
  error: string | null;
}> {
  const { data, error } = await supabase.functions.invoke("twilio-initiate-call", {
    body: { customer_id: customerId }
  });

  if (error) {
    return { ok: false, message: null, sessionId: null, pipelineStage: null, error: error.message || "Could not start call." };
  }

  const payload = data as {
    ok?: boolean;
    message?: string;
    error?: string;
    session_id?: string;
    pipeline_stage?: string | null;
  } | null;
  if (!payload?.ok) {
    return { ok: false, message: null, sessionId: null, pipelineStage: null, error: payload?.error ?? "Could not start call." };
  }

  return {
    ok: true,
    message: payload.message ?? "Calling your phone…",
    sessionId: payload.session_id ?? null,
    pipelineStage: payload.pipeline_stage ?? null,
    error: null
  };
}

export async function fetchCallSession(sessionId: string): Promise<{
  data: CrmPhoneCallSession | null;
  error: string | null;
}> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) {
    return { data: null, error: "Not signed in." };
  }

  const { data, error } = await supabase
    .from("crm_phone_call_sessions")
    .select(
      "id, customer_id, agent_user_id, direction, status, agent_answered, bridge_connected, dial_call_status, parent_call_status, call_duration_seconds, parent_call_duration_seconds, failure_reason, activity_id, updated_at"
    )
    .eq("id", sessionId)
    .eq("agent_user_id", userId)
    .maybeSingle();

  if (error) {
    return { data: null, error: friendlyError(error) };
  }

  if (!data) {
    return { data: null, error: "Call session not found." };
  }

  return {
    data: {
      id: String(data.id),
      customer_id: data.customer_id ? String(data.customer_id) : null,
      agent_user_id: data.agent_user_id ? String(data.agent_user_id) : null,
      direction: data.direction === "inbound" ? "inbound" : "outbound",
      status: String(data.status),
      agent_answered: Boolean(data.agent_answered),
      bridge_connected: Boolean(data.bridge_connected),
      dial_call_status: data.dial_call_status ? String(data.dial_call_status) : null,
      parent_call_status: data.parent_call_status ? String(data.parent_call_status) : null,
      call_duration_seconds:
        typeof data.call_duration_seconds === "number" ? data.call_duration_seconds : null,
      parent_call_duration_seconds:
        typeof data.parent_call_duration_seconds === "number" ? data.parent_call_duration_seconds : null,
      failure_reason: data.failure_reason ? String(data.failure_reason) : null,
      activity_id: data.activity_id ? String(data.activity_id) : null,
      updated_at: String(data.updated_at)
    },
    error: null
  };
}

export async function fetchLatestInboundCallSessionForAgent(): Promise<{
  data: {
    session: CrmPhoneCallSession;
    customerId: string | null;
    customerName: string | null;
  } | null;
  error: string | null;
}> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) {
    return { data: null, error: "Not signed in." };
  }

  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("crm_phone_call_sessions")
    .select(
      "id, customer_id, agent_user_id, direction, status, agent_answered, bridge_connected, dial_call_status, parent_call_status, call_duration_seconds, parent_call_duration_seconds, failure_reason, activity_id, updated_at, created_at, crm_customers(display_name)"
    )
    .eq("agent_user_id", userId)
    .eq("direction", "inbound")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return { data: null, error: friendlyError(error) };
  }

  if (!data) {
    return { data: null, error: null };
  }

  const customerJoin = data.crm_customers as { display_name?: string | null } | null;
  return {
    data: {
      session: {
        id: String(data.id),
        customer_id: data.customer_id ? String(data.customer_id) : null,
        agent_user_id: data.agent_user_id ? String(data.agent_user_id) : null,
        direction: "inbound",
        status: String(data.status),
        agent_answered: Boolean(data.agent_answered),
        bridge_connected: Boolean(data.bridge_connected),
        dial_call_status: data.dial_call_status ? String(data.dial_call_status) : null,
        parent_call_status: data.parent_call_status ? String(data.parent_call_status) : null,
        call_duration_seconds:
          typeof data.call_duration_seconds === "number" ? data.call_duration_seconds : null,
        parent_call_duration_seconds:
          typeof data.parent_call_duration_seconds === "number"
            ? data.parent_call_duration_seconds
            : null,
        failure_reason: data.failure_reason ? String(data.failure_reason) : null,
        activity_id: data.activity_id ? String(data.activity_id) : null,
        updated_at: String(data.updated_at)
      },
      customerId: data.customer_id ? String(data.customer_id) : null,
      customerName: customerJoin?.display_name ? String(customerJoin.display_name) : null
    },
    error: null
  };
}

export async function fetchSmsThreads(options: {
  filter: CrmSmsThreadFilter;
  userId: string | null;
  /** Whose read cursors and "mine" assignee filter to use (defaults to userId). */
  inboxUserId?: string | null;
  search?: string;
}): Promise<{ data: CrmSmsThread[]; error: string | null }> {
  const { data: threadRows, error: threadError } = await supabase
    .from("crm_sms_threads")
    .select(
      "customer_id, last_message_at, last_message_preview, last_message_direction, assigned_to, crm_customers(display_name, phone, secondary_phone)"
    )
    .order("last_message_at", { ascending: false });

  if (threadError) {
    return { data: [], error: friendlyError(threadError) };
  }

  const { data: userData } = await supabase.auth.getUser();
  const meId = options.userId ?? userData.user?.id ?? null;
  const inboxUserId = options.inboxUserId ?? meId;

  let readCursors = new Map<string, string>();
  if (inboxUserId) {
    const { data: cursorRows, error: cursorError } = await supabase
      .from("crm_sms_read_cursors")
      .select("customer_id, last_read_at")
      .eq("user_id", inboxUserId);

    if (cursorError) {
      return { data: [], error: friendlyError(cursorError) };
    }

    readCursors = new Map(
      (cursorRows ?? []).map((row) => [String(row.customer_id), String(row.last_read_at)])
    );
  }

  const search = options.search?.trim().toLowerCase() ?? "";

  const threads: CrmSmsThread[] = (threadRows ?? [])
    .map((row) => {
      const customer = row.crm_customers as
        | { display_name: string | null; phone: string | null; secondary_phone: string | null }
        | { display_name: string | null; phone: string | null; secondary_phone: string | null }[]
        | null;
      const customerRow = Array.isArray(customer) ? customer[0] : customer;
      const customerId = String(row.customer_id);
      const lastReadAt = readCursors.get(customerId) ?? null;
      const lastMessageAt = String(row.last_message_at);
      const direction = row.last_message_direction as CrmSmsDirection;
      const unread =
        direction === "inbound" && (!lastReadAt || new Date(lastMessageAt) > new Date(lastReadAt));

      return {
        customer_id: customerId,
        customer_display_name: customerRow?.display_name ?? null,
        customer_phone: customerRow?.phone ?? customerRow?.secondary_phone ?? null,
        assigned_to: row.assigned_to ? String(row.assigned_to) : null,
        last_message_at: lastMessageAt,
        last_message_preview: String(row.last_message_preview ?? ""),
        last_message_direction: direction,
        unread
      };
    })
    .filter((thread) => {
      if (options.filter === "mine" && inboxUserId && thread.assigned_to !== inboxUserId) {
        return false;
      }
      if (options.filter === "unread" && !thread.unread) {
        return false;
      }
      if (!search) {
        return true;
      }
      const haystack = [
        thread.customer_display_name ?? "",
        thread.customer_phone ?? "",
        thread.last_message_preview
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(search);
    });

  return { data: threads, error: null };
}

export async function fetchSmsMessages(
  customerId: string
): Promise<{ data: CrmSmsMessage[]; error: string | null }> {
  const { data, error } = await supabase
    .from("crm_activities")
    .select(
      "id, created_at, body, sms_direction, sms_status, author_id, author_email, source, kind"
    )
    .eq("customer_id", customerId)
    .eq("kind", "text")
    .eq("source", "twilio")
    .order("created_at", { ascending: true });

  if (error) {
    return { data: [], error: friendlyError(error) };
  }

  return {
    data: (data ?? []).map((row) => ({
      id: String(row.id),
      created_at: String(row.created_at),
      body: String(row.body),
      sms_direction: (row.sms_direction as CrmSmsDirection | null) ?? null,
      sms_status: row.sms_status ?? null,
      author_id: row.author_id ? String(row.author_id) : null,
      author_email: row.author_email ?? null,
      source: row.source === "twilio" ? "twilio" : "manual"
    })),
    error: null
  };
}

export async function sendSms(
  customerId: string,
  body: string
): Promise<{ ok: boolean; activityId: string | null; error: string | null }> {
  const trimmed = body.trim();
  if (!trimmed) {
    return { ok: false, activityId: null, error: "Message cannot be empty." };
  }

  const { data, error } = await supabase.functions.invoke("twilio-send-sms", {
    body: { customer_id: customerId, body: trimmed }
  });

  if (error) {
    return { ok: false, activityId: null, error: error.message || "Could not send text." };
  }

  const payload = data as { ok?: boolean; activity_id?: string; error?: string } | null;
  if (!payload?.ok) {
    return { ok: false, activityId: null, error: payload?.error ?? "Could not send text." };
  }

  return {
    ok: true,
    activityId: payload.activity_id ?? null,
    error: null
  };
}

export async function markSmsThreadRead(customerId: string): Promise<{ error: string | null }> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) {
    return { error: "Not signed in." };
  }

  const now = new Date().toISOString();
  const { error } = await supabase.from("crm_sms_read_cursors").upsert(
    {
      user_id: userId,
      customer_id: customerId,
      last_read_at: now
    },
    { onConflict: "user_id,customer_id" }
  );

  if (error) {
    return { error: friendlyError(error) };
  }
  return { error: null };
}

export async function fetchSmsComposeTarget(customerId: string): Promise<{
  data: CrmSmsThread | null;
  error: string | null;
}> {
  const { data, error } = await supabase
    .from("crm_customers")
    .select("id, display_name, phone, secondary_phone, assigned_to")
    .eq("id", customerId)
    .maybeSingle();

  if (error) {
    return { data: null, error: friendlyError(error) };
  }
  if (!data) {
    return { data: null, error: "Customer not found." };
  }

  const phone = data.phone ? String(data.phone) : data.secondary_phone ? String(data.secondary_phone) : null;

  return {
    data: {
      customer_id: String(data.id),
      customer_display_name: data.display_name ? String(data.display_name) : null,
      customer_phone: phone,
      assigned_to: data.assigned_to ? String(data.assigned_to) : null,
      last_message_at: new Date().toISOString(),
      last_message_preview: "Start a conversation…",
      last_message_direction: "outbound",
      unread: false
    },
    error: null
  };
}

export async function fetchCallRecordingUrl(activityId: string): Promise<{
  url: string | null;
  error: string | null;
}> {
  const { data, error } = await supabase.functions.invoke("twilio-recording-url", {
    body: { activity_id: activityId }
  });

  if (error) {
    return { url: null, error: error.message || "Could not load recording." };
  }

  const payload = data as { ok?: boolean; url?: string; error?: string } | null;
  if (!payload?.ok || !payload.url) {
    return { url: null, error: payload?.error ?? "Recording not available." };
  }

  return { url: payload.url, error: null };
}

type CallLogCustomerJoin = {
  display_name?: string | null;
  phone?: string | null;
  secondary_phone?: string | null;
};

const CALL_LOG_NO_NAME = "No name call";

function buildCallLogDirectoryMaps(directory: CrmUserDirectoryRow[]) {
  const labelByPhone = new Map<string, string>();
  const rowByUserId = new Map<string, CrmUserDirectoryRow>();
  for (const row of directory) {
    rowByUserId.set(row.user_id, row);
    const phone10 = normalizeNanpTo10Digits(row.callback_phone ?? "");
    if (phone10) {
      labelByPhone.set(phone10, directoryPersonLabel(row));
    }
  }
  return { labelByPhone, rowByUserId };
}

function isCallLogAgentLeg(direction: CrmCallDirection | null, side: "from" | "to"): boolean {
  if (direction === "inbound") {
    return side === "to";
  }
  if (direction === "outbound") {
    return side === "from";
  }
  return false;
}

function isCallLogCustomerLeg(direction: CrmCallDirection | null, side: "from" | "to"): boolean {
  if (direction === "inbound") {
    return side === "from";
  }
  if (direction === "outbound") {
    return side === "to";
  }
  return false;
}

function resolveCallLogAuthorCrmLabel(
  authorId: string | null,
  authorEmail: string | null,
  rowByUserId: Map<string, CrmUserDirectoryRow>
): string | null {
  if (authorId) {
    const row = rowByUserId.get(authorId);
    if (row) {
      return directoryPersonLabel(row);
    }
  }
  return authorEmail?.trim() || null;
}

function resolveCallLogPhoneParty(
  phone: string | null,
  direction: CrmCallDirection | null,
  side: "from" | "to",
  labelByPhone: Map<string, string>,
  rowByUserId: Map<string, CrmUserDirectoryRow>,
  customerId: string | null,
  customer: CallLogCustomerJoin | null,
  authorId: string | null,
  authorEmail: string | null
): CrmCallLogPhoneParty | null {
  if (!phone) {
    return null;
  }
  const phone10 = normalizeNanpTo10Digits(phone);
  if (!phone10) {
    return null;
  }

  const callbackLabel = labelByPhone.get(phone10);
  if (callbackLabel) {
    return { kind: "crm_user", label: callbackLabel, customer_id: null };
  }

  const customerPhone = customer?.phone ? normalizeNanpTo10Digits(customer.phone) : null;
  const customerSecondaryPhone = customer?.secondary_phone
    ? normalizeNanpTo10Digits(customer.secondary_phone)
    : null;
  const matchesCustomerPhone =
    phone10 === customerPhone || phone10 === customerSecondaryPhone;

  if (isCallLogCustomerLeg(direction, side) || matchesCustomerPhone) {
    const profileName = customer?.display_name?.trim();
    return {
      kind: "customer",
      label: profileName || CALL_LOG_NO_NAME,
      customer_id: customerId
    };
  }

  if (isCallLogAgentLeg(direction, side)) {
    const authorLabel = resolveCallLogAuthorCrmLabel(authorId, authorEmail, rowByUserId);
    if (authorLabel) {
      return { kind: "crm_user", label: authorLabel, customer_id: null };
    }
  }

  if (!direction) {
    const profileName = customer?.display_name?.trim();
    return {
      kind: "customer",
      label: profileName || CALL_LOG_NO_NAME,
      customer_id: customerId
    };
  }

  return null;
}

export async function fetchCallLog(input: {
  range: CrmDateRange;
  direction: CrmCallLogDirectionFilter;
  limit?: number;
}): Promise<{ data: CrmCallLogEntry[]; error: string | null }> {
  const bounds = crmDateRangeToCreatedAtBounds(input.range);
  const limit = Math.min(Math.max(input.limit ?? 200, 1), 500);

  let query = supabase
    .from("crm_activities")
    .select(
      "id, created_at, customer_id, author_id, author_email, body, call_direction, call_duration_seconds, call_from, call_to, recording_storage_path, call_session_status, call_parent_status, call_dial_status, call_agent_answered, call_bridge_connected, call_failure_reason, call_parent_duration_seconds, crm_customers(display_name, phone, secondary_phone)"
    )
    .eq("kind", "call")
    .eq("source", "twilio")
    .gte("created_at", bounds.from)
    .lte("created_at", bounds.to)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (input.direction !== "all") {
    query = query.eq("call_direction", input.direction);
  }

  const [{ data, error }, directoryResult] = await Promise.all([query, fetchCrmUserDirectory()]);

  if (error) {
    return { data: [], error: friendlyError(error) };
  }

  const { labelByPhone, rowByUserId } = buildCallLogDirectoryMaps(directoryResult.data);

  return {
    data: (data ?? []).map((row) => {
      const entry = row as CrmCallLogEntry & {
        recording_storage_path?: string | null;
        crm_customers?: CallLogCustomerJoin | CallLogCustomerJoin[] | null;
      };
      const customerJoin = entry.crm_customers;
      const customerRow = Array.isArray(customerJoin) ? (customerJoin[0] ?? null) : (customerJoin ?? null);
      const customerDisplayName = customerRow?.display_name ?? null;

      return {
        id: entry.id,
        created_at: entry.created_at,
        customer_id: entry.customer_id,
        customer_display_name: customerDisplayName,
        author_id: entry.author_id,
        author_email: entry.author_email ?? null,
        call_direction: entry.call_direction ?? null,
        call_duration_seconds: entry.call_duration_seconds ?? null,
        call_from: entry.call_from ?? null,
        call_to: entry.call_to ?? null,
        call_from_party: resolveCallLogPhoneParty(
          entry.call_from ?? null,
          entry.call_direction ?? null,
          "from",
          labelByPhone,
          rowByUserId,
          entry.customer_id,
          customerRow,
          entry.author_id,
          entry.author_email ?? null
        ),
        call_to_party: resolveCallLogPhoneParty(
          entry.call_to ?? null,
          entry.call_direction ?? null,
          "to",
          labelByPhone,
          rowByUserId,
          entry.customer_id,
          customerRow,
          entry.author_id,
          entry.author_email ?? null
        ),
        body: entry.body,
        has_recording: Boolean(entry.recording_storage_path),
        call_session_status: entry.call_session_status ?? null,
        call_parent_status: entry.call_parent_status ?? null,
        call_dial_status: entry.call_dial_status ?? null,
        call_agent_answered: entry.call_agent_answered ?? null,
        call_bridge_connected: entry.call_bridge_connected ?? null,
        call_failure_reason: entry.call_failure_reason ?? null,
        call_parent_duration_seconds: entry.call_parent_duration_seconds ?? null
      };
    }),
    error: null
  };
}

export async function fetchTextLog(input: {
  range: CrmDateRange;
  direction: CrmCallLogDirectionFilter;
  limit?: number;
}): Promise<{ data: CrmTextLogEntry[]; error: string | null }> {
  const bounds = crmDateRangeToCreatedAtBounds(input.range);
  const limit = Math.min(Math.max(input.limit ?? 200, 1), 500);

  let query = supabase
    .from("crm_activities")
    .select(
      "id, created_at, customer_id, author_id, author_email, body, sms_direction, sms_status, sms_from, sms_to, crm_customers(display_name, phone, secondary_phone)"
    )
    .eq("kind", "text")
    .eq("source", "twilio")
    .gte("created_at", bounds.from)
    .lte("created_at", bounds.to)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (input.direction !== "all") {
    query = query.eq("sms_direction", input.direction);
  }

  const [{ data, error }, directoryResult] = await Promise.all([query, fetchCrmUserDirectory()]);

  if (error) {
    return { data: [], error: friendlyError(error) };
  }

  const { labelByPhone, rowByUserId } = buildCallLogDirectoryMaps(directoryResult.data);

  return {
    data: (data ?? []).map((row) => {
      const entry = row as CrmTextLogEntry & {
        crm_customers?: CallLogCustomerJoin | CallLogCustomerJoin[] | null;
      };
      const customerJoin = entry.crm_customers;
      const customerRow = Array.isArray(customerJoin) ? (customerJoin[0] ?? null) : (customerJoin ?? null);
      const customerDisplayName = customerRow?.display_name ?? null;
      const direction = entry.sms_direction ?? null;

      return {
        id: entry.id,
        created_at: entry.created_at,
        customer_id: entry.customer_id,
        customer_display_name: customerDisplayName,
        author_id: entry.author_id ? String(entry.author_id) : null,
        author_email: entry.author_email ?? null,
        sms_direction: direction,
        sms_status: entry.sms_status ?? null,
        sms_from: entry.sms_from ?? null,
        sms_to: entry.sms_to ?? null,
        sms_from_party: resolveCallLogPhoneParty(
          entry.sms_from ?? null,
          direction,
          "from",
          labelByPhone,
          rowByUserId,
          entry.customer_id,
          customerRow,
          entry.author_id,
          entry.author_email ?? null
        ),
        sms_to_party: resolveCallLogPhoneParty(
          entry.sms_to ?? null,
          direction,
          "to",
          labelByPhone,
          rowByUserId,
          entry.customer_id,
          customerRow,
          entry.author_id,
          entry.author_email ?? null
        ),
        body: entry.body
      };
    }),
    error: null
  };
}

export async function fetchLenderOutcomesForCustomers(customerIds: string[]): Promise<{
  data: Map<string, Partial<Record<CrmLenderSlug, CrmLenderOutcomeEntry>>>;
  error: string | null;
}> {
  const ids = [...new Set(customerIds.filter(Boolean))];
  if (ids.length === 0) {
    return { data: new Map(), error: null };
  }

  const { data, error } = await supabase
    .from("crm_customer_lender_outcomes")
    .select("customer_id, lender_slug, outcome, reason, updated_at")
    .in("customer_id", ids);

  if (error) {
    return { data: new Map(), error: friendlyError(error) };
  }

  const rows = (data ?? []) as CrmCustomerLenderOutcomeRow[];
  const map = new Map<string, Partial<Record<CrmLenderSlug, CrmLenderOutcomeEntry>>>();
  for (const id of ids) {
    map.set(id, {});
  }
  for (const row of rows) {
    const existing = map.get(row.customer_id) ?? {};
    existing[row.lender_slug] = {
      outcome: row.outcome,
      reason: row.reason ?? null
    };
    map.set(row.customer_id, existing);
  }
  return { data: map, error: null };
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
  isPermissionsAdmin: boolean;
  permissionKeys: string[];
  error: string | null;
};

export async function resolveCrmDirectoryAdminStatus(): Promise<CrmDirectoryAdminStatus> {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user ?? null;

  let dbAdmin = false;
  let isPermissionsAdmin = false;
  let permissionKeys: string[] = [];
  let rpcError: string | null = null;

  const [adminRpc, permissionsAdminRpc, keysRpc] = await Promise.all([
    supabase.rpc("crm_user_directory_admin"),
    supabase.rpc("crm_user_is_permissions_admin"),
    supabase.rpc("crm_user_permission_keys")
  ]);

  if (adminRpc.error) {
    rpcError = friendlyError(adminRpc.error);
  } else {
    dbAdmin = adminRpc.data === true;
  }

  if (!permissionsAdminRpc.error) {
    isPermissionsAdmin = permissionsAdminRpc.data === true;
  }

  if (!keysRpc.error && Array.isArray(keysRpc.data)) {
    permissionKeys = keysRpc.data.filter((key): key is string => typeof key === "string");
  }

  const clientMaster = isCrmDirectoryMaster(user);
  const isAdmin = dbAdmin || clientMaster;

  return { isAdmin, dbAdmin, clientMaster, isPermissionsAdmin, permissionKeys, error: rpcError };
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
      read_at: (r as CrmNotification).read_at ?? null,
      stale_hours: null
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

export async function upsertPushSubscription(
  subscription: PushSubscriptionJSON
): Promise<{ error: string | null }> {
  const endpoint = subscription.endpoint?.trim();
  const p256dh = subscription.keys?.p256dh?.trim();
  const auth = subscription.keys?.auth?.trim();
  if (!endpoint || !p256dh || !auth) {
    return { error: "Invalid push subscription." };
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return { error: userError?.message ?? "Not signed in." };
  }

  const { error } = await supabase.from("crm_push_subscriptions").upsert(
    {
      user_id: userData.user.id,
      endpoint,
      p256dh,
      auth,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      last_seen_at: new Date().toISOString()
    },
    { onConflict: "endpoint" }
  );

  if (error) {
    return { error: friendlyError(error) };
  }
  return { error: null };
}

export async function deletePushSubscription(endpoint: string): Promise<{ error: string | null }> {
  const trimmed = endpoint.trim();
  if (!trimmed) {
    return { error: "Missing push subscription endpoint." };
  }

  const { error } = await supabase.from("crm_push_subscriptions").delete().eq("endpoint", trimmed);
  if (error) {
    return { error: friendlyError(error) };
  }
  return { error: null };
}

export async function fetchPushSubscriptionStatus(): Promise<{ subscribed: boolean; error: string | null }> {
  const { data, error } = await supabase
    .from("crm_push_subscriptions")
    .select("id")
    .limit(1);

  if (error) {
    return { subscribed: false, error: friendlyError(error) };
  }
  return { subscribed: (data?.length ?? 0) > 0, error: null };
}

const TODO_SELECT = "id, user_id, task_date, title, sort_order, is_default, completed_at, created_at";
const TODO_SQL_HINT =
  "Run sql/crm_todo_daily.sql and sql/crm_todo_default_templates.sql in Supabase SQL Editor, then refresh this page.";

const TODO_TEMPLATE_SELECT = "id, user_id, title, sort_order, created_at";

/** Local calendar date as YYYY-MM-DD for daily to-do boundaries. */
export function crmTodoLocalDate(d = new Date()): string {
  return d.toLocaleDateString("en-CA");
}

export type CrmDateRange = {
  from: string;
  to: string;
};

export function normalizeCrmDateRange(from: string, to: string): CrmDateRange {
  const start = from.trim() || to.trim();
  const end = to.trim() || from.trim();
  if (!start || !end) {
    const today = crmTodoLocalDate();
    return { from: today, to: today };
  }
  if (start <= end) {
    return { from: start, to: end };
  }
  return { from: end, to: start };
}

export function crmDateRangeToCreatedAtBounds(range: CrmDateRange): { from: string; to: string } {
  const normalized = normalizeCrmDateRange(range.from, range.to);
  const fromDate = new Date(`${normalized.from}T00:00:00`);
  const toDate = new Date(`${normalized.to}T23:59:59.999`);
  return { from: fromDate.toISOString(), to: toDate.toISOString() };
}

/** Earliest CRM customer creation date (local calendar day), for task range defaults. */
export async function fetchCrmOriginLocalDate(): Promise<{ date: string; error: string | null }> {
  const { data, error } = await supabase
    .from("crm_customers")
    .select("created_at")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    return { date: crmTodoLocalDate(), error: friendlyError(error) };
  }
  if (!data?.created_at) {
    return { date: crmTodoLocalDate(), error: null };
  }
  return { date: crmTodoLocalDate(new Date(String(data.created_at))), error: null };
}

function normalizeCrmTodoItem(row: Record<string, unknown>): CrmTodoItem {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    task_date: String(row.task_date),
    title: String(row.title ?? ""),
    sort_order: Number(row.sort_order ?? 0),
    is_default: row.is_default === true,
    completed_at: row.completed_at ? String(row.completed_at) : null,
    created_at: String(row.created_at)
  };
}

function normalizeCrmTodoLogItems(raw: unknown): CrmTodoLogItem[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.map((entry) => {
    const row = entry as Record<string, unknown>;
    return {
      title: String(row.title ?? ""),
      is_default: row.is_default === true,
      completed: row.completed === true,
      completed_at: row.completed_at ? String(row.completed_at) : null
    };
  });
}

export async function ensureCrmTodoDay(
  taskDate: string,
  userId?: string | null
): Promise<{
  data: CrmTodoItem[];
  error: string | null;
}> {
  const params: { p_task_date: string; p_user_id?: string } = { p_task_date: taskDate };
  if (userId) {
    params.p_user_id = userId;
  }
  const { data, error } = await supabase.rpc("ensure_crm_todo_day", params);
  if (error) {
    const message = friendlyError(error);
    if (/ensure_crm_todo_day|crm_todo_items|crm_todo_daily/i.test(message)) {
      return { data: [], error: TODO_SQL_HINT };
    }
    return { data: [], error: message };
  }
  const rows = Array.isArray(data) ? data : [];
  return { data: rows.map((row) => normalizeCrmTodoItem(row as Record<string, unknown>)), error: null };
}

export async function fetchCrmTodoItems(
  taskDate: string,
  userId?: string | null
): Promise<{
  data: CrmTodoItem[];
  error: string | null;
}> {
  let query = supabase
    .from("crm_todo_items")
    .select(TODO_SELECT)
    .eq("task_date", taskDate)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query;

  if (error) {
    const message = friendlyError(error);
    if (/crm_todo_items/i.test(message)) {
      return { data: [], error: TODO_SQL_HINT };
    }
    return { data: [], error: message };
  }
  return {
    data: (data ?? []).map((row) => normalizeCrmTodoItem(row as Record<string, unknown>)),
    error: null
  };
}

export async function createCrmTodoItem(
  taskDate: string,
  title: string,
  userId?: string | null
): Promise<{ data: CrmTodoItem | null; error: string | null }> {
  const trimmed = title.trim();
  if (!trimmed) {
    return { data: null, error: "Enter a task title." };
  }

  const { data: auth } = await supabase.auth.getUser();
  const callerId = auth.user?.id;
  if (!callerId) {
    return { data: null, error: "Sign in to add tasks." };
  }

  const targetUserId = userId ?? callerId;

  const existing = await fetchCrmTodoItems(taskDate, targetUserId);
  if (existing.error) {
    return { data: null, error: existing.error };
  }

  const maxSort = existing.data.reduce((max, item) => Math.max(max, item.sort_order), -1);

  const { data, error } = await supabase
    .from("crm_todo_items")
    .insert({
      user_id: targetUserId,
      task_date: taskDate,
      title: trimmed,
      sort_order: maxSort + 1,
      is_default: false
    })
    .select(TODO_SELECT)
    .single();

  if (error) {
    if (error.code === "23505") {
      return { data: null, error: "That task is already on today's list." };
    }
    return { data: null, error: friendlyError(error) };
  }

  return { data: normalizeCrmTodoItem(data as Record<string, unknown>), error: null };
}

export async function toggleCrmTodoItem(
  id: string,
  completed: boolean
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("crm_todo_items")
    .update({ completed_at: completed ? new Date().toISOString() : null })
    .eq("id", id);

  if (error) {
    return { error: friendlyError(error) };
  }
  return { error: null };
}

export async function deleteCrmTodoItem(id: string): Promise<{ error: string | null }> {
  const { data: deletedRows, error } = await supabase
    .from("crm_todo_items")
    .delete()
    .eq("id", id)
    .eq("is_default", false)
    .select("id");

  if (error) {
    return { error: friendlyError(error) };
  }
  if (!deletedRows?.length) {
    return { error: "Could not remove this task (default morning tasks cannot be deleted)." };
  }
  return { error: null };
}

export async function fetchCrmTodoDailyLogs(
  userId?: string | null,
  limit = 14
): Promise<{
  data: CrmTodoDailyLog[];
  error: string | null;
}> {
  let query = supabase
    .from("crm_todo_daily_logs")
    .select("id, user_id, log_date, archived_at, items")
    .order("log_date", { ascending: false })
    .limit(limit);

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query;

  if (error) {
    const message = friendlyError(error);
    if (/crm_todo_daily_logs/i.test(message)) {
      return { data: [], error: TODO_SQL_HINT };
    }
    return { data: [], error: message };
  }

  return {
    data: (data ?? []).map((row) => ({
      id: String(row.id),
      user_id: String(row.user_id),
      log_date: String(row.log_date),
      archived_at: String(row.archived_at),
      items: normalizeCrmTodoLogItems(row.items)
    })),
    error: null
  };
}

function normalizeCrmTodoDefaultTemplate(row: Record<string, unknown>): CrmTodoDefaultTemplate {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    title: String(row.title ?? ""),
    sort_order: Number(row.sort_order ?? 0),
    created_at: String(row.created_at)
  };
}

export async function fetchCrmTodoDefaultTemplates(userId?: string | null): Promise<{
  data: CrmTodoDefaultTemplate[];
  error: string | null;
}> {
  let query = supabase
    .from("crm_todo_default_templates")
    .select(TODO_TEMPLATE_SELECT)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query;

  if (error) {
    const message = friendlyError(error);
    if (/crm_todo_default_templates/i.test(message)) {
      return { data: [], error: TODO_SQL_HINT };
    }
    return { data: [], error: message };
  }

  return {
    data: (data ?? []).map((row) => normalizeCrmTodoDefaultTemplate(row as Record<string, unknown>)),
    error: null
  };
}

export async function createCrmTodoDefaultTemplate(
  title: string,
  userId?: string | null
): Promise<{ data: CrmTodoDefaultTemplate | null; error: string | null }> {
  const trimmed = title.trim();
  if (!trimmed) {
    return { data: null, error: "Enter a default task title." };
  }

  const { data: auth } = await supabase.auth.getUser();
  const callerId = auth.user?.id;
  if (!callerId) {
    return { data: null, error: "Sign in to add default tasks." };
  }

  const targetUserId = userId ?? callerId;
  const existing = await fetchCrmTodoDefaultTemplates(targetUserId);
  if (existing.error) {
    return { data: null, error: existing.error };
  }

  const maxSort = existing.data.reduce((max, item) => Math.max(max, item.sort_order), -1);

  const { data, error } = await supabase
    .from("crm_todo_default_templates")
    .insert({
      user_id: targetUserId,
      title: trimmed,
      sort_order: maxSort + 1
    })
    .select(TODO_TEMPLATE_SELECT)
    .single();

  if (error) {
    if (error.code === "23505") {
      return { data: null, error: "That default task already exists." };
    }
    return { data: null, error: friendlyError(error) };
  }

  return { data: normalizeCrmTodoDefaultTemplate(data as Record<string, unknown>), error: null };
}

export async function updateCrmTodoDefaultTemplate(
  id: string,
  title: string
): Promise<{ error: string | null }> {
  const trimmed = title.trim();
  if (!trimmed) {
    return { error: "Enter a default task title." };
  }

  const { error } = await supabase
    .from("crm_todo_default_templates")
    .update({ title: trimmed })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") {
      return { error: "That default task title already exists." };
    }
    return { error: friendlyError(error) };
  }
  return { error: null };
}

export async function deleteCrmTodoDefaultTemplate(id: string): Promise<{ error: string | null }> {
  const { data: deletedRows, error } = await supabase
    .from("crm_todo_default_templates")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) {
    return { error: friendlyError(error) };
  }
  if (!deletedRows?.length) {
    return { error: "Could not remove this default task." };
  }
  return { error: null };
}

const CUSTOMER_TASK_SELECT =
  "id, customer_id, task_type, task_date, task_time, title, notes, assigned_to, assigned_to_email, created_by, completed_at, created_at";

type CustomerTaskRow = Record<string, unknown> & {
  crm_customers?: { display_name: string } | { display_name: string }[] | null;
};

export function normalizeTaskDate(raw: string): string {
  const trimmed = raw.trim();
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }
  return trimmed.slice(0, 10);
}

export function normalizeTaskTime(raw: string): string {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed) {
    return "";
  }

  const isoTime = trimmed.match(/T(\d{1,2}):(\d{2})(?::\d{2})?/);
  if (isoTime) {
    return `${String(Number(isoTime[1])).padStart(2, "0")}:${isoTime[2]}`;
  }

  if (/^\d{1,2}:\d{2}$/.test(trimmed)) {
    const [hour, minute] = trimmed.split(":");
    return `${String(Number(hour)).padStart(2, "0")}:${minute}`;
  }

  const timeMatch = trimmed.match(/(\d{1,2}):(\d{2})(?::\d{2})?/);
  if (timeMatch) {
    return `${String(Number(timeMatch[1])).padStart(2, "0")}:${timeMatch[2]}`;
  }

  return trimmed;
}

export function isCustomerTaskComplete(completedAt: string | null | undefined): boolean {
  return completedAt != null && String(completedAt).trim() !== "";
}

function normalizeCrmCustomerTask(row: CustomerTaskRow): CrmCustomerTask {
  const customerJoin = row.crm_customers;
  let customerDisplayName: string | null = null;
  if (Array.isArray(customerJoin)) {
    customerDisplayName = customerJoin[0]?.display_name ?? null;
  } else if (customerJoin && typeof customerJoin === "object") {
    customerDisplayName = (customerJoin as { display_name: string }).display_name ?? null;
  }

  return {
    id: String(row.id),
    customer_id: String(row.customer_id),
    customer_display_name: customerDisplayName,
    task_type: row.task_type as CrmCustomerTaskType,
    task_date: normalizeTaskDate(String(row.task_date)),
    task_time: normalizeTaskTime(String(row.task_time ?? "")),
    title: String(row.title),
    notes: row.notes != null ? String(row.notes) : null,
    assigned_to: String(row.assigned_to),
    assigned_to_email: row.assigned_to_email != null ? String(row.assigned_to_email) : null,
    created_by: String(row.created_by),
    completed_at:
      row.completed_at != null && String(row.completed_at).trim() !== ""
        ? String(row.completed_at)
        : null,
    created_at: String(row.created_at)
  };
}

export function buildCustomerTaskTitle(taskType: CrmCustomerTaskType, customerDisplayName: string): string {
  const name = customerDisplayName.trim() || "Customer";
  switch (taskType) {
    case "call":
      return `Call — ${name}`;
    case "appointment":
      return `Appointment — ${name}`;
    default:
      return `Task — ${name}`;
  }
}

export function buildTaskTimeOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  for (let hour = 0; hour < 24; hour += 1) {
    for (let minute = 0; minute < 60; minute += 15) {
      const value = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
      const hour12 = hour % 12 || 12;
      const ampm = hour < 12 ? "AM" : "PM";
      const label = `${hour12}:${String(minute).padStart(2, "0")} ${ampm}`;
      options.push({ value, label });
    }
  }
  return options;
}

export function defaultCustomerTaskTime(): string {
  const now = new Date();
  const minutes = now.getMinutes();
  const nextSlot = Math.ceil((minutes + 1) / 15) * 15;
  const slotDate = new Date(now);
  slotDate.setMinutes(nextSlot, 0, 0);
  if (slotDate.getHours() < 9) {
    return "09:00";
  }
  if (slotDate.getHours() >= 18 && slotDate.getMinutes() > 0) {
    return "09:00";
  }
  return `${String(slotDate.getHours()).padStart(2, "0")}:${String(slotDate.getMinutes()).padStart(2, "0")}`;
}

export function formatCustomerTaskTime(time: string): string {
  const normalized = normalizeTaskTime(time);
  const [hourStr, minuteStr] = normalized.split(":");
  const hour = Number(hourStr);
  const minute = Number(minuteStr);
  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return normalized;
  }
  const hour12 = hour % 12 || 12;
  const ampm = hour < 12 ? "AM" : "PM";
  return `${hour12}:${String(minute).padStart(2, "0")} ${ampm}`;
}

export async function fetchCrmCustomerTasksForCustomer(customerId: string): Promise<{
  data: CrmCustomerTask[];
  error: string | null;
}> {
  const { data, error } = await supabase
    .from("crm_customer_tasks")
    .select(CUSTOMER_TASK_SELECT)
    .eq("customer_id", customerId)
    .order("task_date", { ascending: false })
    .order("task_time", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    return { data: [], error: friendlyError(error) };
  }
  return {
    data: (data ?? []).map((row) => normalizeCrmCustomerTask(row as CustomerTaskRow)),
    error: null
  };
}

export async function fetchCrmCustomerTasksForAssigneeFilter(
  range: CrmDateRange,
  filter: string,
  meId: string | null
): Promise<{ data: CrmCustomerTask[]; error: string | null }> {
  const normalized = normalizeCrmDateRange(range.from, range.to);

  if (filter === "unassigned") {
    return { data: [], error: null };
  }

  let query = supabase
    .from("crm_customer_tasks")
    .select(`${CUSTOMER_TASK_SELECT}, crm_customers(display_name)`)
    .gte("task_date", normalized.from)
    .lte("task_date", normalized.to)
    .is("completed_at", null)
    .order("task_date", { ascending: true })
    .order("task_time", { ascending: true })
    .order("created_at", { ascending: true });

  if (filter === "me") {
    if (!meId) {
      return { data: [], error: null };
    }
    query = query.eq("assigned_to", meId);
  } else if (filter !== "all") {
    query = query.eq("assigned_to", filter);
  }

  const { data, error } = await query;

  if (error) {
    return { data: [], error: friendlyError(error) };
  }
  return {
    data: (data ?? []).map((row) => normalizeCrmCustomerTask(row as CustomerTaskRow)),
    error: null
  };
}

export async function fetchCrmCustomerTasksForUser(
  userId: string,
  range: CrmDateRange
): Promise<{ data: CrmCustomerTask[]; error: string | null }> {
  return fetchCrmCustomerTasksForAssigneeFilter(range, userId, userId);
}

export async function createCrmCustomerTask(input: {
  customer_id: string;
  customer_display_name: string;
  task_type: CrmCustomerTaskType;
  task_date: string;
  task_time: string;
  notes?: string | null;
  assigned_to: string;
  assigned_to_email: string | null;
}): Promise<{ data: CrmCustomerTask | null; error: string | null }> {
  const title = buildCustomerTaskTitle(input.task_type, input.customer_display_name);
  const notes = input.notes?.trim() || null;

  const { data, error } = await supabase
    .from("crm_customer_tasks")
    .insert({
      customer_id: input.customer_id,
      task_type: input.task_type,
      task_date: input.task_date,
      task_time: `${normalizeTaskTime(input.task_time)}:00`,
      title,
      notes,
      assigned_to: input.assigned_to,
      assigned_to_email: input.assigned_to_email
    })
    .select(CUSTOMER_TASK_SELECT)
    .single();

  if (error) {
    return { data: null, error: friendlyError(error) };
  }
  return { data: normalizeCrmCustomerTask(data as CustomerTaskRow), error: null };
}

export async function updateCrmCustomerTask(
  id: string,
  patch: {
    task_type?: CrmCustomerTaskType;
    task_date?: string;
    task_time?: string;
    notes?: string | null;
    assigned_to?: string;
    assigned_to_email?: string | null;
    customer_display_name?: string;
  }
): Promise<{ error: string | null }> {
  const update: Record<string, unknown> = {};
  if (patch.task_date != null) {
    update.task_date = patch.task_date;
  }
  if (patch.task_time != null) {
    update.task_time = `${normalizeTaskTime(patch.task_time)}:00`;
  }
  if (patch.notes !== undefined) {
    update.notes = patch.notes?.trim() || null;
  }
  if (patch.assigned_to != null) {
    update.assigned_to = patch.assigned_to;
    update.assigned_to_email = patch.assigned_to_email ?? null;
  }
  if (patch.task_type != null && patch.customer_display_name != null) {
    update.task_type = patch.task_type;
    update.title = buildCustomerTaskTitle(patch.task_type, patch.customer_display_name);
  }

  const { error } = await supabase.from("crm_customer_tasks").update(update).eq("id", id);
  if (error) {
    return { error: friendlyError(error) };
  }
  return { error: null };
}

export async function toggleCrmCustomerTask(
  id: string,
  completed: boolean
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("crm_customer_tasks")
    .update({ completed_at: completed ? new Date().toISOString() : null })
    .eq("id", id);

  if (error) {
    return { error: friendlyError(error) };
  }
  return { error: null };
}

export async function deleteCrmCustomerTask(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from("crm_customer_tasks").delete().eq("id", id);
  if (error) {
    return { error: friendlyError(error) };
  }
  return { error: null };
}

export async function countIncompleteCrmCustomerTasksForUser(
  userId: string,
  taskDate: string
): Promise<{ count: number; error: string | null }> {
  const { count, error } = await supabase
    .from("crm_customer_tasks")
    .select("id", { count: "exact", head: true })
    .eq("assigned_to", userId)
    .eq("task_date", taskDate)
    .is("completed_at", null);

  if (error) {
    return { count: 0, error: friendlyError(error) };
  }
  return { count: count ?? 0, error: null };
}

export async function countIncompleteUpcomingCrmCustomerTasksForUser(
  userId: string,
  fromDate: string = crmTodoLocalDate()
): Promise<{ count: number; error: string | null }> {
  const { count, error } = await supabase
    .from("crm_customer_tasks")
    .select("id", { count: "exact", head: true })
    .eq("assigned_to", userId)
    .gte("task_date", fromDate)
    .is("completed_at", null);

  if (error) {
    return { count: 0, error: friendlyError(error) };
  }
  return { count: count ?? 0, error: null };
}

export async function fetchCrmOrgBranding(): Promise<{
  accentColor: string | null;
  colorMode: string | null;
  backgroundImagePath: string | null;
  headerIconPath: string | null;
  headerTitle: string | null;
  headerSubtitle: string | null;
  footerText: string | null;
  appVersion: string | null;
  buttonShape: string | null;
  fieldShape: string | null;
  tabShape: string | null;
  tabIdleStyle: string | null;
  tabActiveStyle: string | null;
  buttonPrimaryStyle: string | null;
  pageOutlineShape: string | null;
  headerLayout: string | null;
  headerLogoAlign: string | null;
  headerTitleAlign: string | null;
  sidebarPanelStyle: string | null;
  scrollbarStyle: string | null;
  scrollbarShape: string | null;
  scrollbarWidth: string | null;
  labelColors: unknown | null;
  updatedAt: string | null;
  error: string | null;
}> {
  const { data, error } = await supabase
    .from("crm_org_settings")
    .select(
      "accent_color, color_mode, background_image_path, header_icon_path, header_title, header_subtitle, footer_text, app_version, button_shape, field_shape, tab_shape, tab_idle_style, tab_active_style, button_primary_style, page_outline_shape, header_layout, header_logo_align, header_title_align, sidebar_panel_style, scrollbar_style, scrollbar_shape, scrollbar_width, label_colors, updated_at"
    )
    .eq("id", "default")
    .maybeSingle();

  if (error) {
    return {
      accentColor: null,
      colorMode: null,
      backgroundImagePath: null,
      headerIconPath: null,
      headerTitle: null,
      headerSubtitle: null,
      footerText: null,
      appVersion: null,
      buttonShape: null,
      fieldShape: null,
      tabShape: null,
      tabIdleStyle: null,
      tabActiveStyle: null,
      buttonPrimaryStyle: null,
      pageOutlineShape: null,
      headerLayout: null,
      headerLogoAlign: null,
      headerTitleAlign: null,
      sidebarPanelStyle: null,
      scrollbarStyle: null,
      scrollbarShape: null,
      scrollbarWidth: null,
      labelColors: null,
      updatedAt: null,
      error: friendlyError(error)
    };
  }

  return {
    accentColor: data?.accent_color ? String(data.accent_color) : null,
    colorMode: data?.color_mode ? String(data.color_mode) : null,
    backgroundImagePath: data?.background_image_path ? String(data.background_image_path) : null,
    headerIconPath: data?.header_icon_path ? String(data.header_icon_path) : null,
    headerTitle: data?.header_title != null ? String(data.header_title) : null,
    headerSubtitle: data?.header_subtitle != null ? String(data.header_subtitle) : null,
    footerText: data?.footer_text != null ? String(data.footer_text) : null,
    appVersion: data?.app_version != null ? String(data.app_version) : null,
    buttonShape: data?.button_shape ? String(data.button_shape) : null,
    fieldShape: data?.field_shape ? String(data.field_shape) : null,
    tabShape: data?.tab_shape ? String(data.tab_shape) : null,
    tabIdleStyle: data?.tab_idle_style ? String(data.tab_idle_style) : null,
    tabActiveStyle: data?.tab_active_style ? String(data.tab_active_style) : null,
    buttonPrimaryStyle: data?.button_primary_style ? String(data.button_primary_style) : null,
    pageOutlineShape: data?.page_outline_shape ? String(data.page_outline_shape) : null,
    headerLayout: data?.header_layout ? String(data.header_layout) : null,
    headerLogoAlign: data?.header_logo_align ? String(data.header_logo_align) : null,
    headerTitleAlign: data?.header_title_align ? String(data.header_title_align) : null,
    sidebarPanelStyle: data?.sidebar_panel_style ? String(data.sidebar_panel_style) : null,
    scrollbarStyle: data?.scrollbar_style ? String(data.scrollbar_style) : null,
    scrollbarShape: data?.scrollbar_shape ? String(data.scrollbar_shape) : null,
    scrollbarWidth: data?.scrollbar_width ? String(data.scrollbar_width) : null,
    labelColors: data?.label_colors ?? null,
    updatedAt: data?.updated_at ? String(data.updated_at) : null,
    error: null
  };
}

export async function updateCrmLabelColors(labelColors: Record<string, unknown> | null): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("crm_org_settings")
    .update({
      label_colors: labelColors,
      updated_at: new Date().toISOString()
    })
    .eq("id", "default");

  if (error) {
    return { error: friendlyError(error) };
  }
  return { error: null };
}

/** @deprecated Prefer fetchCrmOrgBranding */
export async function fetchCrmThemeAccentColor(): Promise<{
  accentColor: string | null;
  error: string | null;
}> {
  const result = await fetchCrmOrgBranding();
  return { accentColor: result.accentColor, error: result.error };
}

export async function updateCrmThemeAccentColor(accentColor: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("crm_org_settings")
    .update({
      accent_color: accentColor,
      updated_at: new Date().toISOString()
    })
    .eq("id", "default");

  if (error) {
    return { error: friendlyError(error) };
  }
  return { error: null };
}

export async function updateCrmColorMode(colorMode: "dark" | "light"): Promise<{ error: string | null }> {
  const mode = colorMode === "light" ? "light" : "dark";
  const { error } = await supabase
    .from("crm_org_settings")
    .update({
      color_mode: mode,
      updated_at: new Date().toISOString()
    })
    .eq("id", "default");

  if (error) {
    return { error: friendlyError(error) };
  }
  return { error: null };
}

export async function updateCrmHeaderCopy(input: {
  headerTitle: string;
  headerSubtitle: string;
}): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("crm_org_settings")
    .update({
      header_title: input.headerTitle,
      header_subtitle: input.headerSubtitle,
      updated_at: new Date().toISOString()
    })
    .eq("id", "default");

  if (error) {
    return { error: friendlyError(error) };
  }
  return { error: null };
}

export async function updateCrmControlStyle(input: {
  buttonShape: string;
  fieldShape: string;
  tabShape: string;
  tabIdleStyle: string;
  tabActiveStyle: string;
  buttonPrimaryStyle: string;
  pageOutlineShape: string;
  headerLayout: string;
  headerLogoAlign: string;
  headerTitleAlign: string;
  sidebarPanelStyle: string;
  scrollbarStyle: string;
  scrollbarShape: string;
  scrollbarWidth: string;
}): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("crm_org_settings")
    .update({
      button_shape: input.buttonShape,
      field_shape: input.fieldShape,
      tab_shape: input.tabShape,
      tab_idle_style: input.tabIdleStyle,
      tab_active_style: input.tabActiveStyle,
      button_primary_style: input.buttonPrimaryStyle,
      page_outline_shape: input.pageOutlineShape,
      header_layout: input.headerLayout,
      header_logo_align: input.headerLogoAlign,
      header_title_align: input.headerTitleAlign,
      sidebar_panel_style: input.sidebarPanelStyle,
      scrollbar_style: input.scrollbarStyle,
      scrollbar_shape: input.scrollbarShape,
      scrollbar_width: input.scrollbarWidth,
      updated_at: new Date().toISOString()
    })
    .eq("id", "default");

  if (error) {
    return { error: friendlyError(error) };
  }
  return { error: null };
}

export async function fetchCrmOrgVoiceSettings(): Promise<{
  inboundFallbackCallbackPhone: string | null;
  recordingDisclosureEnabled: boolean;
  recordingDisclosureText: string;
  error: string | null;
}> {
  const { data, error } = await supabase
    .from("crm_org_settings")
    .select(
      "inbound_fallback_callback_phone, twilio_recording_disclosure_enabled, twilio_recording_disclosure_text"
    )
    .eq("id", "default")
    .maybeSingle();

  if (error) {
    return {
      inboundFallbackCallbackPhone: null,
      recordingDisclosureEnabled: true,
      recordingDisclosureText: "",
      error: friendlyError(error)
    };
  }

  return {
    inboundFallbackCallbackPhone: data?.inbound_fallback_callback_phone
      ? String(data.inbound_fallback_callback_phone)
      : null,
    recordingDisclosureEnabled: data?.twilio_recording_disclosure_enabled !== false,
    recordingDisclosureText:
      data?.twilio_recording_disclosure_text != null
        ? String(data.twilio_recording_disclosure_text)
        : "This call may be recorded for quality and training purposes.",
    error: null
  };
}

export async function updateCrmOrgVoiceSettings(input: {
  inboundFallbackCallbackPhone: string | null;
  recordingDisclosureEnabled: boolean;
  recordingDisclosureText: string;
}): Promise<{ error: string | null }> {
  let fallbackPhone: string | null = null;
  if (input.inboundFallbackCallbackPhone?.trim()) {
    const normalized = normalizePhoneForStorage(input.inboundFallbackCallbackPhone);
    if (normalized.error) {
      return { error: normalized.error };
    }
    fallbackPhone = normalized.value;
  }

  const disclosureText = input.recordingDisclosureText.trim();
  const { error } = await supabase
    .from("crm_org_settings")
    .update({
      inbound_fallback_callback_phone: fallbackPhone,
      twilio_recording_disclosure_enabled: input.recordingDisclosureEnabled,
      twilio_recording_disclosure_text:
        disclosureText || "This call may be recorded for quality and training purposes.",
      updated_at: new Date().toISOString()
    })
    .eq("id", "default");

  if (error) {
    return { error: friendlyError(error) };
  }
  return { error: null };
}

export async function fetchCrmOrgFinanceSettings(): Promise<{
  financeEnabled: boolean;
  error: string | null;
}> {
  const { data, error } = await supabase
    .from("crm_org_settings")
    .select("finance_enabled")
    .eq("id", "default")
    .maybeSingle();

  if (error) {
    return { financeEnabled: true, error: friendlyError(error) };
  }

  return {
    financeEnabled: data?.finance_enabled !== false,
    error: null
  };
}

export async function updateCrmOrgFinanceEnabled(financeEnabled: boolean): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("crm_org_settings")
    .update({
      finance_enabled: financeEnabled,
      updated_at: new Date().toISOString()
    })
    .eq("id", "default");

  if (error) {
    return { error: friendlyError(error) };
  }
  return { error: null };
}

export async function fetchCrmOrgAdminWhitelistSettings(): Promise<{
  adminWhitelistEnabled: boolean;
  error: string | null;
}> {
  const { data, error } = await supabase
    .from("crm_org_settings")
    .select("admin_whitelist_enabled")
    .eq("id", "default")
    .maybeSingle();

  if (error) {
    return { adminWhitelistEnabled: false, error: friendlyError(error) };
  }

  return {
    adminWhitelistEnabled: data?.admin_whitelist_enabled === true,
    error: null
  };
}

export async function updateCrmOrgAdminWhitelistEnabled(
  adminWhitelistEnabled: boolean
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("crm_org_settings")
    .update({
      admin_whitelist_enabled: adminWhitelistEnabled,
      updated_at: new Date().toISOString()
    })
    .eq("id", "default");

  if (error) {
    return { error: friendlyError(error) };
  }
  return { error: null };
}

export async function fetchCrmOrgPipelineCallSettings(): Promise<{
  outboundCallPipelineStageEnabled: boolean;
  outboundCallPipelineStage: string | null;
  error: string | null;
}> {
  const { data, error } = await supabase
    .from("crm_org_settings")
    .select("outbound_call_pipeline_stage_enabled, outbound_call_pipeline_stage")
    .eq("id", "default")
    .maybeSingle();

  if (error) {
    return {
      outboundCallPipelineStageEnabled: false,
      outboundCallPipelineStage: null,
      error: friendlyError(error)
    };
  }

  return {
    outboundCallPipelineStageEnabled: data?.outbound_call_pipeline_stage_enabled === true,
    outboundCallPipelineStage: data?.outbound_call_pipeline_stage
      ? String(data.outbound_call_pipeline_stage)
      : null,
    error: null
  };
}

export async function updateCrmOrgPipelineCallSettings(input: {
  outboundCallPipelineStageEnabled: boolean;
  outboundCallPipelineStage: string | null;
}): Promise<{ error: string | null }> {
  const stageSlug = input.outboundCallPipelineStage?.trim() ?? "";

  if (input.outboundCallPipelineStageEnabled) {
    if (!stageSlug) {
      return { error: "Choose a pipeline stage or turn off auto-assign." };
    }
    const { data: stageRow, error: stageError } = await supabase
      .from("crm_pipeline_stages")
      .select("slug, is_selectable")
      .eq("slug", stageSlug)
      .maybeSingle();
    if (stageError) {
      return { error: friendlyError(stageError) };
    }
    if (!stageRow || stageRow.is_selectable !== true) {
      return { error: "Choose a valid selectable pipeline stage." };
    }
  }

  const { error } = await supabase
    .from("crm_org_settings")
    .update({
      outbound_call_pipeline_stage_enabled: input.outboundCallPipelineStageEnabled,
      outbound_call_pipeline_stage: stageSlug || null,
      updated_at: new Date().toISOString()
    })
    .eq("id", "default");

  if (error) {
    return { error: friendlyError(error) };
  }
  return { error: null };
}

export async function uploadCrmBrandingPng(
  kind: "background" | "header_icon",
  file: File
): Promise<{ path: string | null; error: string | null }> {
  const validationError = validateCrmBrandingPng(file);
  if (validationError) {
    return { path: null, error: validationError };
  }

  const path = CRM_BRANDING_STORAGE_PATHS[kind];

  const { error: uploadError } = await supabase.storage.from(CRM_BRANDING_BUCKET).upload(path, file, {
    upsert: true,
    contentType: "image/png",
    cacheControl: "3600"
  });

  if (uploadError) {
    return { path: null, error: friendlyError(uploadError) };
  }

  const column = kind === "background" ? "background_image_path" : "header_icon_path";
  const { error: dbError } = await supabase
    .from("crm_org_settings")
    .update({
      [column]: path,
      updated_at: new Date().toISOString()
    })
    .eq("id", "default");

  if (dbError) {
    return { path: null, error: friendlyError(dbError) };
  }

  return { path, error: null };
}

/** Re-upload bundled tenant seed PNGs and point crm_org_settings at default/ paths. */
export async function restoreCrmBrandingAsset(
  kind: "background" | "header_icon"
): Promise<{ error: string | null }> {
  const path = CRM_BRANDING_STORAGE_PATHS[kind];
  const column = kind === "background" ? "background_image_path" : "header_icon_path";

  let file: File;
  try {
    file = await loadTenantDefaultBrandingFile(kind);
  } catch {
    return { error: "Could not load tenant default branding image." };
  }

  const validationError = validateCrmBrandingPng(file);
  if (validationError) {
    return { error: validationError };
  }

  const { error: uploadError } = await supabase.storage.from(CRM_BRANDING_BUCKET).upload(path, file, {
    upsert: true,
    contentType: "image/png",
    cacheControl: "3600"
  });

  if (uploadError) {
    return { error: friendlyError(uploadError) };
  }

  const { error: dbError } = await supabase
    .from("crm_org_settings")
    .update({
      [column]: path,
      updated_at: new Date().toISOString()
    })
    .eq("id", "default");

  if (dbError) {
    return { error: friendlyError(dbError) };
  }

  return { error: null };
}

/** Restore every branding field and both PNG assets to repo/playground master defaults. */
export async function restoreCrmOrgBrandingDefaults(): Promise<{ error: string | null }> {
  const defaults = crmTenantDefaultBrandingRecord();
  const style = defaults.controlStyle;

  for (const kind of ["background", "header_icon"] as const) {
    const assetResult = await restoreCrmBrandingAsset(kind);
    if (assetResult.error) {
      return assetResult;
    }
  }

  const { error } = await supabase
    .from("crm_org_settings")
    .update({
      accent_color: defaults.accentColor,
      color_mode: defaults.colorMode,
      header_title: defaults.headerTitle,
      header_subtitle: defaults.headerSubtitle,
      footer_text: defaults.footerText,
      app_version: defaults.appVersion,
      background_image_path: defaults.backgroundImagePath,
      header_icon_path: defaults.headerIconPath,
      button_shape: style.buttonShape,
      field_shape: style.fieldShape,
      tab_shape: style.tabShape,
      tab_idle_style: style.tabIdleStyle,
      tab_active_style: style.tabActiveStyle,
      button_primary_style: style.buttonPrimaryStyle,
      page_outline_shape: style.pageOutlineShape,
      header_layout: style.headerLayout,
      header_logo_align: style.headerLogoAlign,
      header_title_align: style.headerTitleAlign,
      sidebar_panel_style: style.sidebarPanelStyle,
      scrollbar_style: style.scrollbarStyle,
      scrollbar_shape: style.scrollbarShape,
      scrollbar_width: style.scrollbarWidth,
      label_colors: defaults.labelColors,
      updated_at: new Date().toISOString()
    })
    .eq("id", "default");

  if (error) {
    return { error: friendlyError(error) };
  }

  return { error: null };
}

/** Branding safe to expose on the login screen (anon RPC). */
export async function fetchCrmPublicLoginBranding(): Promise<{
  accentColor: string;
  colorMode: "dark" | "light";
  headerTitle: string;
  headerSubtitle: string;
  error: string | null;
}> {
  const { data, error } = await supabase.rpc("crm_public_login_branding");

  if (error) {
    return {
      accentColor: "",
      colorMode: "dark",
      headerTitle: "",
      headerSubtitle: "",
      error: friendlyError(error)
    };
  }

  const parsed = parseCrmPublicLoginBranding(data);
  if (!parsed) {
    return {
      accentColor: "",
      colorMode: "dark",
      headerTitle: "",
      headerSubtitle: "",
      error: "Could not read login branding."
    };
  }

  return {
    accentColor: parsed.accentColor,
    colorMode: parsed.colorMode,
    headerTitle: parsed.headerTitle,
    headerSubtitle: parsed.headerSubtitle,
    error: null
  };
}

/** @deprecated Use restoreCrmBrandingAsset */
export const clearCrmBrandingAsset = restoreCrmBrandingAsset;

export async function fetchCrmPipelineStages(): Promise<{
  data: CrmPipelineStageConfig[];
  error: string | null;
}> {
  const { data, error } = await supabase
    .from("crm_pipeline_stages")
    .select(PIPELINE_STAGE_SELECT)
    .order("sort_order", { ascending: true })
    .order("slug", { ascending: true });

  if (error) {
    return { data: [], error: friendlyError(error) };
  }

  return {
    data: (data ?? []).map((row) => normalizePipelineStageRow(row as Record<string, unknown>)),
    error: null
  };
}

export async function countCustomersOnPipelineStage(slug: string): Promise<{ count: number; error: string | null }> {
  const { count, error } = await supabase
    .from("crm_customers")
    .select("id", { count: "exact", head: true })
    .eq("pipeline_stage", slug);

  if (error) {
    return { count: 0, error: friendlyError(error) };
  }
  return { count: count ?? 0, error: null };
}

export async function createCrmPipelineStage(input: {
  label: string;
  color: string;
  existingStages: CrmPipelineStageConfig[];
}): Promise<{ data: CrmPipelineStageConfig | null; error: string | null }> {
  const label = input.label.trim();
  if (!label) {
    return { data: null, error: "Enter a stage name." };
  }
  const color = normalizeHexColor(input.color);
  if (!color) {
    return { data: null, error: "Enter a valid 6-digit hex color." };
  }

  const slug = uniquePipelineSlug(label, input.existingStages);
  const sort_order = nextPipelineSortOrder(input.existingStages);
  const { data, error } = await supabase
    .from("crm_pipeline_stages")
    .insert({
      slug,
      label,
      color,
      sort_order,
      is_system: false,
      is_selectable: true,
      requires_credit_app: false,
      updated_at: new Date().toISOString()
    })
    .select(PIPELINE_STAGE_SELECT)
    .single();

  if (error) {
    return { data: null, error: friendlyError(error) };
  }
  return { data: normalizePipelineStageRow(data as Record<string, unknown>), error: null };
}

export async function updateCrmPipelineStage(
  slug: string,
  patch: Partial<Pick<CrmPipelineStageConfig, "label" | "color" | "sort_order" | "requires_credit_app">>
): Promise<{ error: string | null }> {
  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString()
  };
  if (patch.label !== undefined) {
    const label = patch.label.trim();
    if (!label) {
      return { error: "Enter a stage name." };
    }
    payload.label = label;
  }
  if (patch.color !== undefined) {
    const color = normalizeHexColor(patch.color);
    if (!color) {
      return { error: "Enter a valid 6-digit hex color." };
    }
    payload.color = color;
  }
  if (patch.sort_order !== undefined) {
    payload.sort_order = patch.sort_order;
  }
  if (patch.requires_credit_app !== undefined) {
    payload.requires_credit_app = patch.requires_credit_app;
  }

  const { error } = await supabase.from("crm_pipeline_stages").update(payload).eq("slug", slug);
  if (error) {
    return { error: friendlyError(error) };
  }
  return { error: null };
}

export async function reorderCrmPipelineStages(
  orderedSlugs: string[]
): Promise<{ error: string | null }> {
  const updates = orderedSlugs.map((slug, index) =>
    supabase
      .from("crm_pipeline_stages")
      .update({ sort_order: (index + 1) * 10, updated_at: new Date().toISOString() })
      .eq("slug", slug)
  );
  const results = await Promise.all(updates);
  const failed = results.find((result) => result.error);
  if (failed?.error) {
    return { error: friendlyError(failed.error) };
  }
  return { error: null };
}

export async function deleteCrmPipelineStage(input: {
  slug: string;
  reassignToSlug?: string;
}): Promise<{ error: string | null }> {
  const { count, error: countError } = await countCustomersOnPipelineStage(input.slug);
  if (countError) {
    return { error: countError };
  }
  if (count > 0) {
    const reassignTo = String(input.reassignToSlug ?? "").trim();
    if (!reassignTo) {
      return {
        error: `${count} customer${count === 1 ? "" : "s"} still use this stage. Choose a stage to move them to before deleting.`
      };
    }
    if (reassignTo === input.slug) {
      return { error: "Choose a different stage to reassign customers to." };
    }
    const { error: reassignError } = await supabase
      .from("crm_customers")
      .update({ pipeline_stage: reassignTo })
      .eq("pipeline_stage", input.slug);
    if (reassignError) {
      return { error: friendlyError(reassignError) };
    }
  }

  const { error } = await supabase.from("crm_pipeline_stages").delete().eq("slug", input.slug);
  if (error) {
    return { error: friendlyError(error) };
  }
  return { error: null };
}

export async function fetchCrmDirectoryGroups(): Promise<{
  data: CrmDirectoryGroup[];
  error: string | null;
  tableAvailable: boolean;
}> {
  const { data, error } = await supabase
    .from("crm_directory_groups")
    .select(DIRECTORY_GROUP_SELECT)
    .order("rank", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("slug", { ascending: true });

  if (error) {
    if (isMissingRelationError(error, "crm_directory_groups")) {
      return { data: [], error: null, tableAvailable: false };
    }
    return { data: [], error: friendlyError(error), tableAvailable: false };
  }

  return {
    data: (data ?? []).map((row) => normalizeDirectoryGroupRow(row as Record<string, unknown>)),
    error: null,
    tableAvailable: true
  };
}

export async function createCrmDirectoryGroup(input: {
  label: string;
  existingGroups: CrmDirectoryGroup[];
}): Promise<{ data: CrmDirectoryGroup | null; error: string | null }> {
  const label = input.label.trim();
  if (!label) {
    return { data: null, error: "Enter a group name." };
  }

  const slug = uniqueDirectoryGroupSlug(label, input.existingGroups);
  const rank = nextDirectoryGroupRank(input.existingGroups);
  const sort_order = (input.existingGroups.length + 1) * 10;
  const { data, error } = await supabase
    .from("crm_directory_groups")
    .insert({
      slug,
      label,
      rank,
      sort_order,
      is_default: false,
      updated_at: new Date().toISOString()
    })
    .select(DIRECTORY_GROUP_SELECT)
    .single();

  if (error) {
    return { data: null, error: friendlyError(error) };
  }
  return { data: normalizeDirectoryGroupRow(data as Record<string, unknown>), error: null };
}

export async function updateCrmDirectoryGroup(
  slug: string,
  patch: Partial<Pick<CrmDirectoryGroup, "label" | "rank" | "sort_order">>
): Promise<{ error: string | null }> {
  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString()
  };
  if (patch.label !== undefined) {
    const label = patch.label.trim();
    if (!label) {
      return { error: "Enter a group name." };
    }
    payload.label = label;
  }
  if (patch.rank !== undefined) {
    payload.rank = patch.rank;
  }
  if (patch.sort_order !== undefined) {
    payload.sort_order = patch.sort_order;
  }

  const { error } = await supabase.from("crm_directory_groups").update(payload).eq("slug", slug);
  if (error) {
    return { error: friendlyError(error) };
  }
  return { error: null };
}

export async function countDirectoryUsersOnPosition(slug: string): Promise<{ count: number; error: string | null }> {
  const { count, error } = await supabase
    .from("crm_user_directory")
    .select("user_id", { count: "exact", head: true })
    .eq("position", slug);

  if (error) {
    return { count: 0, error: friendlyError(error) };
  }
  return { count: count ?? 0, error: null };
}

export async function setCrmDirectoryDefaultGroup(slug: string): Promise<{ error: string | null }> {
  const trimmed = slug.trim();
  if (!trimmed) {
    return { error: "Choose a group." };
  }

  const { error } = await supabase.rpc("set_crm_directory_default_group", { p_slug: trimmed });
  if (error) {
    return { error: friendlyError(error) };
  }
  return { error: null };
}

export async function deleteCrmDirectoryGroup(input: {
  slug: string;
  reassignToSlug?: string;
}): Promise<{ error: string | null }> {
  const { data: groupRow, error: groupError } = await supabase
    .from("crm_directory_groups")
    .select("is_default")
    .eq("slug", input.slug)
    .maybeSingle();

  if (groupError) {
    return { error: friendlyError(groupError) };
  }
  if (groupRow?.is_default) {
    return {
      error: "Choose a different default role for new team members before deleting this group."
    };
  }

  const { count, error: countError } = await countDirectoryUsersOnPosition(input.slug);
  if (countError) {
    return { error: countError };
  }
  if (count > 0) {
    const reassignTo = String(input.reassignToSlug ?? "").trim();
    if (!reassignTo) {
      return {
        error: `${count} team member${count === 1 ? "" : "s"} still use this group. Choose a group to move them to before deleting.`
      };
    }
    if (reassignTo === input.slug) {
      return { error: "Choose a different group to reassign team members to." };
    }
    const { error: reassignError } = await supabase
      .from("crm_user_directory")
      .update({ position: reassignTo, updated_at: new Date().toISOString() })
      .eq("position", input.slug);
    if (reassignError) {
      return { error: friendlyError(reassignError) };
    }
  }

  const { error: permDeleteError } = await supabase
    .from("crm_position_permissions")
    .delete()
    .eq("position", input.slug);
  if (permDeleteError) {
    return { error: friendlyError(permDeleteError) };
  }

  const { error } = await supabase.from("crm_directory_groups").delete().eq("slug", input.slug);
  if (error) {
    return { error: friendlyError(error) };
  }
  return { error: null };
}

export async function fetchCrmPermissionDefs(): Promise<{ data: CrmPermissionDef[]; error: string | null }> {
  const { data, error } = await supabase
    .from("crm_permission_defs")
    .select("key, label, description, group_key, group_label, sort_order")
    .order("sort_order", { ascending: true })
    .order("key", { ascending: true });

  if (error) {
    return { data: [], error: friendlyError(error) };
  }

  return { data: (data ?? []) as CrmPermissionDef[], error: null };
}

export async function fetchCrmPositionPermissionRows(): Promise<{
  data: { position: CrmDirectoryPosition; permission_key: string }[];
  error: string | null;
}> {
  const { data, error } = await supabase
    .from("crm_position_permissions")
    .select("position, permission_key")
    .order("position", { ascending: true });

  if (error) {
    return { data: [], error: friendlyError(error) };
  }

  return {
    data: (data ?? []).map((row) => ({
      position: String((row as { position: string }).position ?? "").trim(),
      permission_key: String((row as { permission_key: string }).permission_key)
    })),
    error: null
  };
}

export async function setCrmPositionPermissions(
  position: CrmDirectoryPosition,
  permissionKeys: string[]
): Promise<{ error: string | null }> {
  const uniqueKeys = [...new Set(permissionKeys.map((key) => key.trim()).filter(Boolean))];
  const { error: deleteError } = await supabase.from("crm_position_permissions").delete().eq("position", position);
  if (deleteError) {
    return { error: friendlyError(deleteError) };
  }
  if (uniqueKeys.length === 0) {
    return { error: null };
  }
  const { error: insertError } = await supabase.from("crm_position_permissions").insert(
    uniqueKeys.map((permission_key) => ({ position, permission_key }))
  );
  if (insertError) {
    return { error: friendlyError(insertError) };
  }
  return { error: null };
}

export async function updateDirectoryPermissionsAdmin(
  userId: string,
  isPermissionsAdmin: boolean
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("crm_user_directory")
    .update({
      is_permissions_admin: isPermissionsAdmin,
      updated_at: new Date().toISOString()
    })
    .eq("user_id", userId);

  if (error) {
    return { error: friendlyError(error) };
  }
  return { error: null };
}

function normalizeCrmLenderRow(row: Record<string, unknown>): CrmLenderConfig {
  return {
    slug: String(row.slug) as CrmLenderSlug,
    tier: String(row.tier) === "subprime" ? "subprime" : "prime",
    label: String(row.label ?? "").trim(),
    icon_domain: String(row.icon_domain ?? "").trim(),
    custom_icon_path: row.custom_icon_path ? String(row.custom_icon_path) : null,
    sort_order: Number(row.sort_order ?? 0),
    updated_at: row.updated_at ? String(row.updated_at) : undefined
  };
}

export function crmLenderIconStoragePath(slug: CrmLenderSlug): string {
  return `lenders/${slug}.png`;
}

export async function fetchCrmLenders(): Promise<{ data: CrmLenderConfig[]; error: string | null }> {
  const { data, error } = await supabase
    .from("crm_lenders")
    .select(LENDER_SELECT)
    .order("tier", { ascending: true })
    .order("sort_order", { ascending: true })
    .order("slug", { ascending: true });

  if (error) {
    return { data: [], error: friendlyError(error) };
  }

  return {
    data: (data ?? []).map((row) => normalizeCrmLenderRow(row as Record<string, unknown>)),
    error: null
  };
}

export async function updateCrmLender(
  slug: CrmLenderSlug,
  patch: Partial<Pick<CrmLenderConfig, "label" | "icon_domain">>
): Promise<{ error: string | null }> {
  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString()
  };

  if (patch.label !== undefined) {
    const label = patch.label.trim();
    if (!label) {
      return { error: "Enter a lender name." };
    }
    if (label.length > 80) {
      return { error: "Lender name must be 80 characters or fewer." };
    }
    payload.label = label;
  }

  if (patch.icon_domain !== undefined) {
    const iconDomain = normalizeLenderIconDomain(patch.icon_domain);
    if (!iconDomain) {
      return { error: "Enter a valid website domain for the logo lookup (for example td.com)." };
    }
    payload.icon_domain = iconDomain;
  }

  const { error } = await supabase.from("crm_lenders").update(payload).eq("slug", slug);
  if (error) {
    return { error: friendlyError(error) };
  }
  return { error: null };
}

export async function uploadCrmLenderIcon(
  slug: CrmLenderSlug,
  file: File
): Promise<{ path: string | null; error: string | null }> {
  const validationError = validateCrmBrandingPng(file);
  if (validationError) {
    return { path: null, error: validationError };
  }

  const path = crmLenderIconStoragePath(slug);
  const { error: uploadError } = await supabase.storage.from(CRM_BRANDING_BUCKET).upload(path, file, {
    upsert: true,
    contentType: "image/png",
    cacheControl: "3600"
  });

  if (uploadError) {
    return { path: null, error: friendlyError(uploadError) };
  }

  const { error: dbError } = await supabase
    .from("crm_lenders")
    .update({
      custom_icon_path: path,
      updated_at: new Date().toISOString()
    })
    .eq("slug", slug);

  if (dbError) {
    return { path: null, error: friendlyError(dbError) };
  }

  return { path, error: null };
}

export async function clearCrmLenderIcon(slug: CrmLenderSlug): Promise<{ error: string | null }> {
  const path = crmLenderIconStoragePath(slug);

  const { error: dbError } = await supabase
    .from("crm_lenders")
    .update({
      custom_icon_path: null,
      updated_at: new Date().toISOString()
    })
    .eq("slug", slug);

  if (dbError) {
    return { error: friendlyError(dbError) };
  }

  const { error: removeError } = await supabase.storage.from(CRM_BRANDING_BUCKET).remove([path]);
  if (removeError) {
    return { error: friendlyError(removeError) };
  }

  return { error: null };
}

export async function countCustomerLenderOutcomes(slug: CrmLenderSlug): Promise<{ count: number; error: string | null }> {
  const { count, error } = await supabase
    .from("crm_customer_lender_outcomes")
    .select("customer_id", { count: "exact", head: true })
    .eq("lender_slug", slug);

  if (error) {
    return { count: 0, error: friendlyError(error) };
  }
  return { count: count ?? 0, error: null };
}

export async function createCrmLender(input: {
  tier: CrmLenderTier;
  label: string;
  iconDomain: string;
  existingLenders: CrmLenderConfig[];
}): Promise<{ data: CrmLenderConfig | null; error: string | null }> {
  const label = input.label.trim();
  if (!label) {
    return { data: null, error: "Enter a lender name." };
  }
  if (label.length > 80) {
    return { data: null, error: "Lender name must be 80 characters or fewer." };
  }

  const iconDomain = normalizeLenderIconDomain(input.iconDomain);
  if (!iconDomain) {
    return { data: null, error: "Enter a valid website domain for the logo lookup (for example td.com)." };
  }

  const slug = uniqueLenderSlug(label, input.existingLenders);
  const sort_order = nextLenderSortOrder(input.existingLenders, input.tier);
  const { data, error } = await supabase
    .from("crm_lenders")
    .insert({
      slug,
      tier: input.tier,
      label,
      icon_domain: iconDomain,
      sort_order,
      updated_at: new Date().toISOString()
    })
    .select(LENDER_SELECT)
    .single();

  if (error) {
    return { data: null, error: friendlyError(error) };
  }
  return { data: normalizeCrmLenderRow(data as Record<string, unknown>), error: null };
}

export async function deleteCrmLender(slug: CrmLenderSlug): Promise<{ error: string | null }> {
  const path = crmLenderIconStoragePath(slug);
  const { data: lenderRow, error: fetchError } = await supabase
    .from("crm_lenders")
    .select("custom_icon_path")
    .eq("slug", slug)
    .maybeSingle();

  if (fetchError) {
    return { error: friendlyError(fetchError) };
  }

  const { error } = await supabase.from("crm_lenders").delete().eq("slug", slug);
  if (error) {
    return { error: friendlyError(error) };
  }

  if (lenderRow?.custom_icon_path) {
    const { error: removeError } = await supabase.storage.from(CRM_BRANDING_BUCKET).remove([path]);
    if (removeError) {
      return { error: friendlyError(removeError) };
    }
  }

  return { error: null };
}
