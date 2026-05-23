# Turbo build environment variables

[`turbo.json`](../turbo.json) lists env keys on the `build` task so Turborepo cache keys invalidate when deployment secrets change across the monorepo.

That list is a **superset** for caching—not every app reads every variable at build time.

## Tier reference

| Tier             | Apps                                | Variables typically required                                                                                                                    |
| ---------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Gateway**      | `web`                               | `NEXT_PUBLIC_SUPABASE_*`, zone rewrite URLs (`AUTH_URL`, `STORE_URL`, …) when `VERCEL=1`                                                        |
| **Full stack**   | `auth`, `store`, `docs`, E2EE zones | Above public Supabase keys + `SUPABASE_SECRET_KEY`, `UPSTASH_REDIS_*`, `HELVETY_COOKIE_SIGNING_SECRET`, `HELVETY_SERVER_ACTION_ALLOWED_ORIGINS` |
| **Auth extra**   | `auth`                              | `DEVICE_TRUST_COOKIE_SECRET`                                                                                                                    |
| **Public tools** | `pdf`, `image-upscaler`             | `NEXT_PUBLIC_SUPABASE_*`, `HELVETY_COOKIE_SIGNING_SECRET` only                                                                                  |

Copy only the keys from the relevant `apps/<zone>/env.template` into `.env.local` for local development.

## Global passthrough

`globalEnv` in `turbo.json` includes `NODE_ENV`, `SKIP_ENV_VALIDATION`, and `VERCEL` for all tasks.

See also root [`README.md`](../README.md) § Environment Model and [`app-consistency-checklist.md`](./app-consistency-checklist.md).
