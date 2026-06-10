export type CrmActivityKind = "call" | "comment" | "text";

export type CrmCustomerStatus = "active" | "lost";

/** Uploaded document stored in Supabase Storage (`crm-credit-app-documents` bucket). */
export type CrmCreditAppAttachment = {
  storage_path: string;
  file_name: string;
  content_type: string;
  uploaded_at: string;
};

export type CrmCreditAppAttachmentField =
  | "drivers_license_file"
  | "paystubs_file"
  | "trade_registration_file";

export type CrmCustomer = {
  id: string;
  created_at: string;
  created_by: string | null;
  created_by_email: string | null;
  display_name: string;
  email: string | null;
  phone: string | null;
  secondary_phone: string | null;
  date_of_birth: string | null;
  status: CrmCustomerStatus;
  lost_at: string | null;
  last_call_at: string | null;
  assigned_to: string | null;
  assigned_to_email: string | null;
  profile_metadata: Record<string, unknown> | null;
};

export type CrmCreditApplicationInfo = {
  first_name: string;
  middle_name: string;
  last_name: string;
  phone: string;
  secondary_phone: string;
  email: string;
  sin: string;
  date_of_birth: string;
  street: string;
  line2: string;
  city: string;
  province: string;
  postal_code: string;
  address_tenure: string;
  previous_street: string;
  previous_city: string;
  previous_province: string;
  previous_postal_code: string;
  previous_address_tenure: string;
  home_status: string;
  home_monthly_payment_cad: string;
  mortgage_amount_cad: string;
  mortgage_holder: string;
  home_market_value_cad: string;
  employer: string;
  job_title: string;
  work_street: string;
  work_city: string;
  work_province: string;
  job_tenure: string;
  previous_employer: string;
  previous_job_title: string;
  previous_work_street: string;
  previous_work_city: string;
  previous_work_province: string;
  previous_job_tenure: string;
  employment_status: string;
  employment_other_description: string;
  employment_type: string;
  gross_monthly_income_cad: string;
  other_monthly_income_cad: string;
  other_income_description: string;
  monthly_budget_cad: string;
  down_payment_cad: string;
  credit_score_band: string;
  vehicle_interest: string;
  has_trade: boolean;
  trade_year: string;
  trade_make: string;
  trade_model: string;
  trade_kms: string;
  trade_vin: string;
  trade_has_registration: boolean;
  has_co_signer: boolean;
  co_signer_details: string;
  check_drivers_license: boolean;
  check_paystubs: boolean;
  drivers_license_file: CrmCreditAppAttachment | null;
  paystubs_file: CrmCreditAppAttachment | null;
  trade_registration_file: CrmCreditAppAttachment | null;
  consent_contact: boolean;
  consent_credit: boolean;
  /** Shown on the printed lead sheet for finance managers. */
  notes: string;
};

export type CrmActivity = {
  id: string;
  created_at: string;
  customer_id: string;
  author_id: string;
  author_email: string | null;
  kind: CrmActivityKind;
  body: string;
};

export type CrmCustomerEditSource =
  | "created"
  | "profile"
  | "credit_app"
  | "assignment"
  | "status"
  | "restore";

export type CrmCustomerEditChange = {
  field: string;
  label: string;
  old: string;
  new: string;
};

export type CrmCustomerEditSnapshot = {
  display_name: string;
  phone: string | null;
  secondary_phone: string | null;
  email: string | null;
  date_of_birth: string | null;
  assigned_to: string | null;
  assigned_to_email: string | null;
  status: CrmCustomerStatus;
  lost_at: string | null;
  credit_application_info: CrmCreditApplicationInfo;
};

export type CrmCustomerEditHistoryRow = {
  id: string;
  created_at: string;
  customer_id: string;
  author_id: string | null;
  author_email: string | null;
  source: CrmCustomerEditSource;
  summary: string;
  changes: CrmCustomerEditChange[];
  snapshot_before: CrmCustomerEditSnapshot;
};

export type CrmUserDirectoryRow = {
  user_id: string;
  email: string;
  updated_at: string;
  display_name: string | null;
};

export type CrmDirectoryAdminRow = {
  email: string;
  created_at: string;
};

/** Lender keys for CRM bank icon rail (matches `crm_customer_lender_outcomes.lender_slug`). */
export type CrmLenderSlug =
  | "national_bank"
  | "desjardins"
  | "td"
  | "santander_prime"
  | "lendcare"
  | "prefera"
  | "santander_subprime";

export type CrmLenderOutcome = "approved" | "conditional" | "declined";

export type CrmCustomerLenderOutcomeRow = {
  customer_id: string;
  lender_slug: CrmLenderSlug;
  outcome: CrmLenderOutcome;
  reason: string | null;
  updated_at: string;
};

/** Client-side map value for lender rail (outcome + optional note). */
export type CrmLenderOutcomeEntry = {
  outcome: CrmLenderOutcome;
  reason: string | null;
};

/** Row from `crm_public_preapproval_leads` (marketing site pre-approval form). */
export type CrmPublicPreapprovalLead = {
  id: string;
  created_at: string;
  display_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  street: string;
  line2: string | null;
  city: string;
  province: string;
  employer: string;
  gross_monthly_income_cad: number;
  vehicle_interest: string | null;
  consent_contact: boolean;
  consent_credit: boolean;
  job_title?: string | null;
  other_monthly_income_cad?: number | null;
  other_income_description?: string | null;
  monthly_budget_cad?: number | null;
  down_payment_cad?: number | null;
  has_co_signer?: boolean | null;
  co_signer_details?: string | null;
  has_trade?: boolean | null;
  trade_year?: string | null;
  trade_make?: string | null;
  trade_model?: string | null;
  trade_kms?: string | null;
  employment_status?: string | null;
  employment_other_description?: string | null;
  employment_type?: string | null;
  credit_score_band?: string | null;
  address_tenure?: string | null;
};

/** Ingested marketing pre-approval awaiting CRM assignee (`crm_system_leads`). */
export type CrmSystemLead = {
  id: string;
  created_at: string;
  marketing_lead_id: string;
  preapproval_lead_id: string;
  customer_id: string;
  assigned_to: string | null;
  assigned_to_email: string | null;
  assigned_at: string | null;
};

export type CrmSystemLeadListRow = CrmSystemLead & {
  customer: Pick<CrmCustomer, "id" | "display_name" | "email" | "phone" | "profile_metadata">;
  preapproval: Pick<
    CrmPublicPreapprovalLead,
    "display_name" | "email" | "phone" | "vehicle_interest" | "employer" | "gross_monthly_income_cad"
  >;
};

export type CrmNotification = {
  id: string;
  created_at: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  system_lead_id: string | null;
  customer_id: string | null;
  read_at: string | null;
};
