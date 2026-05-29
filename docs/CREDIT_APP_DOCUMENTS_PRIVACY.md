# Credit app document privacy (driver's licence, paystubs, registration)

## How files are protected

| Layer | What it does |
|--------|----------------|
| **Private bucket** | Bucket `crm-credit-app-documents` has **Public bucket = OFF**. Files are not available at public Supabase URLs. |
| **Row Level Security** | Only signed-in users who pass `user_has_crm_access()` can upload, read, update, or delete objects in this bucket. |
| **No anonymous access** | There are no storage policies for `anon`. The marketing site or a leaked anon key cannot list or download these files. |
| **Signed URLs only** | View/Download in the CRM opens a temporary link (10 minutes) created while you are signed in. The link expires; minting a new link requires CRM access again. |
| **Unguessable paths** | Each file path includes a random UUID, e.g. `{customerId}/drivers_license/{uuid}-filename.jpg`. |
| **Metadata in CRM only** | File paths live in `crm_customers.profile_metadata`, which uses the same CRM RLS as customer records. |

## What you must do in Supabase

1. Run `sql/crm_credit_app_documents_storage.sql` on the **CRM** project (re-run after updates to re-apply policies).
2. In **Storage** → `crm-credit-app-documents`, confirm **Public bucket** stays **disabled**. Never turn it on.
3. Do not add a separate “public read” policy on this bucket in the dashboard.

## Operational note

Anyone who receives a **View** link during the 10-minute window could open that file until the link expires. Treat View/Download like sharing a temporary password. For stricter needs, shorten `SIGNED_URL_TTL_SECONDS` in `src/lib/crmCreditAppDocuments.ts`.
