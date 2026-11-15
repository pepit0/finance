# Multi-tenant conversion plan (Model B)

**Status:** Working runbook — follow top-to-bottom; do not skip gates.  
**Replaces as default path:** Model A in [WHITE_LABEL_LICENSING_PLAN.md](WHITE_LABEL_LICENSING_PLAN.md)  
**Related:** [DEPLOYMENT_TOPOLOGIES.md](DEPLOYMENT_TOPOLOGIES.md), [CRM_BRIDGE.md](CRM_BRIDGE.md), [PLAYGROUND.md](PLAYGROUND.md), [PROVISIONING.md](PROVISIONING.md), [MIGRATIONS.md](MIGRATIONS.md)

---

## 0. How to use this document

1. Read **§1 North star** and **§2 Locked decisions** first.
2. Execute **§10 Phases** in order. Each phase has **Entry**, **Work**, **Exit gate**. Do not start the next phase until the gate passes.
3. Use **§11 Verification** every time RLS, Edge, or auth changes.
4. When stuck, check **§16 Decision log** and **§17 Progress tracker**.
5. Update the progress tracker checkboxes in this file as you complete work (keeps the team oriented).

**Rule:** Temptation production is untouched until **Phase 5**. All coding and schema experiments happen on **playground** (and local) first.

---

## 1. North star

| Goal | Target |
|------|--------|
| Cost | **One** production Supabase project for all licensee CRM + website data |
| Isolation | `org_id` + RLS (and Storage path prefixes); never rely on “separate project” for tenant isolation |
| SKUs | **CRM-only**, **Website-only**, **Website + CRM** — same org row, different flags |
| Repo | CRM app at repo root; licensee sites under `sites/<slug>/`; Feath marketing stays `product-site/` |
| Temptation site | May remain external + webhook indefinitely |
| Not in scope | Self-serve signup marketplace, one shared Twilio number for all orgs, finance multi-tenancy, Stripe billing |

**Success:** Provision a new CRM and/or website tenant **without creating a new Supabase project**, with proven cross-org isolation and Temptation still healthy.

---

## 2. Locked decisions (defaults)

These are the plan defaults so implementation does not stall. Change only via **§16 Decision log**.

| # | Topic | Decision |
|---|--------|----------|
| D1 | Host → org | Table `crm_org_domains` (hostname → `org_id`). Support custom domains from day one. Subdomains are just rows in that table. |
| D2 | Membership | **One primary org per user at cutover.** Schema allows many (`crm_org_members`), but UI has no org switcher until a later phase. JWT carries `org_id` (active org). |
| D3 | Website-only leads | Store in shared DB. **Email notify** (Resend per org) for v1. No Feath super-admin inbox UI until needed. Upgrade to CRM attaches ingest → system leads. |
| D4 | CRM deploy | **One shared CRM Vercel project** + many custom domains (each mapped in `crm_org_domains`). Per-tenant Vercel only if a customer requires isolation later. |
| D5 | Site deploy | **One Vercel project per site** under `sites/<slug>/` (different brand/build). All point at the **same** Supabase URL/anon key + `VITE_ORG_SLUG`. |
| D6 | Temptation marketing | Keep external `site` repo + webhook until explicitly migrated. Ingest must accept org routing (or Temptation-as-default) so cutover does not break leads. |
| D7 | Twilio | **One phone number per org that uses voice/SMS.** Credentials stored per org in DB (encrypted/Vault) or Edge secret map keyed by number → org. Shared Account SID allowed if multiple numbers under one Twilio account. |
| D8 | VAPID / web push | **One VAPID keypair for the shared CRM app** (same as today’s single-project model). Subscriptions rows include `org_id`; send only to that org’s users. |
| D9 | Feath Board / product-site backend | **Not licensee data.** Prefer **keep on playground Supabase** (or a dedicated Feath-internal project). Do **not** mix `feath_board_*` into licensee prod RLS work. If currently on Temptation prod, move or wall off before opening org #2. |
| D10 | Control plane v1 | **Manual:** SQL + docs + `tenants.json` (local). No admin app in this conversion. |
| D11 | Dual-run | Phases 1–2 stay **additive** where possible. Ship a `MULTI_TENANT=1` (or schema version) cut only when playground gates pass. Old single-tenant app must not be pointed at half-migrated prod. |
| D12 | Abuse (public forms) | Per-org **site key** (secret in site env, verified in RPC). Rate-limit in Edge or RPC (simple per-IP/org counters). CAPTCHA optional later. |
| D13 | Offboarding | Runbook: export org data → disable `status=suspended` → delete storage prefix → hard-delete org rows (scripted). Not automated in v1. |
| D14 | Demo | Playground remains separate Supabase. Demo org(s) seeded there; `demo.sharifian.cfd` keeps pointing at playground, never prod. |

