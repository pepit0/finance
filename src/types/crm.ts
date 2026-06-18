export type CrmActivityKind = "call" | "comment" | "text";

export type CrmCustomerStatus = "active" | "lost";

/** Pipeline stage slug stored on crm_customers.pipeline_stage (see crm_pipeline_stages). */
export type CrmPipelineStage = string;

export type CrmPipelineStageConfig = {
  slug: CrmPipelineStage;
  label: string;
  color: string;
  sort_order: number;
  is_system: boolean;
  is_selectable: boolean;
  requires_credit_app: boolean;
};

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
  pipeline_stage: CrmPipelineStage;
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
  work_postal_code: string;
  job_tenure: string;
  previous_employer: string;
  previous_job_title: string;
  previous_work_street: string;
  previous_work_city: string;
  previous_work_province: string;
  previous_work_postal_code: string;
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
  drivers_license_file: CrmCreditAppAttachment[];
  paystubs_file: CrmCreditAppAttachment[];
  trade_registration_file: CrmCreditAppAttachment[];
  consent_contact: boolean;
  consent_credit: boolean;
  /** Shown on the printed lead sheet for finance managers. */
  notes: string;
};

export type CrmActivitySource = "manual" | "twilio";

export type CrmCallDirection = "inbound" | "outbound";

export type CrmPhoneCallSessionStatus =
  | "initiated"
  | "ringing"
  | "in-progress"
  | "completed"
  | "failed"
  | "no-answer"
  | "busy"
  | "canceled";

export type CrmPhoneCallSession = {
  id: string;
  customer_id: string | null;
  agent_user_id: string | null;
  direction: CrmCallDirection;
  status: CrmPhoneCallSessionStatus | string;
  agent_answered: boolean;
  bridge_connected: boolean;
  dial_call_status: string | null;
  parent_call_status: string | null;
  call_duration_seconds: number | null;
  parent_call_duration_seconds: number | null;
  failure_reason: string | null;
  activity_id: string | null;
  updated_at: string;
};

export type CrmSmsDirection = "inbound" | "outbound";

export type CrmSmsStatus = "queued" | "sent" | "delivered" | "failed" | "undelivered" | "received";

export type CrmSmsThreadFilter = "all" | "mine" | "unread";

export type CrmSmsThread = {
  customer_id: string;
  customer_display_name: string | null;
  customer_phone: string | null;
  assigned_to: string | null;
  last_message_at: string;
  last_message_preview: string;
  last_message_direction: CrmSmsDirection;
  unread: boolean;
};

export type CrmSmsMessage = {
  id: string;
  created_at: string;
  body: string;
  sms_direction: CrmSmsDirection | null;
  sms_status: CrmSmsStatus | null;
  author_id: string | null;
  author_email: string | null;
  source: CrmActivitySource;
};

export type CrmCallLogDirectionFilter = "all" | CrmCallDirection;

export type CrmCallLogSortKey = "newest" | "oldest";

export type CrmTextLogSortKey = "newest" | "oldest";

export type CrmCallLogPhonePartyKind = "crm_user" | "customer";

export type CrmCallLogPhoneParty = {
  kind: CrmCallLogPhonePartyKind;
  label: string;
  customer_id: string | null;
};

export type CrmCallLogEntry = {
  id: string;
  created_at: string;
  customer_id: string;
  customer_display_name: string | null;
  author_id: string;
  author_email: string | null;
  call_direction: CrmCallDirection | null;
  call_duration_seconds: number | null;
  call_from: string | null;
  call_to: string | null;
  call_from_party: CrmCallLogPhoneParty | null;
  call_to_party: CrmCallLogPhoneParty | null;
  body: string;
  has_recording: boolean;
  call_session_status: string | null;
  call_parent_status: string | null;
  call_dial_status: string | null;
  call_agent_answered: boolean | null;
  call_bridge_connected: boolean | null;
  call_failure_reason: string | null;
  call_parent_duration_seconds: number | null;
};

