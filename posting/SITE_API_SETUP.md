# Marketplace Lister — what you need to do

The **site API** code is ready in the cloud workspace but could not be pushed to `pepit0/site` (GitHub denied bot write access). Use one of the options below to get it into your **site** repo, then follow the checklist.

## Option A — Apply the git patch (if you have Git on Windows)

1. Install [Git for Windows](https://git-scm.com/download/win) if needed.
2. Open **Command Prompt** or **PowerShell** in your local `site` repo folder.
3. Make sure you are on `main` and up to date: `git pull origin main`
4. Create a branch: `git checkout -b cursor/site-extension-api-e890`
5. Copy the patch file from the **finance** repo into your machine:
   - Path in finance repo: `posting/site-extension-api-patch/0001-Add-Marketplace-Lister-extension-API-and-admin-field.patch`
   - (Download from GitHub after the finance PR is merged, or copy from this cloud workspace.)
6. Apply it: `git am "path\to\0001-Add-Marketplace-Lister-extension-API-and-admin-field.patch"`
7. Push: `git push -u origin cursor/site-extension-api-e890`
8. Open a Pull Request on GitHub: `pepit0/site` → merge to `main`.

## Option B — GitHub web (no Git)

If the finance PR includes the patch folder, download the `.patch` file from GitHub, then on your PC with Git installed use Option A step 6–8.

## Option C — Ask a collaborator

Give write access to the Cursor/GitHub integration on `pepit0/site`, or merge the branch from a machine that already has commit `ae6d7d3`.

---

## After the site code is deployed

### 1. Supabase (marketing project) — **you**

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → your **marketing** project (the one the website uses).
2. **SQL Editor** → set role to **postgres**.
3. Open and run the full contents of:
   `sql/marketing/24_inventory_marketplace_extension.sql`
   (from the site repo after you merge the PR.)

### 2. Vercel (site project) — **you**

1. [Vercel](https://vercel.com) → project for **temptmotorsports.com** (the `site` repo).
2. **Settings → Environment Variables** → add:

| Name | Value |
|------|--------|
| `EXTENSION_API_KEY` | Generate a long random secret (keep it somewhere safe) |
| `SUPABASE_URL` | `https://xxxx.supabase.co` (marketing project) |
| `SUPABASE_SERVICE_ROLE_KEY` | From Supabase → Settings → API → **service_role** (secret) |

3. **Redeploy** production (Deployments → … → Redeploy).

PowerShell to generate a key:

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

### 3. Chrome extension — **you**

1. Extension Options (already loaded):
   - **CRM Base URL** → `https://temptmotorsports.com` (no trailing slash)
   - **API Key** → **exact same** string as `EXTENSION_API_KEY` on Vercel
2. Click **Save** → allow host permission when Chrome asks.

### 4. Smoke test — **you**

In PowerShell (replace `YOUR_KEY`):

```powershell
curl.exe -H "x-api-key: YOUR_KEY" https://temptmotorsports.com/api/extension/inventory
```

You should get JSON (an array of vehicles), not HTML or 404.

### 5. End-to-end test — **you**

1. Extension popup → inventory list loads.
2. **Post to Marketplace** on a unit → Facebook create page opens.
3. Form fills (may need selector tweaks if Facebook changed UI).
4. Attach photos manually → publish on Facebook.
5. **Mark as Posted** in the banner → check Supabase: `posted_to_marketplace = true`.

---

## What the cloud agent already did

- Chrome extension scaffold in **finance** repo: `posting/marketplace-lister/` (PR #1).
- Site API implementation committed locally on branch `cursor/site-extension-api-e890` (commit `ae6d7d3`).
- Patch file exported to `posting/site-extension-api-patch/` in the finance repo for you to apply.

## Full technical docs

After merge, see `docs/MARKETPLACE_EXTENSION.md` in the **site** repo.