---

## 3. Product model

### 3.1 Org (= tenant)

```text
crm_orgs
  id              uuid PK
  slug            text unique   -- temptation, acme-motors
  display_name    text
  has_crm         boolean
  has_website     boolean
  status          text          -- provisioning | active | suspended
  created_at      timestamptz
```

Capabilities:

| has_crm | has_website | SKU |
|---------|-------------|-----|
| true | false | CRM-only |
| false | true | Website-only |
| true | true | Website + CRM |

Upgrade path: flip flags + run small provisioning steps (Twilio, domain, site deploy).

### 3.2 SKU matrix

| SKU | Staff Auth | Public site | Data | Twilio | Deploys |
|-----|------------|-------------|------|--------|---------|
| CRM-only | Org members | No | CRM tables | Optional | Shared CRM Vercel + domain |
| Website-only | None (CRM) | Yes | Lead tables only | No | `sites/<slug>` Vercel |
| Website + CRM | Org members | Yes | Leads + CRM; form → system lead | Optional | Site + CRM domain/rewrite |

### 3.3 Lead flows

**New in-repo sites (preferred):**

```text
Browser form
  → RPC submit_site_lead(org_slug, site_key, payload)
  → website_leads row (org_id)
  → if org.has_crm: create system lead / customer (same org)
  → optional Resend using org notify config
```

**Temptation external (legacy):**

```text
site repo → marketing Supabase → webhook
  → ingest-marketing-preapproval (secret + org_id or temptation default)
  → same CRM ingest path
```

### 3.4 Repo layout (target)

```text
finance/
  src/                         # multi-tenant CRM SPA
  sql/                         # Model B migrations (see §9)
  supabase/functions/          # org-aware Edge Functions
  sites/
    _template/                 # starter marketing site
    <slug>/                    # customer sites
  product-site/                # Feath.xyz only (not a licensee)
  docs/MULTI_TENANT_PLAN.md    # this file
  tenants.example.json         # ops registry (updated for Model B)
```

---

## 4. Data model (target)

### 4.1 New / core tables

| Table | Purpose |
|-------|---------|
| `crm_orgs` | Tenant root |
| `crm_org_members` | `user_id`, `org_id`, `role` (`owner` \| `admin` \| `staff`) |
| `crm_org_domains` | `hostname` unique → `org_id` (CRM and/or site hosts) |
| `crm_org_settings` | **Per org** (replace single-row `id=default` check) |
| `crm_org_twilio` | `org_id`, phone E.164, account sid ref, webhook routing |
| `crm_org_notify` | Resend from/to JSON per org (or columns) |
| `crm_site_keys` | `org_id`, public site key hash for form RPC |
| Website lead table(s) | Public submissions keyed by `org_id` |

### 4.2 Existing CRM tables — add `org_id`

All licensee CRM tables gain `org_id uuid not null references crm_orgs(id)` after backfill, including (non-exhaustive):

- `crm_customers`, `crm_activities`, `crm_customer_tasks`, `crm_customer_edit_history`, `crm_customer_lender_outcomes`
- `crm_user_directory` (scoped per org — see §5), `crm_directory_groups`, `crm_directory_admins` / replace with member roles
- `crm_pipeline_stages`, `crm_lenders`, `crm_permission_defs` / position permissions as needed
- `crm_phone_call_sessions`, `crm_sms_threads`, `crm_sms_read_cursors`, `crm_push_subscriptions`
- `crm_public_preapproval_leads`, `crm_system_leads`, `crm_notifications`
- `crm_todo_items`, `crm_todo_daily_logs`, `crm_todo_default_templates`
- Deprecate global `crm_access_allowlist` in favor of membership

