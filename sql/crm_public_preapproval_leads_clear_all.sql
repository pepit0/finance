-- One-time wipe of all web pre-approval audit rows (CRM project, SQL Editor as postgres).
-- Also removes linked crm_system_leads rows (FK cascade). Does not delete crm_customers.
-- Prefer the Web leads tab "Clear all" button after running sql/crm_public_preapproval_leads_admin_delete.sql.

delete from public.crm_public_preapproval_leads;