export type CrmTextLogEntry = {
  id: string;
  created_at: string;
  customer_id: string;
  customer_display_name: string | null;
  author_id: string | null;
  author_email: string | null;
  sms_direction: CrmSmsDirection | null;
  sms_status: CrmSmsStatus | null;
  sms_from: string | null;
  sms_to: string | null;
  sms_from_party: CrmCallLogPhoneParty | null;
  sms_to_party: CrmCallLogPhoneParty | null;
  body: string;
};

export type CrmActivity = {
  id: string;
  created_at: string;
  customer_id: string;
  author_id: string;
  author_email: string | null;
  kind: CrmActivityKind;
  body: string;
  source?: CrmActivitySource;
  twilio_call_sid?: string | null;
  call_direction?: CrmCallDirection | null;
  call_duration_seconds?: number | null;
  call_from?: string | null;
  call_to?: string | null;
  recording_storage_path?: string | null;
  call_session_status?: string | null;
  call_bridge_connected?: boolean | null;
  call_dial_status?: string | null;
  twilio_message_sid?: string | null;
  sms_direction?: CrmSmsDirection | null;
  sms_from?: string | null;
  sms_to?: string | null;
  sms_status?: CrmSmsStatus | null;
};

export type CrmCustomerEditSource =
  | "created"
  | "profile"
  | "credit_app"
  | "assignment"
  | "status"
  | "restore"
  | "pipeline";

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
  pipeline_stage: CrmPipelineStage;
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

/** Job position slug stored on crm_user_directory.position (see crm_directory_groups). */
export type CrmDirectoryPosition = string;

export type CrmDirectoryGroup = {
  slug: string;
  label: string;
  rank: number;
  sort_order: number;
  is_default: boolean;
};

export type CrmPermissionDef = {
  key: string;
  label: string;
  description: string;
  group_key: string;
  group_label: string;
  sort_order: number;
};

export type CrmUserDirectoryRow = {
  user_id: string;
  email: string;
  updated_at: string;
  display_name: string | null;
  avatar_path: string | null;
  callback_phone: string | null;
  position: CrmDirectoryPosition;
  is_permissions_admin: boolean;
};

/** Lender slug for CRM bank icon rail (matches `crm_lenders.slug` / `crm_customer_lender_outcomes.lender_slug`). */
export type CrmLenderSlug = string;

export type CrmLenderTier = "prime" | "subprime";

export type CrmLenderConfig = {
  slug: CrmLenderSlug;
  tier: CrmLenderTier;
  label: string;
  icon_domain: string;
  custom_icon_path: string | null;
  sort_order: number;
  updated_at?: string;
};

export type CrmLenderOutcome = "approved" | "conditional" | "declined" | "pending";

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
  /** Stale-lead milestone hours (12, 24, 36, 48, 60) when type is stale_lead. */
  stale_hours: number | null;
};

export type CrmTodoItem = {
  id: string;
  user_id: string;
  task_date: string;
  title: string;
  sort_order: number;
  is_default: boolean;
  completed_at: string | null;
  created_at: string;
};

export type CrmTodoLogItem = {
  title: string;
  is_default: boolean;
  completed: boolean;
  completed_at: string | null;
};

export type CrmTodoDefaultTemplate = {
  id: string;
  user_id: string;
  title: string;
  sort_order: number;
  created_at: string;
};

export type CrmTodoDailyLog = {
  id: string;
  user_id: string;
  log_date: string;
  archived_at: string;
  items: CrmTodoLogItem[];
};

export type CrmCustomerTaskType = "call" | "appointment" | "other";

export type CrmCustomerTask = {
  id: string;
  customer_id: string;
  customer_display_name?: string | null;
  task_type: CrmCustomerTaskType;
  task_date: string;
  task_time: string;
  title: string;
  notes: string | null;
  assigned_to: string;
  assigned_to_email: string | null;
  created_by: string;
  completed_at: string | null;
  created_at: string;
};
