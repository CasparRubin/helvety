# Supabase schema workflow

Helvety uses a hosted Supabase project (`helvety`). Schema changes must be reproducible and reviewed before production deploy.

## Local export (do not commit)

1. Run [`getSupabase.sql`](./getSupabase.sql) in the Supabase SQL editor (or via CLI).
2. Save the JSON result as `supabase/supabase.json` locally.
3. **Never commit** `supabase.json` — it is gitignored (full database export).

Use the export to diff policies, grants, and table definitions when authoring new migrations.

## Migrations in this repo

| Path                           | Purpose                                                                                                      |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| [`migrations/`](./migrations/) | Versioned DDL applied via Supabase MCP `apply_migration` or Dashboard                                        |
| Remote history                 | Older hardening migrations (March 2026) may exist only on the hosted project; compare with `list_migrations` |

### Docs vault (`public.docs`)

- Production: `create_docs_table` then [`20260524120000_harden_docs_and_revoke_anon_grants.sql`](./migrations/20260524120000_harden_docs_and_revoke_anon_grants.sql) (GRANT to `authenticated`/`service_role`, policies on `authenticated`, revoke `anon` on legacy E2EE tables).
- Greenfield: [`20260523120000_create_docs_table.sql`](./migrations/20260523120000_create_docs_table.sql) includes grants and authenticated policies in one step.
- Superseded (do not apply): [`20260523230000_docs_rls_auth_uid_subselect.sql`](./migrations/20260523230000_docs_rls_auth_uid_subselect.sql).

After DDL changes:

```bash
bun run db:gen-types   # requires SUPABASE_PROJECT_ID
bun run ci:check
```

## Agent / CI checks

- `bun run consistency:supabase-auth` — no `getSession()` for authorization
- `bun run consistency:supabase-schema` — `database.types.ts` user-data tables plus docs migration SQL (grants, authenticated policies, anon revokes)
- Supabase MCP: `get_advisors` (security), `list_tables` (verbose), `execute_sql` (read-only verification)

## Auth dashboard (manual)

[Leaked password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) (HaveIBeenPwned) requires **Supabase Pro or above** — not available on Free; the Security Advisor warning is expected there. Enable in Dashboard → Authentication only if you upgrade **and** use password sign-in (Helvety is OTP/passkey-primary today).

## Remote migration reference (March 2026)

These were applied on the hosted project before docs vault DDL:

- `remove_store_billing_tables`
- `replace_pairwise_links_with_entity_links`
- `optimize_entity_links_rls`
- `harden_entity_links_privileges`
- `optimize_remaining_rls_auth_uid`
- `security_hardening_privileges_best_effort`
- `remove_legacy_billing`

All user-data tables in `public` use **forced RLS** and `(select auth.uid()) = user_id` (or `= id` for profiles). User-data tables do not grant table privileges to `anon` (verified via MCP May 2026). `user_auth_credentials` is service-role only with a deny-all client policy.
