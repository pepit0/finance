# Playground environment

Use the playground to validate white-label changes **without touching Temptation production**.

## Rules

- **Never** point playground at Temptation prod Supabase credentials.
- Use a **dedicated** Supabase dev project.
- Use fake data from `sql/seed_playground.sql` only.

## Git branch

```bash
git checkout -b playground
# merge feature branches here first
git push -u origin playground
```

## Supabase (playground project)

1. Create a new Supabase project (e.g. `crm-playground`).
2. Run all migrations from [MIGRATIONS.md](MIGRATIONS.md).
3. Run `sql/seed_playground.sql`.
4. Create a test user and grant CRM access.
5. Deploy Edge Functions if testing voice/SMS (optional; use Twilio dev credentials).

## Vercel preview

1. In the Vercel project, enable **preview deployments** for the `playground` branch.
2. Set **Preview** environment variables:

| Variable | Value |
|----------|-------|
| `VITE_PRODUCT` | `crm` |
| `VITE_SUPABASE_URL` | Playground project URL |
| `VITE_SUPABASE_ANON_KEY` | Playground anon key |
| `VITE_VAPID_PUBLIC_KEY` | Dev VAPID public key (optional) |

3. Build command for previews: `npm run build:crm` (set at project level or override in `vercel.json` if needed).

## Local dev against playground

In `.env.local`:

```env
VITE_PRODUCT=crm
VITE_SUPABASE_URL=https://YOUR_PLAYGROUND_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your_playground_anon_key
```

```bash
npm run dev
```

Open `http://localhost:5173/crm` (or `/` redirects to `/crm` when `VITE_PRODUCT=crm`).

## Validation checklist

- [ ] Login works with playground user
- [ ] Customers list shows seed data
- [ ] Settings → About shows `app_version` and build version
- [ ] Footer shows generic "CRM" or seeded branding
- [ ] `npm run build:crm` succeeds in CI/preview
- [ ] PWA install uses neutral "CRM" name

## Promote to main

1. Merge `playground` → `main`.
2. Tag release: `git tag v0.1.0 && git push origin v0.1.0`
3. Follow [UPGRADE.md](UPGRADE.md) per tenant.
