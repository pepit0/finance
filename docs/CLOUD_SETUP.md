# Cloud setup guide

Manual steps for the four deploy targets in the white-label rollout. Run these in your own accounts; do not commit secrets.

**Order:** code on `playground` → validate → merge `main` → tag `v0.1.0` → Test Dealer → split Temptation Vercel → DNS cutover.

## Fast path — playground (automated in repo)

### One-paste migrations

From repo root in PowerShell:

```powershell
.\scripts\Apply-PlaygroundMigrations.ps1 -IncludeSeed
```

Opens/generated files:

- **`sql/.generated/playground-with-seed.sql`** — paste once into Supabase SQL Editor (78 migrations + seed)
- **`sql/.generated/playground-allowlist.sql`** — run after you create the Auth user

Set master email when bundling:

```powershell
.\scripts\Apply-PlaygroundMigrations.ps1 -IncludeSeed -MasterEmail "you@example.com"
```

Apply from CLI (optional; needs DB password from Settings → Database):

```powershell
.\scripts\Apply-PlaygroundMigrations.ps1 -IncludeSeed -ProjectRef "YOUR_REF" -DbPassword "..." -Apply
```

### Local dev env

```powershell
.\scripts\New-PlaygroundEnv.ps1
npm run dev
```

Open http://localhost:5173/crm — see also `.env.playground.example`.

### Still manual in Supabase / Vercel

1. Auth → **Users** → add user (email must match allowlist file).
2. Run `playground-allowlist.sql` in SQL Editor.
3. Vercel preview env (section A2).

File-by-file alternative: [MIGRATIONS.md](MIGRATIONS.md).

## Target summary

| Target | Supabase | Vercel | `VITE_PRODUCT` | Build |
|--------|----------|--------|----------------|-------|
| Playground | **New** dev | Preview on `playground` branch | `crm` | `build:crm` |
| Test Dealer | **New** prod | New project | `crm` | `build:crm` |
| Temptation CRM | **Existing** prod | New project | `crm` | `build:crm` |
| Temptation Finance | **Existing** prod | New or renamed project | `finance` | `build:finance` |

---

## A. Playground (do this first)

### A1. Supabase

1. Dashboard → New project → name `crm-playground`.
2. SQL editor: run files from [MIGRATIONS.md](MIGRATIONS.md) in order.
3. Run `sql/seed_playground.sql`.
4. Authentication → Users → create `playground@example.com` (password you choose).
5. Grant access:

```sql
insert into public.crm_access_allowlist (email)
values ('playground@example.com')
on conflict do nothing;
```

6. Copy **Project URL** and **anon key**.

### A2. Vercel

1. Push `playground` branch.
2. Project → Settings → Git → enable previews for `playground`.
3. Settings → Environment Variables → **Preview** only:

```
VITE_PRODUCT=crm
VITE_SUPABASE_URL=<playground url>
VITE_SUPABASE_ANON_KEY=<playground anon>
```

4. Settings → General → Build Command: `npm run build:crm`
5. Deploy preview → open `/crm` → sign in → verify seed customers.

Details: [PLAYGROUND.md](PLAYGROUND.md)

---

## B. Test Dealer (first licensed tenant)

### B1. Supabase

1. New project `test-dealer-crm` (production region).
2. Run full [MIGRATIONS.md](MIGRATIONS.md).
3. Set master email in `crm_directory_set_master_email.sql`.
4. Create dealer admin user + allowlist.
5. Optional: Twilio subaccount + number for this dealer only.

### B2. Vercel

1. New project `test-dealer-crm`.
2. Production env:

```
VITE_PRODUCT=crm
VITE_SUPABASE_URL=<test dealer url>
VITE_SUPABASE_ANON_KEY=<test dealer anon>
VITE_VAPID_PUBLIC_KEY=<vapid public>
```

3. Build: `npm run build:crm`
4. Domain: `test-dealer-crm.yourdomain.com`
5. Supabase Auth → add domain to redirect URLs.
6. Settings → branding → set dealer name, logo, footer.
7. After smoke test:

```sql
update public.crm_org_settings set app_version = '0.1.0' where id = 'default';
```

---

## C. Temptation split (same Supabase, two Vercel apps)

**No data migration.** Both apps use existing `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

### C1. Run SQL on existing prod (once)

```sql
-- sql/crm_org_settings_product_shell.sql
-- additive only; does not change header_title
```

### C2. CRM Vercel project (new)

1. Duplicate or import repo as new project (e.g. `temptation-crm`).
2. Production env:

```
VITE_PRODUCT=crm
VITE_SUPABASE_URL=<existing prod>
VITE_SUPABASE_ANON_KEY=<existing prod>
VITE_FINANCE_APP_URL=https://sharifian.cfd
VITE_VAPID_PUBLIC_KEY=<existing>
VITE_MARKETING_SITE_URL=<if used>
```

3. Build: `npm run build:crm`
4. Domain: `crm.sharifian.cfd` (example)

### C3. Finance Vercel project (new or rename current)

1. Project for finance-only (e.g. `temptation-finance`).
2. Production env:

```
VITE_PRODUCT=finance
VITE_SUPABASE_URL=<existing prod>
VITE_SUPABASE_ANON_KEY=<existing prod>
VITE_CRM_APP_URL=https://crm.sharifian.cfd
VITE_LENDERS_CSV_URL=<if overridden>
VITE_MARKETING_SITE_URL=<if used>
```

3. Build: `npm run build:finance`
4. Domain: `sharifian.cfd` (root)

### C4. Supabase Auth

Authentication → URL configuration → Redirect URLs — add:

- `https://sharifian.cfd/**`
- `https://crm.sharifian.cfd/**`
- `http://localhost:5173/**`

### C5. DNS cutover (after preview smoke tests)

1. Deploy both projects; test on `*.vercel.app` URLs.
2. Update DNS A/CNAME for finance and CRM domains.
3. Verify: finance app has no `/crm` route (redirects externally); CRM app opens at `/crm`.
4. Confirm existing users sign in on both apps.
5. Update `app_version` to `0.1.0` when satisfied.

---

## D. Release tag

```bash
git checkout main
git pull
git tag v0.1.0
git push origin v0.1.0
```

Pin each Vercel production deployment to this tag for reproducible upgrades.

---

## E. Tenant registry

Copy `tenants.example.json` → `tenants.json` (local, gitignored) and fill project refs, domains, and `currentVersion`.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| CRM link on finance goes to 404 | Set `VITE_CRM_APP_URL` on finance project |
| Finance link on CRM 404 | Set `VITE_FINANCE_APP_URL` on CRM project |
| Auth redirect loop | Add both domains to Supabase redirect URLs |
| Branding still says Temptation | Expected until DB `header_title` is changed; code defaults are neutral for new installs |
| `footer_text` / `app_version` missing | Run `sql/crm_org_settings_product_shell.sql` |

See also [PROVISIONING.md](PROVISIONING.md) and [UPGRADE.md](UPGRADE.md).
