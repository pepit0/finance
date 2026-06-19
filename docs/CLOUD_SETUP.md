# Cloud setup guide

Manual steps for deploy targets in the white-label rollout. Run these in your own accounts; do not commit secrets.

**Order:** validate on playground → merge `main` → CRM-only prod cutover → optional finance split later.

**Topology reference:** [DEPLOYMENT_TOPOLOGIES.md](DEPLOYMENT_TOPOLOGIES.md)  
**Temptation cutover:** [TEMPTATION_CUTOVER.md](TEMPTATION_CUTOVER.md)  
**Post-cutover hygiene:** [POST_CUTOVER_CLEANUP.md](POST_CUTOVER_CLEANUP.md)

## Recommended Vercel layout

Use **separate Vercel projects** (same GitHub repo):

| Project | Branch | Domain example | Build |
|---------|--------|----------------|-------|
| Temptation CRM | `main` | `crm.sharifian.cfd` | `build:crm` |
| Playground CRM | `playground` | `demo.sharifian.cfd` or preview URL | `build:crm` |
| Temptation Finance | `main` | `finance.sharifian.cfd` | `build:finance` (later) |
| Customer CRM | `main` | `crm.dealer.com` | `build:crm` |
| Customer marketing | `main` | `dealer.com` | site repo (Topology C) |

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
3. Vercel playground project (section A2) — Production branch `playground`, domain `demo.sharifian.cfd`.

File-by-file alternative: [MIGRATIONS.md](MIGRATIONS.md).

## Target summary

| Target | Supabase | Vercel | `VITE_PRODUCT` | Build |
|--------|----------|--------|----------------|-------|
| Playground | **New** dev | Dedicated project, branch `playground` | `crm` | `build:crm` |
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

### A2. Vercel (dedicated playground project recommended)

1. Create **new Vercel project** (e.g. `crm-playground`) importing this repo.
2. **Production branch:** `playground` (Settings → Environments → Production → Branch Tracking)
3. Settings → Environment Variables → **Production**:

```
VITE_PRODUCT=crm
VITE_SUPABASE_URL=<playground url>
VITE_SUPABASE_ANON_KEY=<playground anon>
```

4. Settings → General → **Build Command:** `npm run build:crm`
5. Deploy → open `/crm` → sign in → verify seed customers.

Optional: attach `demo.sharifian.cfd` to this project.

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

## C. Temptation CRM-only cutover (same Supabase)

**No data migration.** Follow [TEMPTATION_CUTOVER.md](TEMPTATION_CUTOVER.md) for step-by-step DNS and Vercel setup.

Summary:

1. Run `sql/crm_org_settings_product_shell.sql` on prod if missing.
2. New Vercel project → `build:crm`, `VITE_PRODUCT=crm`, existing prod Supabase keys.
3. Domain: `crm.sharifian.cfd`.
4. Supabase Auth → add CRM domain to redirect URLs.

Finance split (section C3 below) is **optional** and can wait.

### C2. CRM Vercel project (new)

1. Duplicate or import repo as new project (e.g. `temptation-crm`).
2. Production env:

```
VITE_PRODUCT=crm
VITE_SUPABASE_URL=<existing prod>
VITE_SUPABASE_ANON_KEY=<existing prod>
VITE_FINANCE_APP_URL=https://finance.sharifian.cfd
VITE_VAPID_PUBLIC_KEY=<existing>
VITE_MARKETING_SITE_URL=<if used>
```

3. Build: `npm run build:crm`
4. Domain: `crm.sharifian.cfd` (example)

### C3. Finance Vercel project (optional — later)

1. Project for finance-only (e.g. `temptation-finance`).
2. Production env:

```
VITE_PRODUCT=finance
VITE_SUPABASE_URL=<existing prod>
VITE_SUPABASE_ANON_KEY=<existing prod>
VITE_CRM_APP_URL=https://crm.sharifian.cfd/crm
VITE_LENDERS_CSV_URL=<if overridden>
VITE_MARKETING_SITE_URL=<if used>
```

3. Build: `npm run build:finance`
4. Domain: `finance.sharifian.cfd`

### C4. Supabase Auth

Authentication → URL configuration → Redirect URLs — add:

- `https://finance.sharifian.cfd/**` (when finance is deployed)
- `https://crm.sharifian.cfd/**`
- `http://localhost:5173/**`

### C5. DNS cutover (after preview smoke tests)

1. Deploy both projects; test on `*.vercel.app` URLs.
2. Update DNS A/CNAME for finance and CRM domains.
3. Verify: finance app has no `/crm` route (redirects externally); CRM app opens at `/crm`.
4. Confirm existing users sign in on both apps.
5. Update `app_version` to `0.1.1` when satisfied — see [POST_CUTOVER_CLEANUP.md](POST_CUTOVER_CLEANUP.md).

---

## Post-cutover cleanup

After `crm.sharifian.cfd` and `demo.sharifian.cfd` are live, complete [POST_CUTOVER_CLEANUP.md](POST_CUTOVER_CLEANUP.md):

- Hide old `sharifian.cfd/crm` (404 or remove domain — do not redirect)
- Trim Supabase Auth redirect URLs
- Prod smoke test (Twilio, push, PWA)
- Local `tenants.json` from `tenants.example.json`
- Git tag `v0.1.1`

---

## D. Release tag

```bash
git checkout main
git pull
git tag v0.1.1
git push origin v0.1.1
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

See also [PROVISIONING.md](PROVISIONING.md), [DEPLOYMENT_TOPOLOGIES.md](DEPLOYMENT_TOPOLOGIES.md), and [UPGRADE.md](UPGRADE.md).