### 4.3 Unique constraints (must become per-org)

| Current global uniqueness | Becomes |
|---------------------------|---------|
| pipeline / lender / group `slug` | `(org_id, slug)` |
| one default directory group | one default **per org** |
| allowlist email PK | membership per org (email unique per org if needed) |
| `marketing_lead_id` | `(org_id, marketing_lead_id)` |
| directory `user_id` as global PK | `(org_id, user_id)` or directory row per membership |

### 4.4 Storage

Buckets stay shared; **object paths** must start with `{org_id}/…`:

- `crm-branding`, `crm-call-recordings`, `crm-credit-app-documents`, `crm-team-avatars`

Policies: authenticated user may only read/write paths for orgs they belong to (and capability).

### 4.5 Explicitly out of licensee tenancy

| Object | Handling |
|--------|----------|
| `feath_board_*`, feath shares, bug attachments | Feath-internal project or playground only (D9) |
| Finance-only tables/routes | Deferred; not part of this conversion |

---

## 5. Auth & access model

### 5.1 Replace project-wide gate

| Today | Model B |
|-------|---------|
| `user_has_crm_access()` | `user_has_crm_access_for_org(org_id)` / `user_can_access_crm()` using JWT `org_id` + `has_crm` + membership |
| `crm_access_allowlist` | `crm_org_members` |
| Hardcoded master email | `role = owner` on membership |
| `crm_directory_admins` global | `role in (owner, admin)` |
| `app_metadata.crm_access` bool | `app_metadata.org_id` + `app_metadata.org_role` (and optional `crm_access` for back-compat during dual-run) |

### 5.2 Invite / provisioning flow (v1 manual)

1. Create Auth user (Supabase Dashboard or invite email).
2. Insert `crm_org_members` (`org_id`, `user_id`, `role`).
3. Set `app_metadata.org_id` / `org_role` (service role script or Dashboard).
4. Ensure directory row for that org (display name, position).
5. User signs in on that org’s CRM host → branding + RLS use domain → org → JWT org match.

**Mismatch rule:** If host maps to org A but JWT `org_id` is B → deny (fail closed). Forces correct portal URL.

### 5.3 Login branding

Replace `crm_public_login_branding()` reading `id=default` with:

- Input: hostname (or slug query for demos)
- Lookup `crm_org_domains` → org → settings/branding
- Anon-safe RPC only returns public brand fields

---

## 6. Edge Functions & secrets

### 6.1 Inventory (all must become org-aware)

| Function | Change |
|----------|--------|
| `twilio-voice`, `twilio-call-status`, `twilio-initiate-call`, `twilio-recording`, `twilio-recording-url` | Resolve org from To-number / session; scope DB by `org_id` |
| `twilio-send-sms`, `twilio-inbound-sms`, `twilio-sms-status` | Same |
| `_shared/twilio.ts` | Stop `.eq("id","default")`; load org Twilio + settings by org |
| `ingest-marketing-preapproval` | Org from payload / header / secret map; Temptation default allowed |
| `check-stale-leads` | Per-org loop or filter |
| `_shared/webPush.ts` | Filter subscriptions by org |

### 6.2 Secrets strategy

| Secret | Scope |
|--------|--------|
| `SUPABASE_*` | Platform-injected (unchanged) |
| Twilio auth | Per org via `crm_org_twilio` + Vault **or** Edge secrets `TWILIO_AUTH_<orgSlug>` — pick one implementation in Phase 3; document in PROVISIONING |
| `MARKETING_WEBHOOK_SECRET` | Global fallback for Temptation **plus** optional per-org secrets / site keys |
| `VAPID_*` | Shared for CRM app (D8) |
| Resend | Per org in `crm_org_notify` (API key in Vault or shared Resend account + per-org from/to) |

### 6.3 Cron / scheduled

`check-stale-leads` schedule stays; implementation must not notify wrong org. Document cron config in Phase 3 notes.

---

## 7. Frontend (CRM)

