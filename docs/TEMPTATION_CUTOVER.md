# Temptation CRM cutover (manual)

One-time steps to move personal production from the combined finance+CRM app to **CRM-only** at `crm.sharifian.cfd`. No database migration — same Supabase project.

**Status:** Cutover complete. Remaining hygiene: [POST_CUTOVER_CLEANUP.md](POST_CUTOVER_CLEANUP.md).

**Prerequisites:** `main` branch merged with product split; `npm run build:crm` succeeds locally.

---

## 1. Supabase (existing prod CRM project) — done

Run once if not already applied:

```sql
-- sql/crm_org_settings_product_shell.sql
```

**Authentication → URL configuration** — add:

- `https://crm.sharifian.cfd`
- `https://crm.sharifian.cfd/**`

Remove obsolete URLs per [POST_CUTOVER_CLEANUP.md § 3](POST_CUTOVER_CLEANUP.md).

---

## 2. Vercel — CRM project — done

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

## 3. DNS — done

1. Add domain **`crm.sharifian.cfd`** to the CRM Vercel project.
2. Create CNAME/A record per Vercel instructions.
3. Wait for SSL, then open `https://crm.sharifian.cfd/crm`.

---

## 4. Verify

Complete the smoke test in [POST_CUTOVER_CLEANUP.md § 5](POST_CUTOVER_CLEANUP.md):

- [ ] Sign in with your prod account
- [ ] Real customers visible (not playground fake data)
- [ ] Branding unchanged (Temptation header from DB, not Demo CRM)
- [ ] Twilio / push still work if enabled
- [ ] PWA “Add to Home Screen” opens `/crm`

---

## 5. Old combined deploy

The old project that served `sharifian.cfd/crm` should be retired or redirected.

**Do now:** [POST_CUTOVER_CLEANUP.md § 1–2](POST_CUTOVER_CLEANUP.md) — identify the apex Vercel project and add permanent redirects:

| Source | Destination |
|--------|-------------|
| `/crm` | `https://crm.sharifian.cfd/crm` |
| `/crm/:path*` | `https://crm.sharifian.cfd/crm/:path*` |

**Later:** repurpose that project for `build:finance` at `sharifian.cfd` root.

---

## 6. Playground Vercel — done

Dedicated project (e.g. `crm-playground`) — do not reuse the prod CRM project.

1. **Production branch:** `playground`
2. **Build command:** `npm run build:crm` · **Output:** `dist`
3. **Environment variables (Production):**

```
VITE_PRODUCT=crm
VITE_SUPABASE_URL=<playground supabase>
VITE_SUPABASE_ANON_KEY=<playground anon>
```

4. Domain: `demo.sharifian.cfd`
5. Playground Supabase Auth URLs: `demo.sharifian.cfd/**`, playground `*.vercel.app`, `localhost:5173/**`

Details: [PLAYGROUND.md](PLAYGROUND.md), [CLOUD_SETUP.md](CLOUD_SETUP.md) § A2.

**Workflow:** `playground` branch → `demo.sharifian.cfd` → merge to `main` → `crm.sharifian.cfd`.

---

## Later — finance standalone

When ready:

1. New Vercel project: `npm run build:finance`, `VITE_PRODUCT=finance`
2. `VITE_CRM_APP_URL=https://crm.sharifian.cfd/crm`
3. Domain: `sharifian.cfd` (root)
4. On CRM project add `VITE_FINANCE_APP_URL=https://sharifian.cfd`

See [DEPLOYMENT_TOPOLOGIES.md](DEPLOYMENT_TOPOLOGIES.md) and [PROVISIONING.md](PROVISIONING.md).

---

## Rollback

Point `crm.sharifian.cfd` DNS back to the previous Vercel deployment, or temporarily set `VITE_PRODUCT=full` on the old project. Database is unchanged.
