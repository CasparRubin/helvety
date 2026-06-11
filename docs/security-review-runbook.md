# Security review runbook

Periodic checks for the Helvety monorepo. Run locally or before major releases.

## Automated local checks (`ci:check`)

```bash
bun run ci:check
bun run deps:security
```

Includes: Supabase auth patterns (`getClaims` at the proxy edge; `getUser` for authz in RSC/actions; no `getSession` for authorization), proxy wiring (including `@supabase/ssr` 0.12+ `setAll` cache headers on refreshed sessions), env template tiers, dependency floors. Session **mutations** must use `createServerMutatingClient`; RSC/read paths use `createServerClient` (no-ops cookie writes when `x-helvety-auth-refreshed` is set after the proxy persisted refreshed cookies).

## Vercel production env

Requires Vercel CLI login:

```bash
bun run consistency:vercel-prod-env
```

Confirm each zone uses `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (`sb_publishable_*` only; JWT `eyJ…` anon keys are rejected at startup) and `SUPABASE_SECRET_KEY` on admin tiers only (not legacy `anon` / `service_role` env var names). The audit script warns on legacy key names.

## Supabase database (local only)

Do **not** commit `supabase/supabase.json`. Generate locally:

```bash
# From repo root, with SUPABASE_PROJECT_ID set
bun run db:gen-types
# Review RLS and SECURITY DEFINER via getSupabase.sql output kept local under /supabase
# Verify the local export covers every user-data table with forced RLS
bun run consistency:supabase-rls
```

Review: RLS enabled on user tables, no broad `anon` grants on vault data, `SECURITY DEFINER` functions scoped.

`consistency:supabase-rls` fails when a table from generated types (e.g. `docs`, `links`, `link_folders`) is missing from the local export — regenerate the export after every schema change so RLS on new tables is verified before their zone ships.

## Auth / extension

- `HELVETY_CHROME_EXTENSION_ORIGINS` on `helvety-auth` lists every Chromium extension id you support (unpacked Edge/Chrome dev builds and published store id differ; bare ids or `chrome-extension://<id>`; legacy `HELVEETY_CHROME_EXTENSION_ORIGINS` is not supported).
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` on `helvety-auth` are required in production for extension passkey single-use challenges (`consumeSingleUseKey` with `strict` policy).
- `bun run consistency:vercel-prod-env` must pass for `helvety-auth`: set `HELVETY_CHROME_EXTENSION_ORIGINS` to the published extension id (bare id or `chrome-extension://<id>`).
- Extension Bearer tokens rotated if leaked.
- Extension passkey `challengeEnvelope` values are single-use within their TTL (Upstash `consumeSingleUseKey`; dev uses in-memory fallback).
- Extension passkey routes use `getTrustedClientIp` with `requireTrustedProxyInProduction: true` — confirm production receives trusted `x-real-ip` from Vercel (not spoofable `x-forwarded-for` alone).
- Spot-check sign-in, callback, passkey session mint, and logout with existing `sb-*` cookies (mutating client must persist session changes).

## Store public downloads

- Signed redirect URLs from `createPackageDownload` must pass `isAllowedDownloadUrl` (nested paths under `packages/` such as `spfx/helvety-spo-explorer/*.sppkg`).
- Reject test URLs with path traversal or wrong origin before shipping storage layout changes.

## CSP

Document accepted tradeoffs in [`packages/config/next-headers.mjs`](../packages/config/next-headers.mjs): `style-src 'unsafe-inline'`, dev `unsafe-eval`, `wasm-unsafe-eval` for ONNX (image-upscaler).

## Hosted Supabase Auth (GoTrue)

Helvety uses email OTP and passkeys, not Apple/Azure OIDC in app code. If those providers are enabled in the Supabase Dashboard:

- Confirm hosted Auth is **≥ 2.185.0** (mitigates [CVE-2026-31813](https://www.sentinelone.com/vulnerability-database/cve-2026-31813/) for crafted OIDC ID tokens).
- Disable unused federated providers to reduce attack surface.

### Session lifetime (align with app policy)

Helvety’s unified client policy is **24h sliding idle** and **7d absolute max** (`packages/shared/src/auth-session-policy.ts`). On **Supabase Pro or above**, mirror that in **Authentication → Sessions**:

| Dashboard setting      | Recommended value                                                   |
| ---------------------- | ------------------------------------------------------------------- |
| JWT expiry             | **3600s** (1 hour; keep short access tokens with automatic refresh) |
| Time-box user sessions | **7 days**                                                          |
| Inactivity timeout     | **24 hours**                                                        |

Checks run on session refresh (not proactively). Until Pro is enabled, Helvety enforces weekly email proof via the signed `helvety_device_trust` cookie on E2EE apps and extension-local storage in the Chromium extension.

Check version in Supabase Dashboard → Project Settings → Infrastructure, or via support if not shown.

## Quarterly cadence

1. `bun run ci:check` on `main`
2. `bun run consistency:vercel-prod-env`
3. `bun outdated` + [`docs/dependency-inventory.md`](./dependency-inventory.md) extended assets
4. Local Supabase policy review (export stays gitignored) + `bun run consistency:supabase-rls`
5. Hosted GoTrue version / unused OIDC provider review (see above)
