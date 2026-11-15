# Subprime tool setup (separate from CRM)

Standalone **Car Finance Dashboard / Decision Engine** with its own Supabase project:

| | |
|---|---|
| **Project** | Subprime Tool |
| **Ref / URL** | `beezujpcoskusrbvsuka` → https://beezujpcoskusrbvsuka.supabase.co |
| **Org** | Subprime Tool (separate from Finance Tool / CRM) |

CRM prod/playground are unchanged.

---

## Cursor + Supabase MCP

This repo includes `.cursor/mcp.json` scoped to `beezujpcoskusrbvsuka`. After changing it:

1. **Cursor Settings → Tools & MCP** → authenticate **subprime-tool-supabase** with the **Subprime Tool** org (not Finance Tool, not another project).
2. Confirm `list_tables` on the MCP shows an empty `public` schema (or only `finance_access_allowlist` after SQL).

If MCP still shows `uhjijvhxdzwzrouzjbho` or dub/social tables, disconnect the old `user-supabase` server or re-auth against the correct org.

---

## One-time Supabase setup (2 dashboard clicks)

Your `.env.local` is already wired to `beezujpcoskusrbvsuka`. MCP could not run SQL on this project yet (Cursor was still linked to a different Supabase project). Do these two steps in the dashboard:

### 1. Run auth SQL

[SQL Editor → New query](https://supabase.com/dashboard/project/beezujpcoskusrbvsuka/sql/new) → paste **`sql/subprime_tool_bootstrap.sql`** → **Run**.

### 2. Create login user

[Authentication → Users](https://supabase.com/dashboard/project/beezujpcoskusrbvsuka/auth/users) → **Add user** → `danielsharifian@gmail.com` + password.

### 3. Auth redirect URLs

[URL configuration](https://supabase.com/dashboard/project/beezujpcoskusrbvsuka/auth/url-configuration) → add:

- `http://localhost:5173/**`
- Your Vercel URL when deployed

---

## Local dev with login

Copy anon key from **Settings → API**, then:

```powershell
.\scripts\New-SubprimeToolEnv.ps1 -AnonKey "YOUR_ANON_KEY"
npm run dev:finance
```

Sign in with the user from step 2.

## Local dev without login (demo)

```powershell
.\scripts\New-SubprimeToolEnv.ps1 -SkipAuth
npm run dev:finance
```

---

## Vercel (`pepit0/subprime-tool`)

```
VITE_SUPABASE_URL=https://beezujpcoskusrbvsuka.supabase.co
VITE_SUPABASE_ANON_KEY=<anon from dashboard>
VITE_CRM_APP_URL=https://crm.sharifian.cfd/crm
```

Build: `npm run build` · Output: `dist` · Do **not** set `VITE_FINANCE_SKIP_AUTH` on Vercel.

---

## Architecture

```text
beezujpcoskusrbvsuka (Subprime Tool org)  →  Auth only
subprime-tool Vercel                       →  Finance UI
CRM Supabase/Vercel                        →  Separate login
```

See also: [DEPLOYMENT_TOPOLOGIES.md](DEPLOYMENT_TOPOLOGIES.md), [tenants.example.json](../tenants.example.json).
