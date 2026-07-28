# Vercel monorepo app projects

Each Helvety zone is a **separate Vercel project** with **Root Directory** set to `apps/<slug>` (not the repository root). Framework preset: **Next.js**. Leave install/build/output commands at defaults; each app’s [`vercel.json`](../apps/pdf/vercel.json) only sets `"framework": "nextjs"`.

| Zone app      | Vercel project         | Root Directory      |
| ------------- | ---------------------- | ------------------- |
| Web (gateway) | `helvety-com`          | `apps/web`          |
| Store         | `helvety-store`        | `apps/store`        |
| PDF           | `helvety-pdf`          | `apps/pdf`          |
| Image Editor  | `helvety-image-editor` | `apps/image-editor` |
| OCR           | `helvety-ocr`          | `apps/ocr`          |

## Gateway env

When `VERCEL=1`, set zone URLs on `helvety-com` (`apps/web`) from [`apps/web/env.template`](../apps/web/env.template). Turbo must pass those keys at build time (`tasks.build.env` in [`turbo.json`](../turbo.json); see `WEB_GATEWAY_KEYS` in [`scripts/env-template-expectations.mjs`](../scripts/env-template-expectations.mjs)).

## Path routing on helvety.com

Canonical zone URLs (for example `https://helvety.com/pdf`) are served by **`helvety-com`** via rewrites to each zone’s deployment origin (`PDF_URL`, `STORE_URL`, …). Deploying **`helvety-pdf` alone** updates `helvety-pdf.vercel.app/pdf` but does **not** change `helvety.com/pdf` until **`helvety-com`** is redeployed with the correct gateway env. Cross-app navigation (**AppSwitcher** in `@helvety/ui`) ships with each zone’s build; no separate “ecosystem menu” deploy exists.

## Tailwind / PostCSS at build time

Zone apps re-export [`@helvety/config/postcss`](../packages/config/postcss.mjs), which loads `@tailwindcss/postcss` from **`@helvety/dev-deps`** (canonical plugin path for zone PostCSS configs and production builds). `@helvety/ui` also declares `tailwindcss` and `@tailwindcss/postcss` in **`dependencies`** so Tailwind packages sit on each zone app’s production dependency graph for Turbopack CSS processing (`@import "tailwindcss"` in shared `globals.css`). Every zone app must keep `"@helvety/ui": "workspace:*"` in `dependencies` (not only devDependencies). Versions stay canonical in `@helvety/dev-deps`; `bun run deps:drift` and `consistency:guardrails` enforce this.

## Local guardrail (`ci:check`)

`bun run consistency:vercel-apps` asserts identical `vercel.json` files and `env.template` Vercel lines for every zone. `consistency:guardrails` asserts `postcss.config.mjs` parity and `@helvety/ui` on every zone that uses shared PostCSS. See [`scripts/vercel-app-expectations.mjs`](../scripts/vercel-app-expectations.mjs).

## Environment variables (Vercel ops)

Copy keys from each zone’s `apps/<slug>/env.template` into that Vercel project (not the repo root). Tier reference: [`turbo-env-tiers.md`](./turbo-env-tiers.md). Step-by-step Vercel UI checklist: [`env-vercel-audit-checklist.md`](./env-vercel-audit-checklist.md).

- **Store** (`helvety-store`): needs keys required for catalog and package download delivery (see `apps/store/env.template`).
- **Public tools** (`helvety-pdf`, `helvety-image-editor`, `helvety-ocr`): public-tool env from each zone’s `env.template`.
- **Gateway** (`helvety-com`): zone rewrite URLs (`STORE_URL`, `PDF_URL`, `IMAGE_EDITOR_URL`, `OCR_URL`) when `VERCEL=1`. Five Vercel zone projects total.
