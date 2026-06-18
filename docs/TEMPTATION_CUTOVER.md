# Temptation CRM cutover (manual)

One-time steps to move personal production from the combined finance+CRM app to **CRM-only** at `crm.sharifian.cfd`. No database migration — same Supabase project.

**Prerequisites:** `main` branch merged with product split; `npm run build:crm` succeeds locally.

---

## 1. Supabase (existing prod CRM project)

Run once if not already applied:

```sql
-- sql/crm_org_settings_product_shell.sql
```

**Authentication → URL configuration** — add:

- `https://crm.sharifian.cfd`
- `https://crm.sharifian.cfd/**`
- Keep existing URLs until cutover is verified, then remove obsolete ones if desired.

---

## 2. Vercel — new CRM project (or reconfigure existing)

1. Import repo (or duplicate current project → rename `temptation-crm`).
2. **Production branch:** `main`
3. **Build command:** `npm run build:crm`
4. **Output directory:** `dist`
5. **Environment variables (Production):**

```
VITE_PRODUCT=crm
VITE_SUPABASE_URL=<existing prod URL>
VITE_SUPABASE_ANON_KEY=<existing prod anon>
VITE_VAPID_PUBLIC_KEY=<existing if using push>
```

Do **not** set `VITE_FINANCE_APP_URL` until finance is split out.

6. Deploy → smoke test on `*.vercel.app/crm` — sign in, confirm real customers load.

---

## 3. DNS

1. Add domain **`crm.sharifian.cfd`** to the CRM Vercel project.
2. Create CNAME/A record per Vercel instructions.
3. Wait for SSL, then open `https://crm.sharifian.cfd/crm`.

---

## 4. Verify

- [ ] Sign in with your prod account
- [ ] Real customers visible (not playground fake data)
- [ ] Branding unchanged (Temptation header from DB, not Demo CRM)
- [ ] Twilio / push still work if enabled
- [ ] PWA “Add to Home Screen” opens `/crm`

---

## 5. Old combined deploy

- Leave old Vercel project running until CRM domain is verified.
- Then either delete old project or repurpose it later for `build:finance` at `sharifian.cfd`.

---

## 6. Playground Vercel (separate project)

Create a **new** Vercel project (e.g. `crm-playground`) — do not reuse the prod CRM project.

1. Import this repo → **Production branch:** `playground`
2. **Build command:** `npm run build:crm` · **Output:** `dist`
3. **Environment variables (Production only):**

```
VITE_PRODUCT=crm
VITE_SUPABASE_URL=<playground supabase>
VITE_SUPABASE_ANON_KEY=<playground anon>
```

4. Deploy → smoke test on `*.vercel.app/crm` (seed customers, not prod data).
5. **Optional domain:** add `demo.sharifian.cfd` to this project; CNAME per Vercel DNS instructions.
6. **Playground Supabase → Authentication → URL configuration** — add:

- `https://demo.sharifian.cfd`
- `https://demo.sharifian.cfd/**`
- The `*.vercel.app` production URL for this project

Full checklist: [CLOUD_SETUP.md](CLOUD_SETUP.md) § A2.

**Workflow:** test features on `playground` branch + this deploy → merge `playground` → `main` when ready for prod (`crm.sharifian.cfd`).

---

## Later — finance standalone

When ready:

1. New Vercel project: `npm run build:finance`, `VITE_PRODUCT=finance`
2. `VITE_CRM_APP_URL=https://crm.sharifian.cfd/crm`
3. Domain: `sharifian.cfd` (root)
4. On CRM project add `VITE_FINANCE_APP_URL=https://sharifian.cfd`

See [DEPLOYMENT_TOPOLOGIES.md](DEPLOYMENT_TOPOLOGIES.md) and [PROVISIONING.md](PROVISIONING.md) § Temptation split.

---

## Rollback

Point `crm.sharifian.cfd` DNS back to the previous Vercel deployment, or temporarily set `VITE_PRODUCT=full` on the old project. Database is unchanged.
