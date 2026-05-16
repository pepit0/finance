export type CrmActivityKind = "call" | "comment" | "text";

export type CrmCustomerStatus = "active" | "lost";

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

export type CrmActivity = {
  id: string;
  created_at: string;
  customer_id: string;
  author_id: string;
  author_email: string | null;
  kind: CrmActivityKind;
  body: string;
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
