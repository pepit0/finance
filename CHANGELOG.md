# Changelog

All notable changes to this project are documented here. Version numbers follow [SemVer](https://semver.org/).

## [Unreleased]

## [0.1.1] - 2026-06-17

### Changed

- **CRM-first default** — `main` merges product split from `playground`; `npm run dev` and Vercel deploys default to `VITE_PRODUCT=crm` (`build:crm`). Finance dashboard remains available via `build:finance` / `dev:finance`.
- **Access denied UX** — CRM-only deploys without `VITE_FINANCE_APP_URL` show Sign out instead of a broken finance link.

### Added

- **Deployment topologies** — `docs/DEPLOYMENT_TOPOLOGIES.md` (CRM subdomain, customer website, website + `/crm` rewrites + lead funnel).
- **Temptation cutover guide** — `docs/TEMPTATION_CUTOVER.md` for manual prod CRM-only migration.
- **Post-cutover cleanup** — `docs/POST_CUTOVER_CLEANUP.md` (apex redirects, Auth URL hygiene, smoke test, day-to-day workflow).
- **Finance local dev** — `.env.finance.example`, `scripts/New-FinanceEnv.ps1`, `npm run dev:finance` / `dev:full`.
- **Playground local dev** — `scripts/New-PlaygroundEnv.ps1`, updated `docs/PLAYGROUND.md` for dedicated demo deploy.
- **Tenant registry** — `tenants.example.json` with sharifian.cfd domains; local `tenants.json` gitignored.

### Infrastructure

- Prod CRM at `crm.sharifian.cfd` (`main` branch, prod Supabase).
- Playground demo at `demo.sharifian.cfd` (`playground` branch, playground Supabase).

## [0.1.0] - 2026-06-17

### Added

- **White-label product split** — `VITE_PRODUCT` (`full` | `finance` | `crm`) with separate build scripts (`build:crm`, `build:finance`) and cross-app URL env vars.
- **White-label shell** — DB-backed `footer_text` and `app_version` on `crm_org_settings`; neutral code defaults for header copy and PWA install shell.
- **Provisioning docs** — `docs/PROVISIONING.md`, `docs/PLAYGROUND.md`, `docs/MIGRATIONS.md`, `docs/UPGRADE.md`, `docs/CLOUD_SETUP.md`.
- **Playground seed** — `sql/seed_playground.sql` for fake CRM data on dev projects.
- **Settings → About** — read-only installed release and build version in CRM branding settings.

### CRM features (included in first licensed release)

- Customer pipeline, tasks, edit history, and stale-lead notifications.
- Twilio voice (call logging, recordings) and SMS chat threads.
- Team directory, permissions, avatars, and web push (PWA).
- Org branding: accent, light/dark mode, control shapes, header copy, label colors.

[0.1.1]: https://github.com/pepit0/finance/releases/tag/v0.1.1
[0.1.0]: https://github.com/pepit0/finance/releases/tag/v0.1.0
