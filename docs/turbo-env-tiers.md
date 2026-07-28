# Turbo build environment variables

[`turbo.json`](../turbo.json) lists env keys on the `build` task so Turborepo cache keys invalidate when deployment secrets change across the monorepo.

That list is a **superset** for caching. Not every app reads every variable at build time.

## Tier reference

| Tier            | Apps                         | Variables typically required                                                              |
| --------------- | ---------------------------- | ----------------------------------------------------------------------------------------- |
| **Gateway**     | `web` (`helvety-com`)        | Zone rewrite URLs (`STORE_URL`, `PDF_URL`, `IMAGE_EDITOR_URL`, `OCR_URL`) when `VERCEL=1` |
| **Store**       | `store`                      | Upstash (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`)                            |
| **Public tool** | `pdf`, `image-editor`, `ocr` | No required secrets (see each zone `env.template`)                                        |

Copy only the keys from the relevant `apps/<zone>/env.template` into `.env.local` for local development. Run `bun run consistency:local-env` to verify local files; mirror the same keys per project in Vercel (Production and Preview).

## Global passthrough

`globalEnv` in `turbo.json` includes `NODE_ENV`, `SKIP_ENV_VALIDATION`, and `VERCEL` for all tasks.

`tasks.build.env` lists shared secrets used by other zones so Turbo cache keys invalidate when those values change.

See also root [`README.md`](../README.md) § Environment Model, [`env-vercel-audit-checklist.md`](./env-vercel-audit-checklist.md), and [`app-consistency-checklist.md`](./app-consistency-checklist.md).
