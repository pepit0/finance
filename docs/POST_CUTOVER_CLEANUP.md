# Post-cutover cleanup

One-time hygiene after CRM-only prod (`crm.sharifian.cfd`) and playground demo (`demo.sharifian.cfd`) are live. No database migration required unless noted.

**Related:** [TEMPTATION_CUTOVER.md](TEMPTATION_CUTOVER.md), [CLOUD_SETUP.md](CLOUD_SETUP.md), [PLAYGROUND.md](PLAYGROUND.md), [UPGRADE.md](UPGRADE.md)

---

## 1. Identify the old apex deploy

The pre-cutover CRM may still be served at `https://sharifian.cfd/crm` from a **different** Vercel project than `crm.sharifian.cfd`.

1. Vercel dashboard → list projects connected to this GitHub repo.
2. For each project: **Settings → Domains** — find which one owns `sharifian.cfd` (apex or `www`).
3. Visit `https://sharifian.cfd/crm` and confirm it still loads the old combined or stale CRM (not the subdomain).

Note the project name — redirects go on **that** project only.

---

## 2. Redirect stale `/crm` on apex

On the **old apex Vercel project** (not the `crm.sharifian.cfd` project):

**Settings → Redirects** (or project-level redirects in the dashboard):

| Source | Destination | Permanent |
|--------|-------------|-----------|
| `/crm` | `https://crm.sharifian.cfd/crm` | Yes (308) |
| `/crm/:path*` | `https://crm.sharifian.cfd/crm/:path*` | Yes (308) |

**Test:** open `https://sharifian.cfd/crm` → should land on `https://crm.sharifian.cfd/crm` with **real** Temptation customers.

**Do not** add these redirects in a repo-root `vercel.json` — the same repo deploys to multiple Vercel projects; shared redirects would affect prod CRM too.

**Later:** repurpose this project for `build:finance` at `sharifian.cfd` root ([TEMPTATION_CUTOVER.md § Later](TEMPTATION_CUTOVER.md)).

---

## 3. Supabase Auth URL cleanup

### Prod Supabase (Temptation CRM)

**Authentication → URL configuration**

**Keep:**

- Site URL: `https://crm.sharifian.cfd`
- Redirect URLs:
  - `https://crm.sharifian.cfd/**`
  - `http://localhost:5173/**` (local dev)
  - Edge function / Twilio callback URLs if configured

**Remove** (after apex redirect works and you confirm no logins use them):

- `https://sharifian.cfd/crm/**`
- `https://sharifian.cfd/**` (unless finance or marketing still needs it on this project)
- Obsolete `*.vercel.app` URLs from pre-cutover projects

### Playground Supabase

**Keep:**

- `https://demo.sharifian.cfd/**`
- Playground Vercel project `*.vercel.app` production URL
- `http://localhost:5173/**`

**Remove** prod URLs if accidentally added (`crm.sharifian.cfd`, prod Supabase should never be used here).

---

## 4. Record release version in database

Run on **prod** and **playground** Supabase SQL Editor:

```sql
update public.crm_org_settings
set app_version = '0.1.1', updated_at = now()
where id = 'default';
```

Verify in CRM → **Settings → CRM branding → About** → *Installed release* shows `0.1.1`.

---

## 5. Prod smoke test

Check off on prod (`crm.sharifian.cfd/crm`):

- [ ] Sign in with prod account
- [ ] Real customers visible (not playground seed data)
- [ ] Branding from DB (Temptation header, not Demo CRM defaults)
- [ ] Twilio voice: place or receive a test call if enabled — see [TWILIO_VOICE.md](TWILIO_VOICE.md)
- [ ] Push: inbound SMS/call alert with CRM tab in background
- [ ] PWA: Add to Home Screen opens `/crm` (CRM build sets `start_url: /crm` in manifest)

Light pass on demo (`demo.sharifian.cfd/crm`):

- [ ] Seed/demo customers only
- [ ] Demo CRM branding
- [ ] Login works with playground user

---

## 6. Local tenant registry

From repo root:

```powershell
Copy-Item tenants.example.json tenants.json
```

Edit `tenants.json` with your real Supabase project refs and Vercel project names. File is gitignored — never commit secrets.

---

## 7. Git release tag

After cleanup commits are on `main`:

```powershell
git checkout main
git pull
git tag v0.1.1
git push origin v0.1.1
```

Optional: pin prod Vercel deployment to this tag in the dashboard for reproducible upgrades. See [UPGRADE.md](UPGRADE.md).

Note: `v0.1.0` on remote may point to an older commit; use `v0.1.1` as the cutover-complete milestone.

---

## Day-to-day workflow (after cleanup)

```
Local dev (playground Supabase)  →  push playground  →  demo.sharifian.cfd
                                                          ↓ merge when ready
                                                       main  →  crm.sharifian.cfd
```

| Stage | Where | Rollback |
|-------|-------|----------|
| Uncommitted local edits | Your machine | Discard files or `git checkout -- .` |
| Pushed to `playground` | `demo.sharifian.cfd` | Vercel → Promote previous Production deploy, or `git revert` |
| Merged to `main` | `crm.sharifian.cfd` | Vercel prod rollback, or revert on `main` |

**Optional:** feature branch off `playground` → Vercel Preview URL → merge to `playground` when happy (demo unchanged until playground merge).

**SQL changes:** test migration on playground Supabase first, then run the same delta on prod.

Local dev helpers:

```powershell
.\scripts\New-PlaygroundEnv.ps1   # playground Supabase → .env.local
npm run dev                        # http://localhost:5173/crm
```

---

## Verification checklist

- [ ] `sharifian.cfd/crm` redirects to canonical prod CRM
- [ ] Prod + playground Auth URLs are minimal and correct
- [ ] Settings → About shows `0.1.1` on both environments
- [ ] `git tag v0.1.1` on remote matches cutover-complete commit
- [ ] `tenants.json` filled locally with real project refs

---

## Out of scope (deferred)

- Finance standalone at `sharifian.cfd` (`build:finance`)
- First licensed customer (Test Dealer stack)
- Force-retagging or deleting `v0.1.0` on remote
