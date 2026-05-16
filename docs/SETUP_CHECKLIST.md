# Setup checklist (Supabase + local dev)

**New:** step-by-step with every Supabase menu click → **[SUPABASE_BEGINNER_CLICKS.md](./SUPABASE_BEGINNER_CLICKS.md)**  
**Important:** Cursor cannot log into your Supabase account; it only edits this repo. Anything in the Supabase **website** is always you (see beginner doc).

Use this list after you have **two Supabase projects** (recommended: one for the **marketing site**, one for **CRM / finance**) or one combined project.

---

## A. Marketing site (`site` repo)

### You do (manual)

1. **Supabase (marketing project)**  
   - Dashboard → **Settings** → **API** → copy **Project URL** and **`anon` `public`** key.

2. **SQL on the marketing project**  
   - Dashboard → **SQL Editor** → paste the full contents of  
     `auto-finance-manager/sql/crm_public_preapproval_leads_marketing_project.sql` from this monorepo (or clone path) → **Run**.  
   - This creates the table + `submit_public_preapproval_lead` RPC for anonymous form submits. It does **not** require `user_has_crm_access`.

3. **Auth URLs (marketing project)**  
   - **Authentication** → **URL configuration**.  
   - Set **Site URL** to your marketing origin (e.g. `http://localhost:5173`).  
   - Add the same URL under **Redirect URLs** (and your production URL when you have it).

4. **Create `site/.env.local`** (next to `site/package.json`), not committed to git:

   ```env
   VITE_SUPABASE_URL=https://YOUR-MARKETING-REF.supabase.co
   VITE_SUPABASE_ANON_KEY=paste-anon-public-key-here
   VITE_SITE_MARKETING_ONLY=true
   ```

5. **Install and run**

   ```bash
   cd site
   npm install
   npm run dev
   ```

   Open the URL Vite prints (often `http://localhost:5173`).

### Already done in code (repo)

- Pre-approval form calls `submit_public_preapproval_lead`.  
- If env vars are missing, you see **Configuration needed** instead of a blank page.  
- With `VITE_SITE_MARKETING_ONLY=true`, **Sign in / Staff** are hidden (those need the CRM database).

### Marketing → CRM sync (two projects)

With **separate** projects, pre-approvals are stored in the **marketing** `preapproval_leads` table. To push them into CRM automatically:

1. CRM: run **`sql/crm_marketing_ingest_bridge.sql`** and deploy Edge Function `ingest-marketing-preapproval` (see **`docs/CRM_BRIDGE.md`**).
2. Marketing: add a **database webhook** on `preapproval_leads` INSERT → CRM function URL (see **`site/docs/CRM_BRIDGE.md`**).

Then use CRM **System leads** (assign) and **Alerts**; **Web leads** shows the mirrored CRM rows.

---

## B. Finance / CRM (`auto-finance-manager` repo)

### You do (manual)

1. **Supabase (CRM project)**  
   - **Settings** → **API** → copy **Project URL** and **`anon` `public`** key (different from marketing if you use two projects).

2. **SQL on the CRM project** (order matters for a new DB; for an existing CRM DB you may have run these already)  
   - Run `sql/crm_security.sql` first (base CRM + `user_has_crm_access`).  
   - Then run any migration files your team already uses from `sql/` (see comments in `.env.example`).  
   - Run `sql/crm_public_preapproval_leads.sql` on the CRM project.  
   - Run **`sql/crm_marketing_ingest_bridge.sql`** for marketing sync, system leads, and notifications (see **`docs/CRM_BRIDGE.md`**).
   - Run **`sql/crm_customers_admin_delete.sql`** so directory admins can delete customer profiles.
   - Run **`sql/crm_customers_system_website_creator.sql`** so ingested leads show **System - Website app** as creator (and backfill existing website leads).

3. **Auth URLs (CRM project)**  
   - **Authentication** → **URL configuration** for the CRM app origin (e.g. `http://localhost:5174`).

4. **Create `auto-finance-manager/.env.local`**

   ```env
   VITE_SUPABASE_URL=https://YOUR-CRM-REF.supabase.co
   VITE_SUPABASE_ANON_KEY=paste-anon-public-key-here
   ```

   Optional:

   ```env
   VITE_MARKETING_SITE_URL=http://localhost:5173
   ```

5. **CRM access for a user**  
   - Add the user’s email to `crm_access_allowlist` **or** set `app_metadata` / roles per `sql/crm_security.sql` comments so `user_has_crm_access()` is true.

6. **Run CRM locally**

   ```bash
   cd auto-finance-manager
   npm install
   npm run dev
   ```

### Already done in code (repo)

- Finance dashboard + CRM routes, system leads, notifications, web leads UI, env missing screen.
- **Temptation** dark + orange theme (`src/styles/temptation-theme.css`) aligned with [temptmotorsports.com](https://temptmotorsports.com).
- Directory admins see **Delete customer** on the customer profile (requires `sql/crm_customers_admin_delete.sql`).
- Website-ingested customers show **Profile created by: System - Website app** (requires ingest bridge + `sql/crm_customers_system_website_creator.sql`).

---

## C. GitHub + hosting (Vercel / Netlify / etc.)

### You do (manual)

1. Connect the **site** repo to your host; set **environment variables** there to match `site/.env.local` (`VITE_*` names unchanged).  
2. Do the same for **auto-finance-manager** with the **CRM** project keys.  
3. Add **production** URLs to **both** Supabase projects under **Authentication → URL configuration**.

Supabase “connect GitHub” in the dashboard does **not** by itself set Vercel env vars; you still add keys in the host’s UI (or your CI secrets).

---

## Quick reference: which SQL file where?

| File | Run on |
|------|--------|
| `sql/crm_public_preapproval_leads_marketing_project.sql` | **Marketing** Supabase only (standalone site). |
| `sql/crm_public_preapproval_leads.sql` | **CRM** Supabase (needs `user_has_crm_access` from `crm_security.sql`). |
| `sql/crm_marketing_ingest_bridge.sql` | **CRM** Supabase (marketing webhook ingest + system leads + notifications). |
| `sql/crm_security.sql` | **CRM** Supabase (not the whole thing on marketing-only project). |
| `site/sql/marketing/04_*.sql` | **Marketing** Supabase (public form RPC). |
| `site/docs/CRM_BRIDGE.md` | Webhook setup on marketing project. |

---

## Free tier reminder

Supabase Free allows **two active free projects** per org—one for site + one for CRM is typical. See [Supabase billing FAQ](https://supabase.com/docs/guides/platform/billing-faq#how-many-free-projects-can-i-have).
