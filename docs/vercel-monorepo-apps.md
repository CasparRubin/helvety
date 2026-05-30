# Vercel monorepo app projects

Each Helvety zone is a **separate Vercel project** with **Root Directory** set to `apps/<slug>` (not the repository root). Framework preset: **Next.js**. Leave install/build/output commands at defaults; each app’s [`vercel.json`](../apps/pdf/vercel.json) only sets `"framework": "nextjs"`.

| Zone app       | Vercel project           | Root Directory        |
| -------------- | ------------------------ | --------------------- |
| Web (gateway)  | `helvety-com`            | `apps/web`            |
| Auth           | `helvety-auth`           | `apps/auth`           |
| Store          | `helvety-store`          | `apps/store`          |
| PDF            | `helvety-pdf`            | `apps/pdf`            |
| Docs           | `helvety-docs`           | `apps/docs`           |
| Image Upscaler | `helvety-image-upscaler` | `apps/image-upscaler` |
| Tasks          | `helvety-tasks`          | `apps/tasks`          |
| Contacts       | `helvety-contacts`       | `apps/contacts`       |
| Notes          | `helvety-notes`          | `apps/notes`          |
| Links          | `helvety-links`          | `apps/links`          |

## Docs app trap

The repository has a top-level [`docs/`](../docs/) folder for **markdown documentation**, not the Next.js app. If `helvety-docs` uses Root Directory `docs`, the build runs Turbo at the wrong path (`Running build in 0 packages`) and Vercel fails with **No Output Directory named "public"**. Always use **`apps/docs`**.

## Gateway env

When `VERCEL=1`, set zone URLs on `helvety-com` (`apps/web`) from [`apps/web/env.template`](../apps/web/env.template), including `DOCS_URL` for the docs deployment. Turbo must pass those keys at build time (`tasks.build.env` in [`turbo.json`](../turbo.json); see `WEB_GATEWAY_KEYS` in [`scripts/env-template-expectations.mjs`](../scripts/env-template-expectations.mjs)).

## Path routing on helvety.com

Canonical zone URLs (for example `https://helvety.com/docs`) are served by **`helvety-com`** via rewrites to each zone’s deployment origin (`DOCS_URL`, `PDF_URL`, …). Deploying **`helvety-docs` alone** updates `helvety-docs.vercel.app/docs` but does **not** change `helvety.com/docs` until **`helvety-com`** is redeployed with the correct gateway env. Cross-app navigation (**AppSwitcher** in `@helvety/ui`) ships with each zone’s build; no separate “ecosystem menu” deploy exists.

## Tailwind / PostCSS at build time

Zone apps re-export [`@helvety/config/postcss`](../packages/config/postcss.mjs), which loads `@tailwindcss/postcss` from **`@helvety/dev-deps`** (canonical plugin path for Vitest and builds). `@helvety/ui` also declares `tailwindcss` and `@tailwindcss/postcss` in **`dependencies`** so Tailwind packages sit on each zone app’s production dependency graph for Turbopack CSS processing (`@import "tailwindcss"` in shared `globals.css`). Every zone app must keep `"@helvety/ui": "workspace:*"` in `dependencies` (not only devDependencies). Versions stay canonical in `@helvety/dev-deps`; `bun run deps:drift` and `consistency:guardrails` enforce this.

## Local guardrail (`ci:check`)

`bun run consistency:vercel-apps` asserts identical `vercel.json` files and `env.template` Vercel lines for every zone. `consistency:guardrails` asserts `postcss.config.mjs` parity and `@helvety/ui` on every zone that uses shared PostCSS. See [`scripts/vercel-app-expectations.mjs`](../scripts/vercel-app-expectations.mjs).

## Environment variables (Vercel ops)

Copy keys from each zone’s `apps/<slug>/env.template` into that Vercel project (not the repo root). Tier reference: [`turbo-env-tiers.md`](./turbo-env-tiers.md). Step-by-step Vercel UI checklist: [`env-vercel-audit-checklist.md`](./env-vercel-audit-checklist.md).

- **Admin tier** (`helvety-auth`, `helvety-store`): needs `SUPABASE_SECRET_KEY`, Upstash, and `HELVETY_COOKIE_SIGNING_SECRET` (auth also needs `DEVICE_TRUST_COOKIE_SECRET` and `HELVETY_CHROME_EXTENSION_ORIGINS`).
- **User-scoped tier** (E2EE apps + `helvety-docs`): Upstash + `HELVETY_COOKIE_SIGNING_SECRET` only; do **not** deploy `SUPABASE_SECRET_KEY` (least privilege).
- **Public tools** (`helvety-pdf`, `helvety-image-upscaler`): same as user-scoped tier (Upstash required for auth callback rate limiting).
- **Gateway** (`helvety-com`): public Supabase keys + all nine zone rewrite URLs (`AUTH_URL`, `STORE_URL`, `PDF_URL`, `DOCS_URL`, `IMAGE_UPSCALER_URL`, `TASKS_URL`, `CONTACTS_URL`, `NOTES_URL`, `LINKS_URL`) when `VERCEL=1`; no `HELVETY_COOKIE_SIGNING_SECRET`, Upstash, or `SUPABASE_SECRET_KEY`.
