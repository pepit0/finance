export type CrmActivityKind = "call" | "comment" | "text";

export type CrmCustomerStatus = "active" | "lost";

export type CrmCustomer = {
  id: string;
  created_at: string;
  created_by: string;
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
