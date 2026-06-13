# Vercel environment audit checklist

See also [`security-review-runbook.md`](./security-review-runbook.md) for the full periodic review cadence and [`security-audit-2026-06-13.md`](./security-audit-2026-06-13.md) for the latest audit snapshot.

Use this when syncing **Production** and **Preview** env in the Vercel dashboard. Local parity: `bun run consistency:local-env`. Template guardrails: `bun run consistency:env-templates`. Automated audits (requires Vercel CLI login): `bun run consistency:vercel-prod-env` and `bun run consistency:vercel-preview-env` ([`scripts/audit-vercel-production-env.mjs`](../scripts/audit-vercel-production-env.mjs); add `--preview` for Preview tier).

All ten zone projects exist on team **Helvety** (`helvety-com`, `helvety-auth`, `helvety-store`, `helvety-docs`, `helvety-pdf`, `helvety-image-upscaler`, `helvety-tasks`, `helvety-contacts`, `helvety-notes`, `helvety-links`).

## Per-project keys

| Vercel project                                                                        | Root Directory | Set these                                                                                                                                                  | Do not set                                                          |
| ------------------------------------------------------------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `helvety-com`                                                                         | `apps/web`     | `NEXT_PUBLIC_SUPABASE_*`, all nine `*_URL` gateway vars including **`DOCS_URL`**                                                                           | `SUPABASE_SECRET_KEY`, `UPSTASH_*`, `HELVETY_COOKIE_SIGNING_SECRET` |
| `helvety-auth`                                                                        | `apps/auth`    | Public Supabase, `SUPABASE_SECRET_KEY`, Upstash, `HELVETY_COOKIE_SIGNING_SECRET`, **`DEVICE_TRUST_COOKIE_SECRET`**, **`HELVETY_CHROME_EXTENSION_ORIGINS`** | —                                                                   |
| `helvety-store`                                                                       | `apps/store`   | Public Supabase, `SUPABASE_SECRET_KEY`, Upstash, `HELVETY_COOKIE_SIGNING_SECRET`                                                                           | `DEVICE_TRUST_COOKIE_SECRET`                                        |
| `helvety-docs`, `helvety-tasks`, `helvety-contacts`, `helvety-notes`, `helvety-links` | `apps/<slug>`  | Public Supabase, Upstash, `HELVETY_COOKIE_SIGNING_SECRET`, **`DEVICE_TRUST_COOKIE_SECRET`** (same value as `helvety-auth`)                                 | `SUPABASE_SECRET_KEY`                                               |
| `helvety-pdf`, `helvety-image-upscaler`                                               | `apps/<slug>`  | Same as user-scoped tier                                                                                                                                   | `SUPABASE_SECRET_KEY`                                               |

Copy exact key names and comments from each zone’s `apps/<slug>/env.template` (for example `apps/auth/env.template`).

## Shared values (must match across projects that use them)

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (`sb_publishable_*` only; not JWT anon keys) — every project
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` — every project except `helvety-com`
- `HELVETY_COOKIE_SIGNING_SECRET` — every project except `helvety-com` (one shared value)
- `SUPABASE_SECRET_KEY` — only `helvety-auth` and `helvety-store` (must differ from publishable key)
- `DEVICE_TRUST_COOKIE_SECRET` — `helvety-auth` and all user-scoped E2EE/docs zones (same shared value; weekly email-proof gate). `bun run consistency:vercel-prod-env` checks presence plus parity: SHA-256 when Vercel exposes values, otherwise `updatedAt` spread across zones (sensitive vars are not readable via CLI/API).
- `HELVETY_CHROME_EXTENSION_ORIGINS` — only `helvety-auth`

### `HELVETY_CHROME_EXTENSION_ORIGINS` (helvety-auth only)

Comma-separated **Chromium extension ids** (32 chars `a`–`p`), e.g. from `edge://extensions/?id=<id>` or `chrome://extensions`. Full `chrome-extension://<id>` URLs are also accepted.

Example (Edge unpacked dev + optional second id):

```text
kjdldfioiofpblkchjodefakpopmkjjf
```

After changing this value, **redeploy `helvety-auth`**. Verify routes:

```bash
curl -sS -o /dev/null -w "%{http_code}\n" -X POST \
  "https://helvety.com/auth/api/extension/passkey/options" \
  -H "Content-Type: application/json" \
  -d '{"origin":"chrome-extension://kjdldfioiofpblkchjodefakpopmkjjf","isMobile":false,"expectedUserId":"00000000-0000-4000-8000-000000000001"}'
```

Expect **`401`** with a JSON body (not `404` or HTML).

## Gateway (`helvety-com`) rewrite URLs

Each `*_URL` must be the **HTTPS deployment origin** (e.g. `https://helvety-docs.vercel.app`), not the public `helvety.com` path.

After changing any `*_URL`, **redeploy `helvety-com`** so rewrites pick up new origins. Deploying a sub-zone alone does not update `helvety.com/<path>` until the gateway is redeployed.

## Vercel Web Analytics and Speed Insights (all ten projects)

Helvety does not use Vercel Analytics or Speed Insights in application code. In the Vercel dashboard for **each** zone project (`helvety-com` through `helvety-links`), confirm **Analytics → Web Analytics** and **Speed Insights** are **disabled** so the platform does not inject `va.vercel-scripts.com` or related scripts outside the repo.

Do not set `NEXT_PUBLIC_HELVETY_VERCEL_ANALYTICS`, `NEXT_PUBLIC_VERCEL_ANALYTICS_ID`, or `VERCEL_ANALYTICS_ID` in Production or Preview env (forbidden by `scripts/env-template-expectations.mjs`; flagged by `bun run consistency:vercel-prod-env` and `bun run consistency:vercel-preview-env`).

## Optional

- `HELVETY_SERVER_ACTION_ALLOWED_ORIGINS` — comma-separated override (defaults on Vercel include `https://helvety.com` and deployment URLs)
- Never set `SKIP_ENV_VALIDATION=1` on Vercel production

See also [`vercel-monorepo-apps.md`](./vercel-monorepo-apps.md) and [`turbo-env-tiers.md`](./turbo-env-tiers.md).
