# Playground environment

Use the playground to validate white-label changes **without touching Temptation production**.

**Live demo:** `https://demo.sharifian.cfd/crm` (dedicated Vercel project, Production branch `playground`).

## Rules

- **Never** point playground at Temptation prod Supabase credentials.
- Use a **dedicated** Supabase dev project.
- Use fake data from `sql/seed_playground.sql` only.

## Git branch

```bash
git checkout playground
git pull
# feature branches merge here first
git push origin playground   # deploys demo.sharifian.cfd
```

When ready for prod: merge `playground` → `main` → `crm.sharifian.cfd` redeploys.

## Supabase (playground project)

1. Create a new Supabase project (e.g. `crm-playground`).
2. Run all migrations from [MIGRATIONS.md](MIGRATIONS.md) (or `.\scripts\Apply-PlaygroundMigrations.ps1 -IncludeSeed`).
3. Run `sql/seed_playground.sql` if not bundled in the migration script.
4. Create a test user and grant CRM access (`crm_access_allowlist`).
5. Deploy Edge Functions if testing voice/SMS (optional; use Twilio dev credentials).

## Vercel (dedicated playground project)

1. Create a **separate** Vercel project (e.g. `crm-playground`) — not the prod CRM project.
2. **Settings → Environments → Production → Branch Tracking:** `playground`
3. **Build command:** `npm run build:crm` · **Output:** `dist`
4. **Production** environment variables:

| Variable | Value |
|----------|-------|
| `VITE_PRODUCT` | `crm` |
| `VITE_SUPABASE_URL` | Playground project URL |
| `VITE_SUPABASE_ANON_KEY` | Playground anon key |
| `VITE_VAPID_PUBLIC_KEY` | Dev VAPID public key (optional) |

5. Attach domain `demo.sharifian.cfd` (optional but recommended).
6. Playground Supabase Auth → add `demo.sharifian.cfd/**` and the project `*.vercel.app` URL.

### Optional: feature-branch previews

Branch off `playground` for risky work → Vercel Preview URL → merge to `playground` when happy. Demo domain only updates on `playground` branch pushes.

## Local dev against playground

```powershell
.\scripts\New-PlaygroundEnv.ps1
npm run dev
```

Or copy [`.env.playground.example`](../.env.playground.example) to `.env.local` manually.

Open `http://localhost:5173/crm`.

## Validation checklist

- [ ] Login works with playground user
- [ ] Customers list shows seed data (not Temptation prod)
- [ ] Settings → About shows `app_version` and build version
- [ ] Footer shows Demo CRM or seeded branding
- [ ] `npm run build:crm` succeeds
- [ ] PWA install uses neutral "CRM" name

## Promote to main

1. Verify on `demo.sharifian.cfd/crm`.
2. Merge `playground` → `main`.
3. Verify on `crm.sharifian.cfd/crm`.
4. Follow [UPGRADE.md](UPGRADE.md) per tenant (SQL deltas + `app_version`).

## Rollback

- **Demo broken:** Vercel playground project → Deployments → Promote previous Production deploy.
- **Git:** `git revert` on `playground` branch, then push.

See [POST_CUTOVER_CLEANUP.md](POST_CUTOVER_CLEANUP.md) for day-to-day workflow.
