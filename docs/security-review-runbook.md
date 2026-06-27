# Security review runbook

Periodic checks for the Helvety monorepo. Run locally or before major releases.

## Automated local checks (`ci:check`)

```bash
bun run ci:check
```

`ci:check` includes Supabase auth patterns (`getClaims` at the proxy edge; `getUser` for authz in RSC/actions; no `getSession` for authorization), proxy wiring (including `@supabase/ssr` 0.12+ `setAll` cache headers on refreshed sessions), env template tiers, and security dependency floors (`deps:security:floors`). Session **mutations** must use `createServerMutatingClient`; RSC/read paths use `createServerClient` (no-ops cookie writes when `x-helvety-auth-refreshed` is set after the proxy persisted refreshed cookies).

## Manual pre-release checks (not part of `ci:check`)

Run these before major releases or production promotions:

```bash
bun run deps:security
bun run consistency:vercel-prod-env
bun run consistency:vercel-preview-env
bun run consistency:supabase-rls
bun run ci:check:e2e
# or, with an existing gateway only:
HELVETY_SMOKE_BASE_URL=http://localhost:3001 bun run test:e2e
```

`deps:security` runs floors plus `bun audit`. Vercel env audits require Vercel CLI login. `consistency:supabase-rls` needs a local gitignored `supabase/supabase.json` export. `ci:check:e2e` installs Chromium if needed, starts all zone dev servers when `HELVETY_SMOKE_BASE_URL` is unset, and runs Playwright gateway smoke tests; `test:e2e` alone expects a reachable gateway (default port 3001) or `HELVETY_SMOKE_BASE_URL`.

## Vercel production and preview env

Requires Vercel CLI login:

```bash
bun run consistency:vercel-prod-env
bun run consistency:vercel-preview-env
```

Confirm each zone uses `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (`sb_publishable_*` only; JWT `eyJ…` anon keys are rejected at startup) and `SUPABASE_SECRET_KEY` on admin tiers only (not legacy `anon` / `service_role` env var names). The audit script warns on legacy key names. Preview env should mirror Production tier keys (same allow/forbid rules); never set `SKIP_ENV_VALIDATION=1` on Vercel.

### Vercel dashboard (manual, all nine zone projects)

- **Analytics → Web Analytics** and **Speed Insights** must stay **disabled** (Helvety CSP does not allow `va.vercel-scripts.com`).
- Do not set `NEXT_PUBLIC_HELVETY_VERCEL_ANALYTICS`, `NEXT_PUBLIC_VERCEL_ANALYTICS_ID`, or `VERCEL_ANALYTICS_ID` in Production or Preview.
- Align `helvety-com` Node.js version with zone apps (24.x per `.nvmrc`) when convenient.

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

### Supabase Storage (accepted tradeoffs)

- **`packages` bucket** — private; RLS policy denies all direct client access. Store downloads use signed URLs from server actions only.
- **`image-upscaler-models` bucket** — **public by design** (ONNX weights, not user data). See [`apps/image-upscaler/public/models/README.md`](../apps/image-upscaler/public/models/README.md).

### Supabase dashboard (manual)

Run **Database → Advisors → Security** (or MCP `get_advisors` type `security`) after schema changes. As of 2026-06 audit:

- Enable **Leaked password protection** under Authentication → Providers → Email (defense-in-depth; Helvety is OTP/passkey-first).
- Disable unused OAuth/OIDC providers.
- Confirm session lifetime settings if on Supabase Pro (see GoTrue section below).

`consistency:supabase-rls` checks every table in `scripts/supabase-user-tables.mjs` (`TABLES_REQUIRING_USER_RLS`, currently **9** tables: `contacts`, `items`, `notes`, `links`, `link_folders`, `entity_links`, `user_profiles`, `user_passkey_params`, `user_auth_credentials`). It fails when a listed table is missing from the local export or lacks forced owner-scoped RLS — regenerate the export after every schema change so RLS on new tables is verified before their zone ships.

**Schema changes (remote-first):** DDL is applied on the hosted Supabase project (Dashboard SQL editor or Supabase MCP). This repo does **not** commit `supabase/migrations/`; audit the live shape with [`supabase/getSupabase.sql`](../supabase/getSupabase.sql) → local `supabase/supabase.json` (gitignored). After every schema change, run `bun run db:gen-types` and `bun run consistency:supabase-schema`. Example: `user_passkey_params.key_check_value` (nullable text, KCV for wrong-passkey detection) was added in June 2026 via hosted migration.

## Auth / extension

- `HELVETY_CHROME_EXTENSION_ORIGINS` on `helvety-auth` lists every Chromium extension id you support (unpacked Edge/Chrome dev builds and published store id differ; bare ids or `chrome-extension://<id>`; legacy `HELVEETY_CHROME_EXTENSION_ORIGINS` is not supported).
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` on `helvety-auth` are required in production for extension passkey single-use challenges (`consumeSingleUseKey` with `strict` policy) and OTP rate limiting.
- Spot-check extension OTP routes return JSON (not 404/HTML): `POST /api/extension/otp/send` and `POST /api/extension/otp/verify` with allowlisted `origin` header (same `HELVETY_CHROME_EXTENSION_ORIGINS` as passkey).
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

Checks run on session refresh (not proactively). On **helvety.com** E2EE zones, weekly re-auth uses the signed `helvety_device_trust` cookie. The Chromium extension **does not use that cookie**; it uses the same HMAC schema via **`weekly_proof`** (`helvety_extension_weekly_proof` + `X-Helvety-Weekly-Proof` on Bearer routes). Do **not** set JWT expiry to 604800s alone — use **3600s JWT + 7d time-box + 24h inactivity** per table above.

### MCP baseline audit (2026-06-21)

Supabase MCP (`helvety`, `eu-central-2`, Postgres **17.6.1**, `ACTIVE_HEALTHY`):

- All **9** user-data tables: RLS **enabled + forced** (verified via `execute_sql`).
- Security advisor: **WARN** — [leaked password protection disabled](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) (enable under Authentication → Email).

Vercel MCP: all zone projects present; **`helvety-auth`** latest Production deployment **READY** (Node **24.x**).

**Manual Dashboard follow-ups:** enable leaked-password protection; confirm session settings (3600s / 7d / 24h); disable unused OAuth; note GoTrue version ≥ 2.185.0 if OIDC enabled.

Check version in Supabase Dashboard → Project Settings → Infrastructure, or via support if not shown.

## Quarterly cadence

1. `bun run ci:check` on `main`
2. `bun run consistency:vercel-prod-env` and `bun run consistency:vercel-preview-env`
3. `bun run deps:outdated` + [`docs/dependency-inventory.md`](./dependency-inventory.md) extended assets
4. Local Supabase policy review (export stays gitignored) + `bun run consistency:supabase-rls`
5. Hosted GoTrue version / unused OIDC provider review (see above)
