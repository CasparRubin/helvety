# Turbo build environment variables

[`turbo.json`](../turbo.json) lists env keys on the `build` task so Turborepo cache keys invalidate when deployment secrets change across the monorepo.

That list is a **superset** for caching—not every app reads every variable at build time.

## Tier reference

| Tier                         | Apps                                           | Variables typically required                                                                                                                                                                                                                                                                                                                                                       |
| ---------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Gateway**                  | `web` (`helvety-com`)                          | `NEXT_PUBLIC_SUPABASE_*` (`sb_publishable_*` publishable key), **ten zone rewrite URLs** (`AUTH_URL`, `STORE_URL`, `PDF_URL`, `IMAGE_UPSCALER_URL`, `IMAGE_EDITOR_URL`, `OCR_URL`, `TASKS_URL`, `CONTACTS_URL`, `NOTES_URL`, `LINKS_URL`) when `VERCEL=1` — one per deployed zone except the gateway (**eleven** Vercel zone projects total); no Upstash or cookie-signing secrets |
| **Admin + rate limit**       | `auth`, `store`                                | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (`sb_publishable_*`) + `SUPABASE_SECRET_KEY`, `UPSTASH_REDIS_*`, `HELVETY_COOKIE_SIGNING_SECRET`, optional `HELVETY_SERVER_ACTION_ALLOWED_ORIGINS`                                                                                                                                                                                          |
| **User-scoped + rate limit** | `tasks`, `contacts`, `notes`, `links`          | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (`sb_publishable_*`) + `UPSTASH_REDIS_*`, `HELVETY_COOKIE_SIGNING_SECRET`, **`DEVICE_TRUST_COOKIE_SECRET`** (same value as `auth`; weekly device-trust gate; no `SUPABASE_SECRET_KEY`; vault CRUD uses user client + RLS)                                                                                                                   |
| **Public tool + rate limit** | `pdf`, `image-upscaler`, `image-editor`, `ocr` | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (`sb_publishable_*`) + `UPSTASH_REDIS_*`, `HELVETY_COOKIE_SIGNING_SECRET` (auth callbacks use strict rate limiting)                                                                                                                                                                                                                         |
| **Auth extra**               | `auth`                                         | `DEVICE_TRUST_COOKIE_SECRET` (mint), `HELVETY_CHROME_EXTENSION_ORIGINS`                                                                                                                                                                                                                                                                                                            |

Copy only the keys from the relevant `apps/<zone>/env.template` into `.env.local` for local development. Run `bun run consistency:local-env` to verify local files; mirror the same keys per project in Vercel (Production and Preview).

## Global passthrough

`globalEnv` in `turbo.json` includes `NODE_ENV`, `SKIP_ENV_VALIDATION`, and `VERCEL` for all tasks.

`tasks.build.env` lists shared secrets used by other zones so Turbo cache keys invalidate when those values change.

See also root [`README.md`](../README.md) § Environment Model, [`env-vercel-audit-checklist.md`](./env-vercel-audit-checklist.md), and [`app-consistency-checklist.md`](./app-consistency-checklist.md).
