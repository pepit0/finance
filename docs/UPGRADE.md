# Tenant upgrade runbook

Upgrades are **opt-in per tenant**. There is no automatic rollout to production databases.

## Before you start

1. Note the tenant's current version:
   - CRM → Settings → CRM branding → **About** → *Installed release*
   - Or query: `select app_version from crm_org_settings where id = 'default';`
2. Compare with the git tag / `package.json` version you are deploying.
3. Read [CHANGELOG.md](../CHANGELOG.md) for breaking changes.

## Upgrade steps

### 1. Database

1. Back up the Supabase project (dashboard → Database → Backups).
2. From [MIGRATIONS.md](MIGRATIONS.md), run only SQL files **after** the tenant's last applied migration.
3. If new Edge Functions or secrets are required, deploy functions and update Supabase secrets before switching traffic.

### 2. Application

1. Check out the release tag, e.g. `git checkout v0.1.0`.
2. Build the correct product:
   - CRM tenant: `npm run build:crm`
   - Finance tenant: `npm run build:finance`
   - Combined (legacy): `npm run build`
3. Deploy to the tenant's Vercel project (or promote the matching preview).
4. Confirm env vars unchanged except any documented in the release notes.

### 3. Record version

After smoke testing, update the tenant row:

```sql
update public.crm_org_settings
set app_version = '0.1.0', updated_at = now()
where id = 'default';
```

Update your local `tenants.json` (from `tenants.example.json`) with the same version.

### 4. Smoke test

- Sign in on production URL.
- CRM: customers list, one call/text flow (if Twilio enabled), Settings → About shows new version.
- Finance: lender grid loads, CRM link opens correct URL.
- PWA: Add to Home Screen still works after deploy.

## Rollback

1. Redeploy the previous Vercel deployment from the dashboard.
2. **Do not** run down migrations unless you have tested rollback SQL; prefer restore from backup for schema issues.
3. Revert `app_version` in `crm_org_settings` if you updated it.

## Version matrix (example)

| Tenant | Product | Supabase | Vercel project | Current |
|--------|---------|----------|----------------|---------|
| Temptation CRM | `crm` | prod (shared) | temptation-crm | 0.1.0 |
| Temptation Finance | `finance` | prod (shared) | temptation-finance | 0.1.0 |
| Test Dealer | `crm` | test-dealer | test-dealer-crm | 0.1.0 |
| Playground | `crm` | playground | preview branch | 0.1.0 |
