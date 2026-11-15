# Phase 0 notes — inventory & branch strategy

Completed as part of [MULTI_TENANT_PLAN.md](MULTI_TENANT_PLAN.md) Phase 0.  
**Do not re-do** unless infrastructure changes.

---

## Supabase projects (org inventory)

| Name | Ref | Role in Model B |
|------|-----|-----------------|
| **crm-playground** | `mmwirtqvgietltlibfbu` | **MT lab** — all Phase 1–4 SQL/Edge experiments. Never Temptation prod data. |
| **pepit0's Project** | `izgehybhisycbhalkbub` | **Temptation CRM prod** (Model A until Phase 5). Becomes shared licensee DB after cutover. |
| **Temptation Website** | `ynnyyiwvbjxsttnubquc` | Marketing / leads for Temptation site (external). Stays separate (D6). |

Verified ACTIVE_HEALTHY via Supabase MCP (2026-08-07).

### Playground sanity

- CRM tables present; `crm_org_settings` has single row `id=default`
- Seed-scale data (e.g. ~5 customers) — safe to migrate / reset if needed

### Feath Board / Feath-internal (D9)

| Finding | Action |
|---------|--------|
| `feath_board_state` **not** present on playground or Temptation CRM | SQL exists in repo; not deployed (or not yet). When deploying Board, put it on **playground** or a **dedicated Feath project** — not mixed into licensee MT RLS. |
| `feath_prototype_shares` **is** on Temptation CRM prod | Wall off / move **before Phase 6 org #2**. Until then, exclude from `org_id` backfill expectations (not licensee CRM). |
| `product-site` uses `VITE_SUPABASE_*` from its Vercel env | Confirm at Phase 6 that feath.xyz does not point at the shared licensee prod DB for Board, or uses a non-tenant schema with no cross-access. |

---

## Git branch strategy (MT)

| Branch | Use |
|--------|-----|
| `playground` | **Default MT working branch.** Model B SQL, Edge, CRM UI, `sites/` land here first. Deploys demo CRM. |
| Feature branches | Optional: branch off `playground` for risky chunks; merge back to `playground` after gate. |
| `main` | Temptation prod CRM. **No Model B schema/frontend until Phase 5.** |
| Tag before Phase 5 | Create annotated tag e.g. `pre-mt-cutover-YYYYMMDD` on `main` (and note playground SHA) before prod SQL. |

Current session: already on `playground` (tracks `origin/playground`).

---

## Phase 0 checklist (done)

- [x] §2 locked decisions confirmed (D1–D14) — see plan §16
- [x] Playground Supabase valid (`crm-playground`)
- [x] Feath inventory recorded (this file)
- [x] Rollback stress checklist: [MT_ROLLBACK_CHECKLIST.md](MT_ROLLBACK_CHECKLIST.md)
- [x] Git branch strategy recorded (this file)

**Exit gate:** PASSED → proceed to Phase 1 on **crm-playground only**.