| Area | Work |
|------|------|
| Org resolution | On boot: hostname → `crm_org_domains` (RPC) → compare to JWT `org_id` |
| Access gate | Membership + `has_crm` + host match |
| `crmApi.ts` | Prefer RLS + JWT; still stamp `org_id` on inserts; remove `id=default` |
| Settings / branding | Load/save settings for current org; uploads to `{org_id}/…` |
| Realtime | Channel names include `org_id` (presence + notifications) |
| Env | Shared `VITE_SUPABASE_*`; **no** per-tenant Supabase URL for licensees |

Build flag `VITE_PRODUCT=crm` unchanged.

---

## 8. Websites (`sites/`)

| Piece | Detail |
|-------|--------|
| Template | `sites/_template` — Vite marketing starter, form → `submit_site_lead` |
| Env | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_ORG_SLUG`, `VITE_SITE_KEY` |
| Website-only | Leads stored; email notify; no CRM users |
| Website + CRM | Same form; RPC also creates system lead |
| `/crm` rewrite | Optional on site `vercel.json` → shared CRM deployment URL |
| Temptation | Out of band (D6) |

---

## 9. Migration strategy (SQL)

### 9.1 New migration series (playground first)

Create an ordered series (names illustrative — adjust when implementing):

| Order | File (proposed) | Purpose |
|------:|-----------------|---------|
| 1 | `sql/mt_01_crm_orgs.sql` | orgs, domains, members |
| 2 | `sql/mt_02_org_settings.sql` | per-org settings; migrate from default row |
| 3 | `sql/mt_03_add_org_id_columns.sql` | nullable `org_id` on all CRM tables |
| 4 | `sql/mt_04_backfill_org.sql` | playground: assign seed orgs; prod: Temptation id |
| 5 | `sql/mt_05_org_id_not_null_fks.sql` | constraints |
| 6 | `sql/mt_06_unique_indexes.sql` | composite uniques |
| 7 | `sql/mt_07_rls_helpers.sql` | `current_org_id()`, membership helpers |
| 8 | `sql/mt_08_rls_policies.sql` | rewrite policies |
| 9 | `sql/mt_09_storage_paths.sql` | storage policies |
| 10 | `sql/mt_10_website_leads.sql` | site lead tables + submit RPC |
| 11 | `sql/mt_11_twilio_notify.sql` | org twilio + notify + site keys |
| 12 | `sql/mt_12_auth_rpcs.sql` | branding by host, access RPCs |
| 13 | `sql/mt_13_seed_playground_orgs.sql` | Org A / Org B + members |

Update [MIGRATIONS.md](MIGRATIONS.md) with a **Model B** section when files exist. Keep Model A list for legacy/reference until deprecated.

### 9.2 Dual-run rules

- Until Phase 5: **prod Temptation stays on Model A schema**.
- Playground may be reset if migrations go wrong.
- Do not deploy Model B frontend to Temptation Vercel until Phase 5 gate.

### 9.3 Backfill (prod Phase 5)

1. Insert `crm_orgs` row `slug=temptation`, `has_crm=true`, `has_website=true` (website external).
2. Insert domain `crm.sharifian.cfd` → that org.
3. Set all existing CRM rows `org_id = temptation`.
4. Map every Auth user with CRM access → `crm_org_members`.
5. Move branding files to `{org_id}/…` or support read fallback once.
6. Register Twilio number → org.
7. Webhook: pass org id or default slug temptation in ingest.

---

## 10. Phases (execute in order)

### Phase 0 — Orient & prepare

**Entry:** This doc accepted.  
**Work:**

- [x] Confirm §2 locked decisions (or log changes in §16)
- [x] Confirm playground Supabase + Vercel still valid ([PLAYGROUND.md](PLAYGROUND.md)) — project `crm-playground` / `mmwirtqvgietltlibfbu` healthy
- [x] Inventory Feath Board: which Supabase project hosts it? Plan wall-off/move (D9) — see [MT_PHASE0_NOTES.md](MT_PHASE0_NOTES.md)
- [x] Write rollback notes draft (§12) into a short checklist you can execute under stress — [MT_ROLLBACK_CHECKLIST.md](MT_ROLLBACK_CHECKLIST.md)
- [x] Create git branch strategy: `playground` for MT work; tag before Phase 5 — see [MT_PHASE0_NOTES.md](MT_PHASE0_NOTES.md)

**Exit gate:** PASSED (2026-08-07). Decisions confirmed; playground reachable; Feath inventory recorded; rollback checklist exists. → **Phase 1**

---

### Phase 1 — Foundation (serial)

**Entry:** Phase 0 gate passed.  
**Work:**

- [x] Implement `mt_01`–`mt_02` (orgs, members, domains, settings-per-org) — applied on crm-playground
- [x] Helpers for membership (not full RLS cut yet) — `current_org_id`, `user_in_org`, `org_has_crm`, `user_org_role`
- [x] Script/docs: invite user → member → app_metadata — [MT_INVITE_USER.md](MT_INVITE_USER.md)
- [ ] Seed two orgs on playground (A/B) with separate users — **orgs/domains seeded**; **members still need manual attach** (see invite doc; 3 playground Auth users)
- [x] Design Temptation backfill script (do not run on prod) — [sql/mt_backfill_temptation_DESIGN.sql](../sql/mt_backfill_temptation_DESIGN.sql)

**Exit gate:** PENDING members — orgs `org-a` / `org-b` exist; settings linked for org-a. Attach ≥1 user to org-a and ≥1 different user to org-b via [MT_INVITE_USER.md](MT_INVITE_USER.md), then mark gate passed.

---

### Phase 2 — `org_id` + RLS (serial, highest risk)

**Entry:** Phase 1 gate passed.  
**Work:**

- [ ] `mt_03`–`mt_09`: columns, backfill, NOT NULL, uniques, RLS rewrite, storage
- [ ] Replace allowlist/master email semantics
- [ ] Security tests §11.1 all pass on playground
- [ ] Add `sql/mt_rls_smoke.sql` (queries that must return 0 cross-org rows)

**Exit gate:** Org A cannot read Org B (tables + storage). Smoke SQL committed.

---

### Phase 3 — Edge Functions (serial)

**Entry:** Phase 2 gate passed (or late Phase 2 overlap only on non-Twilio helpers).  
**Work:**

- [ ] Org routing for all Twilio functions + `_shared/twilio.ts`
- [ ] Ingest org-aware + Temptation-compatible
- [ ] In-DB `submit_site_lead` path for in-repo sites
- [ ] Stale leads + web push org-scoped
- [ ] Per-org notify config
- [ ] Deploy functions to **playground only**; test with Twilio trial/dev numbers if available

**Exit gate:** Wrong org/secret rejected; inbound To-number maps to correct org; stale job does not cross-notify.

---

### Phase 4 — Frontend + sites (parallel OK)

**Entry:** Phase 1 done; Phase 2 strongly preferred before CRM UI QA.  
**Tracks (multitask-friendly):**

**4a CRM UI**

- [ ] Host → org resolution + JWT match
- [ ] Access gate
- [ ] Remove `default` org settings assumptions
- [ ] Branding uploads / login branding
- [ ] Realtime channel namespacing
- [ ] Full §11.2 feature matrix on Org A and Org B

**4b Sites**

- [ ] `sites/_template` + env example
- [ ] Form → `submit_site_lead`
- [ ] Docs: Website-only vs Website+CRM provisioning
- [ ] Optional `/crm` rewrite example

**4c Hardening**

- [ ] Expand `mt_rls_smoke.sql` / checklist automation notes
- [ ] Update `tenants.example.json` shape for Model B

**Exit gate:** Both orgs usable in CRM UI; template site creates lead in correct org; Website-only path does not grant CRM.

---

### Phase 5 — Temptation production cutover (serial)

**Entry:** Phase 2–4 gates passed on playground; backup ready.  
**Work:**

- [ ] Announce maintenance window if needed
- [ ] Full Supabase backup / PITR note
- [ ] Pause or monitor marketing webhook
- [ ] Apply Model B SQL + Temptation backfill
- [ ] Deploy Edge Functions to prod
- [ ] Deploy CRM frontend (Model B) to Temptation Vercel
- [ ] Remap Twilio webhooks if URL unchanged still verify signature + To-number map
- [ ] Run §11.3 prod smoke immediately
- [ ] Confirm external Temptation site still creates system leads
- [ ] Unpause webhook / monitor for 24h

**Exit gate:** Staff can work; website leads flow; voice/SMS OK if previously enabled; no errors in Edge logs for cross-org.

**Rollback (§12):** If smoke fails within window → restore DB + redeploy previous Vercel + previous function versions.

---

### Phase 6 — Second tenant + ops freeze

**Entry:** Phase 5 stable (≥1 day recommended).  
**Work:**

- [ ] Provision org #2 (CRM-only recommended first) on **same** Supabase
- [ ] Attach domain; invite users; seed pipeline/lenders defaults per org
- [ ] Re-run cross-org security checks (careful)
- [ ] Rewrite [PROVISIONING.md](PROVISIONING.md) for Model B
- [ ] Mark Model A “legacy” in WHITE_LABEL doc
- [ ] Record lessons in §16

**Exit gate:** Two live orgs isolated; a stranger can follow PROVISIONING to add org #3 without a new Supabase project.

---

## 11. Verification matrix

Copy results into notes or check here when run.

### 11.1 Security (playground, two orgs)

| ID | Check | Pass |
|----|--------|------|
| S1 | Org A customer list only A | ☐ |
| S2 | Org A cannot SELECT/UPDATE Org B by id | ☐ |
| S3 | Org A cannot read Org B storage object | ☐ |
| S4 | Anon `submit_site_lead` slug A only writes A | ☐ |
| S5 | Bad site key / webhook secret → reject | ☐ |
| S6 | Org B cannot call Org A admin RPCs | ☐ |
| S7 | Host for A + JWT for B → access denied | ☐ |
| S8 | Presence/realtime does not show other org users | ☐ |

### 11.2 CRM features (each org)

| ID | Check | Pass |
|----|--------|------|
| C1 | Login / deny non-member | ☐ |
| C2 | Customers, pipeline, lenders | ☐ |
| C3 | Tasks, activities, todos | ☐ |
| C4 | System lead → assign → customer | ☐ |
| C5 | Branding + login appearance | ☐ |
| C6 | SMS in/out (if enabled) | ☐ |
| C7 | Voice + recording (if enabled) | ☐ |
| C8 | Notifications / stale leads scoped | ☐ |

### 11.3 Website SKUs

| ID | Check | Pass |
|----|--------|------|
| W1 | Website-only lead stored; no CRM login | ☐ |
| W2 | Website+CRM → system lead | ☐ |
| W3 | CRM-only works without site | ☐ |
| W4 | Temptation external webhook (prod) | ☐ |

### 11.4 Prod smoke (Phase 5)

| ID | Check | Pass |
|----|--------|------|
| P1 | Login on crm.sharifian.cfd | ☐ |
| P2 | Open existing customer | ☐ |
| P3 | New website pre-approval appears | ☐ |
| P4 | Outbound SMS or call smoke | ☐ |
| P5 | Edge logs clean for ingest/Twilio | ☐ |

---

## 12. Rollback procedure (prod)

**Prepare before Phase 5:**

1. Supabase: enable PITR / take snapshot; note timestamp `T0`.
2. Vercel: note current production deployment URL/id.
3. Edge: note deployed versions or keep previous bundle artifacts.
4. Webhook: know how to disable marketing DB webhook quickly.

**If cutover fails:**

1. Disable marketing webhook (stop new writes).
2. Redeploy previous CRM Vercel deployment.
3. Redeploy previous Edge Functions (or restore secrets + old code).
4. Restore database to `T0` (PITR or snapshot).
5. Re-enable webhook.
6. Verify §11.4 on **old** stack.
7. Write incident notes in §16; fix on playground before retry.

---

## 13. Provisioning runbook outline (Model B)

Replace [PROVISIONING.md](PROVISIONING.md) content in Phase 6 with:

1. Insert `crm_orgs` (+ flags).
2. Insert `crm_org_domains` (CRM and/or site hostnames).
3. Seed org defaults: pipeline stages, lenders, settings, branding assets under `{org_id}/`.
4. If CRM: create owner user → member → metadata → directory.
5. If Twilio: buy number → `crm_org_twilio` → point webhooks at shared functions.
6. If website: clone `sites/_template` → `sites/<slug>` → Vercel env (`ORG_SLUG`, `SITE_KEY`) → DNS.
7. If Website+CRM: confirm form creates system leads; optional `/crm` rewrite.
8. Register row in local `tenants.json`.
9. Run §11 checks for the new org vs an existing org.

**Never:** create a new Supabase project for a normal licensee.

---

## 14. Offboarding runbook (outline)

1. Set `status = suspended` (blocks login + forms).
2. Export: customers, leads, activities (SQL or script).
3. Remove custom domains from Vercel; delete site project if any.
4. Release Twilio number.
5. Delete storage objects under `{org_id}/`.
6. Hard-delete org cascade (scripted, after retention period).
7. Update `tenants.json`.

---

## 15. Testing strategy

| Layer | Approach |
|-------|----------|
| Automated (add during Phase 2) | `sql/mt_rls_smoke.sql` run as two test users |
| Manual | §11 matrices |
| Edge | Playground function logs + Twilio console debugger |
| No E2E suite yet | Optional Playwright later: login A vs B customer counts |

Do not wait for a full E2E framework to start Phase 1.

---

## 16. Decision log

| Date | Decision | Notes |
|------|----------|-------|
| 2026-08-07 | Plan v2 written | Defaults D1–D14 locked in §2 |
| 2026-08-07 | Phase 0 complete | Confirmed D1–D14 unchanged. Inventory: [MT_PHASE0_NOTES.md](MT_PHASE0_NOTES.md). Rollback: [MT_ROLLBACK_CHECKLIST.md](MT_ROLLBACK_CHECKLIST.md). |
| 2026-08-07 | Phase 1 SQL on playground | Applied `mt_01`, `mt_02`, `mt_13` to `crm-playground`. Gate pending: attach members to org-a / org-b. |
| | | |

---

## 17. Progress tracker

| Phase | Status | Owner | Notes |
|-------|--------|-------|-------|
| 0 Orient | Done | | 2026-08-07 — see MT_PHASE0_NOTES.md |
| 1 Foundation | In progress | | mt_01/02/13 on playground; **await member attach** (MT_INVITE_USER.md) |
| 2 RLS | Not started | | |
| 3 Edge | Not started | | |
| 4a CRM UI | Not started | | |
| 4b Sites | Not started | | |
| 5 Temptation cutover | Not started | | |
| 6 Second tenant + docs | Not started | | |

Statuses: `Not started` → `In progress` → `Blocked` → `Done`.

---

## 18. Risk register

| Risk | Impact | Mitigation |
|------|--------|------------|
| Cross-org data leak via RLS hole | Critical | Two-org playground + smoke SQL before prod |
| Twilio To-number mis-map | Critical | Table-driven map; reject unknown To |
| Cutover breaks Temptation leads | High | Keep webhook path; default org temptation; monitor 24h |
| Feath Board policies conflict | Medium | Separate project / wall-off (D9) before org #2 |
| Half-migrated prod | High | No Model B frontend on prod until Phase 5 |
| Scope creep (billing, self-serve) | Medium | Explicitly out of scope (§1) |

---

## 19. Effort (order of magnitude)

| Phase | Effort |
|-------|--------|
| 0 | 1–3 days |
| 1 | 1–2 weeks |
| 2 | 3–5 weeks |
| 3 | 2–4 weeks |
| 4 | 2–4 weeks (parallelizable) |
| 5–6 | 1–2 weeks |

Critical path: **0 → 1 → 2 → 3 → 5**. Phase 4b (sites) can start after Phase 1.

---

## 20. Next action

**Phase 1 almost done.** Before Phase 2:

1. Attach playground users to orgs using [MT_INVITE_USER.md](MT_INVITE_USER.md) — different users for `org-a` and `org-b`, set `app_metadata.org_id`.
2. Confirm: `select slug from crm_orgs;` and membership rows exist.
3. Then start Phase 2 (`mt_03`+) on **crm-playground only**.

Do **not** apply MT SQL to Temptation prod (`izgehybhisycbhalkbub`).
