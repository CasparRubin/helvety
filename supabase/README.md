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

- Applied to production as `create_docs_table` (table + forced RLS + `(select auth.uid())` policies).
- Repo file [`20260523120000_create_docs_table.sql`](./migrations/20260523120000_create_docs_table.sql) matches that shape; [`20260523230000_docs_rls_auth_uid_subselect.sql`](./migrations/20260523230000_docs_rls_auth_uid_subselect.sql) is a no-op if create migration already uses subselect form.

After DDL changes:

```bash
bun run db:gen-types   # requires SUPABASE_PROJECT_ID
bun run ci:check
```

## Agent / CI checks

- `bun run consistency:supabase-auth` — no `getSession()` for authorization
- `bun run consistency:supabase-schema` — `database.types.ts` tables expect RLS in repo docs (static list)
- Supabase MCP: `get_advisors` (security), `list_tables` (verbose), `execute_sql` (read-only verification)

## Auth dashboard (manual)

Enable [leaked password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) in Dashboard → Authentication when password sign-in is used (OTP/passkey-primary today).

## Remote migration reference (March 2026)

These were applied on the hosted project before docs vault DDL:

- `remove_store_billing_tables`
- `replace_pairwise_links_with_entity_links`
- `optimize_entity_links_rls`
- `harden_entity_links_privileges`
- `optimize_remaining_rls_auth_uid`
- `security_hardening_privileges_best_effort`
- `remove_legacy_billing`

All E2EE user tables use **forced RLS** and `(select auth.uid()) = user_id` policies (verified via MCP May 2026).
