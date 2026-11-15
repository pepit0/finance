# Invite a CRM user into an org (Model B Phase 1)

Manual control plane (D10). Run against **crm-playground** until Phase 5.

Requires: `sql/mt_01_crm_orgs.sql` applied; org row exists (`slug`).

## Steps

1. **Create Auth user** (Supabase Dashboard → Authentication → Users → Add user), or use an existing user.

2. **Add membership** (SQL Editor as postgres):

```sql
insert into public.crm_org_members (org_id, user_id, role)
select o.id, u.id, 'owner'  -- or admin | staff
from public.crm_orgs o
cross join auth.users u
where o.slug = 'org-a'          -- change slug
  and lower(u.email) = lower('user@example.com')  -- change email
on conflict (org_id, user_id) do update set role = excluded.role;
```

3. **Set JWT app_metadata** (Dashboard → user → App Metadata), or Auth Admin API:

```json
{
  "crm_access": true,
  "org_id": "<uuid from crm_orgs.id>",
  "org_role": "owner"
}
```

Keep `crm_access: true` until Phase 2 replaces the global gate.

4. **User signs out and back in** so the JWT refreshes.

5. **Verify:**

```sql
select public.current_org_id();  -- as that user via RPC, or check jwt
select * from public.crm_org_members where user_id = '<user uuid>';
```

## Playground seed orgs

| Slug | Purpose |
|------|---------|
| `org-a` | CRM + website flags; linked to legacy `crm_org_settings` + `demo.sharifian.cfd` |
| `org-b` | CRM-only second org for isolation tests |

Attach different users to A vs B before Phase 2 RLS testing.
