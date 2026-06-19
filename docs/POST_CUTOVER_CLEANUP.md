# Post-cutover cleanup

One-time hygiene after CRM-only prod (`crm.sharifian.cfd`) and playground demo (`demo.sharifian.cfd`) are live. No database migration required unless noted.

**Related:** [TEMPTATION_CUTOVER.md](TEMPTATION_CUTOVER.md), [CLOUD_SETUP.md](CLOUD_SETUP.md), [PLAYGROUND.md](PLAYGROUND.md), [UPGRADE.md](UPGRADE.md)

---

## 1. Identify the old apex deploy

The pre-cutover **combined** app (finance + CRM) may still be reachable at `https://sharifian.cfd/crm` from a **different** Vercel project than `crm.sharifian.cfd`.

**Apex** = root domain `sharifian.cfd` (not `crm.sharifian.cfd` or `demo.sharifian.cfd`).

1. Vercel dashboard → list projects connected to this GitHub repo.
2. For each project: **Settings → Domains** — find which one owns `sharifian.cfd` (apex or `www`).
3. Visit `https://sharifian.cfd/crm` — if a CRM or old combined app loads, that is the project to retire.

Note the project name — changes go on **that** project only (not the `crm.sharifian.cfd` prod CRM project).

---

## 2. Hide stale `/crm` on apex (do not redirect)

**Goal:** Staff and bookmarks should use **`https://crm.sharifian.cfd/crm` only**. The old `sharifian.cfd/crm` URL should be **unreachable** (404 or no DNS), not redirected.

Pick the option that matches your setup:

### Option A — Old project only served the combined app (simplest)

1. On that Vercel project: **Settings → Domains** → remove `sharifian.cfd` (and `www` if attached).
2. Optionally **pause** or **delete** the project if nothing else needs it.

`sharifian.cfd/crm` will stop resolving to the old app.

### Option B — `sharifian.cfd` is shared (e.g. marketing site + old CRM)

1. Stop deploying the combined finance+CRM build to that domain.
2. Remove any **rewrites** that proxy `/crm` to an old CRM deployment.
3. Confirm `https://sharifian.cfd/crm` returns **404** (or your marketing site’s not-found page).

Do **not** add a redirect from `/crm` to `crm.sharifian.cfd` — you want the old path hidden, not advertised.

### Option C — Nothing to do

If `https://sharifian.cfd/crm` already 404s or does not load a CRM, skip this section.

**Do not** add apex redirects in a repo-root `vercel.json` — the same repo deploys to multiple Vercel projects.

**Later — finance dashboard:** new **separate** Vercel project with `npm run build:finance`, on its own subdomain (e.g. `finance.sharifian.cfd`), not on `/crm` at the apex. See [TEMPTATION_CUTOVER.md § Later](TEMPTATION_CUTOVER.md).

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

**Remove** once `/crm` on apex is hidden and no logins use them:

- `https://sharifian.cfd/crm/**`
- `https://sharifian.cfd/**` (unless a marketing site on apex still needs auth for something else)
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

- [ ] `sharifian.cfd/crm` is hidden (404 or domain removed — not a live CRM)
- [ ] Prod + playground Auth URLs are minimal and correct
- [ ] Settings → About shows `0.1.1` on both environments
- [ ] `git tag v0.1.1` on remote matches cutover-complete commit
- [ ] `tenants.json` filled locally with real project refs

---

## Out of scope (deferred)

- Finance standalone on its own subdomain (e.g. `finance.sharifian.cfd`, `build:finance`) — separate Vercel project, not apex `/crm`
- First licensed customer (Test Dealer stack)
- Force-retagging or deleting `v0.1.0` on remote
