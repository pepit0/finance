# Phase 5 rollback — stress checklist

Print or keep open during Temptation Model B cutover. Full context: [MULTI_TENANT_PLAN.md](MULTI_TENANT_PLAN.md) §12.

**Do not use this for playground experiments** — playground may be reset freely.

---

## Before cutover (prepare)

- [ ] Note Supabase prod project: `pepit0's Project` / ref `izgehybhisycbhalkbub`
- [ ] Confirm PITR enabled **or** take a dashboard backup / snapshot; write timestamp **T0**: `__________`
- [ ] Vercel CRM prod: note current Production deployment id/URL: `__________`
- [ ] Edge Functions: confirm you can redeploy previous git tag / commit: `__________`
- [ ] Marketing webhook: know how to disable (Temptation Website project `ynnyyiwvbjxsttnubquc` → Database → Webhooks)
- [ ] Keep this checklist + someone who can run Supabase restore

---

## If smoke fails (execute in order)

1. [ ] **Stop inbound leads** — disable marketing DB webhook (Temptation Website)
2. [ ] **CRM UI** — Vercel → previous Production deployment → Promote / Rollback
3. [ ] **Edge Functions** — redeploy prior commit of `ingest-marketing-preapproval` + Twilio functions to prod
4. [ ] **Database** — restore to **T0** (PITR or snapshot)
5. [ ] **Re-enable webhook**
6. [ ] **Verify old stack** — login, open a customer, submit test pre-approval, check Edge logs
7. [ ] **Log incident** in MULTI_TENANT_PLAN.md §16; fix on **crm-playground** before retry

---

## Do not

- Do not leave Model B frontend on prod with Model A DB (or the reverse) after a failed cutover
- Do not “fix forward” on prod without a new playground gate pass
- Do not point playground credentials at prod
