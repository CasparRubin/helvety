# Security review runbook

Periodic checks for the Helvety monorepo. Run locally or before major releases.

## Automated (CI)

```bash
bun run ci:check
bun run deps:security
```

Includes: Supabase auth patterns (`getUser` for authz, no `getSession`), proxy wiring, env template tiers, dependency floors. Session **mutations** must use `createServerMutatingClient`; RSC/read paths use `createServerClient` (no-ops cookie writes when `x-helvety-auth-refreshed` is set after the proxy persisted refreshed cookies).

## Vercel production env

Requires Vercel CLI login:

```bash
bun run consistency:vercel-prod-env
```

Confirm each zone uses `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SECRET_KEY` (not legacy `anon` / `service_role` names). The audit script warns on legacy key names.

## Supabase database (local only)

Do **not** commit `supabase/supabase.json`. Generate locally:

```bash
# From repo root, with SUPABASE_PROJECT_ID set
bun run db:gen-types
# Review RLS and SECURITY DEFINER via getSupabase.sql output kept local under /supabase
```

Review: RLS enabled on user tables, no broad `anon` grants on vault data, `SECURITY DEFINER` functions scoped.

## Auth / extension

- `HELVEETY_CHROME_EXTENSION_ORIGINS` on `helvety-auth` matches the published Chrome extension ID only.
- Extension Bearer tokens rotated if leaked.
- Extension passkey `challengeEnvelope` values are single-use within their TTL (Upstash `consumeSingleUseKey`; dev uses in-memory fallback).
- Spot-check sign-in, callback, passkey session mint, and logout with existing `sb-*` cookies (mutating client must persist session changes).

## Store public downloads

- Signed redirect URLs from `createPackageDownload` must pass `isAllowedDownloadUrl` (nested paths under `packages/` such as `spfx/helvety-spo-explorer/*.sppkg`).
- Reject test URLs with path traversal or wrong origin before shipping storage layout changes.

## CSP

Document accepted tradeoffs in [`packages/config/next-headers.mjs`](../packages/config/next-headers.mjs): `style-src 'unsafe-inline'`, dev `unsafe-eval`, `wasm-unsafe-eval` for ONNX (image-upscaler).

## Quarterly cadence

1. `bun run ci:check` on `main`
2. `bun run consistency:vercel-prod-env`
3. `bun outdated` + [`docs/dependency-inventory.md`](./dependency-inventory.md) extended assets
4. Local Supabase policy review (export stays gitignored)
