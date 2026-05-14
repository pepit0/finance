# Security notes (CRM and customer data)

This app uses **Supabase Auth** plus **Row Level Security (RLS)** on CRM tables. Treat the **anon** API key as public (it ships in the browser bundle); real protection is **never disabling RLS** and **not granting `service_role` to the client**.

## Who can open the CRM UI?

- Users must **sign in** before any in-app routes load.
- The `/crm` route only loads the CRM after `supabase.rpc("user_has_crm_access")` returns true (see [`src/lib/crmAccess.ts`](src/lib/crmAccess.ts) and [`src/components/CrmAccessGate.tsx`](src/components/CrmAccessGate.tsx)).
- Grant CRM in Supabase with **`crm_access_allowlist`** and/or **`app_metadata`** (`crm_access`, or `roles` containing `"crm"`) as documented in [`sql/crm_security.sql`](sql/crm_security.sql) / [`sql/crm_install_rpc_and_reload.sql`](sql/crm_install_rpc_and_reload.sql).

Anyone without that permission should see the access-denied screen and **must not** be able to read CRM rows via the Data API if RLS policies are applied.

## Before pushing to GitHub or open-sourcing

- **Do not commit** `.env`, `.env.local`, or any file containing the **service role** key. Only `VITE_SUPABASE_*` belongs in local env files; those are still sensitive for your project—use **repo secrets** in CI, not committed files.
- **Do not commit** customer exports, SQLite copies of prod, or CSV dumps of leads (use `.gitignore` patterns already in this repo as a baseline; add your own export paths if needed).
- **Review SQL** in `sql/` for site-specific values (e.g. directory master email) if the repository will be public.
- If keys or exports were ever committed, **rotate** Supabase keys and consider the data exposed.

## Production checklist

- Confirm CRM RLS policies are deployed (run `sql/crm_security.sql` or your incremental migrations in order).
- Keep **authenticated** grants aligned with RLS; avoid broad `BYPASSRLS` on roles used by the app.
- Prefer **private** GitHub/Vercel projects until you are comfortable with the above.
