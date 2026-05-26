# Vercel environment audit checklist

See also [`security-review-runbook.md`](./security-review-runbook.md) for the full periodic review cadence.

Use this when syncing **Production** and **Preview** env in the Vercel dashboard. Local parity: `bun run consistency:local-env`. Template guardrails: `bun run consistency:env-templates`. Automated Production audit (requires Vercel CLI login): `bun run consistency:vercel-prod-env` ([`scripts/audit-vercel-production-env.mjs`](../scripts/audit-vercel-production-env.mjs)).

All ten zone projects exist on team **Helvety** (`helvety-com`, `helvety-auth`, `helvety-store`, `helvety-docs`, `helvety-pdf`, `helvety-image-upscaler`, `helvety-tasks`, `helvety-contacts`, `helvety-notes`, `helvety-links`).

## Per-project keys

| Vercel project                                                                        | Root Directory | Set these                                                                                                                                                                                                        | Do not set                                                          |
| ------------------------------------------------------------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `helvety-com`                                                                         | `apps/web`     | `NEXT_PUBLIC_SUPABASE_*`, all nine `*_URL` gateway vars including **`DOCS_URL`**                                                                                                                                 | `SUPABASE_SECRET_KEY`, `UPSTASH_*`, `HELVETY_COOKIE_SIGNING_SECRET` |
| `helvety-auth`                                                                        | `apps/auth`    | Public Supabase, `SUPABASE_SECRET_KEY`, Upstash, `HELVETY_COOKIE_SIGNING_SECRET`, **`DEVICE_TRUST_COOKIE_SECRET`**, **`HELVETY_CHROME_EXTENSION_ORIGINS`** (legacy `HELVEETY_CHROME_EXTENSION_ORIGINS` accepted) | —                                                                   |
| `helvety-store`                                                                       | `apps/store`   | Public Supabase, `SUPABASE_SECRET_KEY`, Upstash, `HELVETY_COOKIE_SIGNING_SECRET`                                                                                                                                 | `DEVICE_TRUST_COOKIE_SECRET`                                        |
| `helvety-docs`, `helvety-tasks`, `helvety-contacts`, `helvety-notes`, `helvety-links` | `apps/<slug>`  | Public Supabase, Upstash, `HELVETY_COOKIE_SIGNING_SECRET`                                                                                                                                                        | `SUPABASE_SECRET_KEY`                                               |
| `helvety-pdf`, `helvety-image-upscaler`                                               | `apps/<slug>`  | Same as user-scoped tier                                                                                                                                                                                         | `SUPABASE_SECRET_KEY`                                               |

Copy exact key names and comments from each zone’s `apps/<slug>/env.template` (for example `apps/auth/env.template`).

## Shared values (must match across projects that use them)

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — every project
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` — every project except `helvety-com`
- `HELVETY_COOKIE_SIGNING_SECRET` — every project except `helvety-com` (one shared value)
- `SUPABASE_SECRET_KEY` — only `helvety-auth` and `helvety-store` (must differ from publishable key)
- `DEVICE_TRUST_COOKIE_SECRET`, `HELVETY_CHROME_EXTENSION_ORIGINS` (or legacy `HELVEETY_CHROME_EXTENSION_ORIGINS`) — only `helvety-auth`

## Gateway (`helvety-com`) rewrite URLs

Each `*_URL` must be the **HTTPS deployment origin** (e.g. `https://helvety-docs.vercel.app`), not the public `helvety.com` path.

After changing any `*_URL`, **redeploy `helvety-com`** so rewrites pick up new origins. Deploying a sub-zone alone does not update `helvety.com/<path>` until the gateway is redeployed.

## Optional

- `NEXT_PUBLIC_HELVETY_VERCEL_ANALYTICS=false` — disable analytics per project
- `HELVETY_SERVER_ACTION_ALLOWED_ORIGINS` — comma-separated override (defaults on Vercel include `https://helvety.com` and deployment URLs)
- Never set `SKIP_ENV_VALIDATION=1` on Vercel production

See also [`vercel-monorepo-apps.md`](./vercel-monorepo-apps.md) and [`turbo-env-tiers.md`](./turbo-env-tiers.md).
