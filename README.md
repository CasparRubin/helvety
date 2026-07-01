# Helvety

Monorepo for Helvety **web applications** served from **helvety.com** (Next.js path zones and shared packages).

## Overview

Helvety is a Next.js monorepo for apps served under `helvety.com` paths:

- Other Helvety products (browser extensions, SPFx controls, WinUI tools, and similar) are **distributed separately** from their own repositories; where source is published for those products, it is **AGPL-3.0-licensed**. The [Helvety Store](https://helvety.com/store) lists product pages with Store-hosted downloads (for example SPFx), Chrome Web Store install links (for example Power Platform Configurator), and other install or source links across the full product line.
- Public gateway and tools: `web`, `store`, `pdf`, `image-upscaler`
- Centralized account: `auth` (not an E2EE vault app; hosts shared sign-in)
- Client-encrypted apps (E2EE): `tasks`, `contacts`, `notes`, `links`
- Shared packages: `@helvety/shared`, `@helvety/ui` (components, `globals.css`, and production Tailwind/PostCSS packages for Vercel builds), `@helvety/config` (shared config entrypoints), `@helvety/dev-deps` (canonical toolchain versions), `@helvety/brand`, `@helvety/light-pillar` (web hero WebGL utilities), `@helvety/extension-chrome` (external Chromium extension repos)

Root layouts follow two shared shells. Public apps (`web`, `auth`, `store`, `pdf`, `image-upscaler`) use `@helvety/ui/helvety-public-shell-root-layout`, while E2EE apps (`tasks`, `contacts`, `notes`, `links`) use `@helvety/ui/e2ee-app-root-layout`. Public and E2EE shells inject blocking `HelvetyThemeInitScript` in `<head>` (script body from `@helvety/shared/layout-primitives`, rendered by `@helvety/ui`) so `html.dark` and `bg-background` match storage/system before body paint; Store uses `themeProviderScope: "navbar-only"` for `ThemeProvider` placement only. The gateway homepage server-renders copy via [`HeroMarketingShell`](apps/web/components/hero-marketing-shell.tsx); WebGL Hyperspeed mounts in the client [`HeroHyperspeedLayer`](apps/web/components/hero-hyperspeed-layer.tsx) (wraps [`HeroHyperspeedBackdrop`](apps/web/components/hero-hyperspeed-backdrop.tsx); hidden until WebGL `onReady`, then fades in; hides before cross-zone navigation; see [`packages/light-pillar`](packages/light-pillar/README.md)). Command bars (store section nav, list toolbars, PDF/image toolbars, E2EE dashboards/editors) stay pinned outside scroll via shell slots (`scrollAreaMainPrefix`, `overflow-main` flex columns, or `CommandBarPageLayout` + shadcn `ScrollArea`). Each app builds product `metadata` with `@helvety/shared/seo` (`createHelvetyProductMetadata`) in `app/layout.tsx`. SSR session bootstrap uses `@helvety/shared/layout-session-bootstrap` and `@helvety/shared/cached-server`: `bootstrapPublicLayoutUser()` on the gateway (`web`) and public tool layouts (`pdf`, `image-upscaler`); `bootstrapE2eeLayoutSession()` for CSRF + user (store root layout, E2EE apps via `E2eeAppRootLayout`); auth uses `bootstrapAuthLayoutSession()` for CSRF + user in its layout.

## Applications

| App                                           | URL                                  | Purpose                                                                                                                 |
| --------------------------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| [`apps/web`](apps/web/)                       | <https://helvety.com>                | Gateway app, marketing homepage (static SSR hero + Hyperspeed WebGL), legal pages, sitemap index, cross-zone navigation |
| [`apps/auth`](apps/auth/)                     | <https://helvety.com/auth>           | Centralized passwordless auth (email OTP + passkey)                                                                     |
| [`apps/store`](apps/store/)                   | <https://helvety.com/store>          | Product catalog, SPFx package downloads, and external install links (for example Chrome Web Store)                      |
| [`apps/pdf`](apps/pdf/)                       | <https://helvety.com/pdf>            | Browser-based PDF tools                                                                                                 |
| [`apps/image-upscaler`](apps/image-upscaler/) | <https://helvety.com/image-upscaler> | Browser-based image upscaling                                                                                           |
| [`apps/tasks`](apps/tasks/)                   | <https://helvety.com/tasks>          | E2EE task management                                                                                                    |
| [`apps/contacts`](apps/contacts/)             | <https://helvety.com/contacts>       | E2EE contact management                                                                                                 |
| [`apps/notes`](apps/notes/)                   | <https://helvety.com/notes>          | E2EE notes                                                                                                              |
| [`apps/links`](apps/links/)                   | <https://helvety.com/links>          | E2EE bookmarks with nested folders                                                                                      |

## Shared Packages

| Package                                                   | Purpose                                                                                                                                                                                                                                                                   |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`packages/brand`](packages/brand/)                       | Shared brand assets                                                                                                                                                                                                                                                       |
| [`packages/config`](packages/config/)                     | Shared ESLint, TypeScript, Vitest, PostCSS, and Next.js **configuration** entrypoints (not pinned toolchain versions)                                                                                                                                                     |
| [`packages/dev-deps`](packages/dev-deps/)                 | Canonical **toolchain dependency versions** (`eslint`, `typescript`, `vitest`, `prettier`, testing libraries, Tailwind PostCSS packages), pinned in this package’s **`dependencies`**; workspaces consume via `"@helvety/dev-deps": "workspace:*"` in **devDependencies** |
| [`packages/shared`](packages/shared/)                     | Security, auth, rate-limit, and Supabase helpers, plus shared constants, SEO metadata factory, user-facing error copy, and dashboard prefetch utilities                                                                                                                   |
| [`packages/ui`](packages/ui/)                             | Shared UI components, `globals.css`, and **production** `tailwindcss` / `@tailwindcss/postcss` (Turbopack CSS graph for zone builds; PostCSS plugin path via `@helvety/config/postcss` → dev-deps)                                                                        |
| [`packages/light-pillar`](packages/light-pillar/)         | Shared WebGL backdrop utilities for the marketing homepage Hyperspeed hero                                                                                                                                                                                                |
| [`packages/extension-chrome`](packages/extension-chrome/) | Shared Chromium extension UI chrome for external extension repos (side panels and action popups; not used by Next.js zones in this monorepo)                                                                                                                              |

## Prerequisites

- [Bun](https://bun.sh/) `1.3.14`
- [Node.js](https://nodejs.org/) `24.x`

## Getting Started

```bash
git clone https://github.com/CasparRubin/helvety.git
cd helvety
bun install
```

Copy env templates only for apps you will run:

```bash
cp apps/web/env.template apps/web/.env.local
cp apps/auth/env.template apps/auth/.env.local
cp apps/store/env.template apps/store/.env.local
cp apps/pdf/env.template apps/pdf/.env.local
cp apps/image-upscaler/env.template apps/image-upscaler/.env.local
cp apps/tasks/env.template apps/tasks/.env.local
cp apps/contacts/env.template apps/contacts/.env.local
cp apps/notes/env.template apps/notes/.env.local
cp apps/links/env.template apps/links/.env.local
```

## Common Commands

```bash
# run all zone dev servers (gateway http://localhost:3001; warms ports before "ready")
bun run dev

# run one workspace
bun run dev --filter=@helvety/web

# env: audit local .env.local vs templates; resync comments/structure (keeps values)
bun run consistency:local-env
bun run sync:local-env

# quality checks
bun run lint
bun run type-check
bun run test
bun run format

# remove local gitignored artifacts (.next/, coverage/, .turbo/, test-results/, .DS_Store, …)
# skips coverage/ dirs while Vitest is writing coverage (.tmp) or when HELVEY_SKIP_COVERAGE_CLEAN=1
bun run clean:artifacts

# optional: Playwright gateway smoke (all zones via ci:check:e2e, or gateway-only test:e2e)
bun run ci:check:e2e
# HELVETY_SMOKE_BASE_URL=http://localhost:3001 bun run test:e2e

# print E2EE zone scaffold checklist (copy from apps/contacts)
bun run scaffold:e2ee-zone <app-slug>
```

## Testing Consistency

- Prefer semantic Testing Library queries (`getByRole`, `getByLabelText`) over DOM-structure or text-count assertions.
- Prefer `*.test.ts(x)` naming for tests.
- Keep `vi.mock(...)` at module scope and reset mocks in `beforeEach`; restore spies/globals in `afterEach` where applicable.
- For async rejection cases, capture one promise and assert multiple expectations against that same invocation.
- Workspace `vitest.setup.ts` files use `/// <reference types="@testing-library/jest-dom/vitest" />` plus `import "@helvety/config/vitest.setup";` (matchers + RTL `cleanup()` in [`packages/config/vitest.setup.shared.ts`](packages/config/vitest.setup.shared.ts)); do not duplicate that setup locally.
- Prefer typed fixture builders in tests (`buildXxx(...)`) over repeated `as unknown as` casting so test inputs evolve with production types.
- Apps that bootstrap session state from `app/layout.tsx` should mock the relevant `@helvety/shared/*` helpers in `app/layout-metadata.test.ts` so metadata tests stay hermetic (see existing `web`, `store`, `auth`, and E2EE app tests).
- Shared toolchain versions (`eslint`, `typescript`, `vitest`, `prettier`, testing libraries, Tailwind PostCSS, and related packages) live in [`packages/dev-deps`](packages/dev-deps) **`dependencies`**. Apps and packages declare `"@helvety/dev-deps": "workspace:*"` in **devDependencies** instead of duplicating those entries. [`packages/config/vitest.mjs`](packages/config/vitest.mjs) resolves testing-library from dev-deps; [`packages/config/postcss.mjs`](packages/config/postcss.mjs) loads the Tailwind PostCSS plugin from dev-deps. **`@helvety/ui`** also declares production `tailwindcss` and `@tailwindcss/postcss` so Tailwind packages sit on zone apps’ production dependency graph for Turbopack (see [`packages/dev-deps/README.md`](packages/dev-deps/README.md)). Runtime dependency specifiers are kept in lockstep by [`scripts/check-workspace-version-drift.mjs`](scripts/check-workspace-version-drift.mjs) (`bun run deps:drift`, also in `ci:check`) and [`scripts/check-test-hygiene.mjs`](scripts/check-test-hygiene.mjs) (`bun run test:hygiene`, including required `proxy.test.ts` per zone). Store listing counts in tests follow `STORE_PRODUCT_CARDS.length` and assert the tie-break map matches every card id; see [`packages/shared/src/store-catalog.test.ts`](packages/shared/src/store-catalog.test.ts) and [`apps/store/README.md`](apps/store/README.md) › **Adding a New Product**.

## Monorepo Conventions

- ESLint boundary rules enforce that apps do not import code directly from other apps; shared logic must live in workspace packages.
- **Naming and formatting** (files, symbols, metadata copy constants, tests): [`docs/naming-conventions.md`](docs/naming-conventions.md). **New or audited apps**: [`docs/app-consistency-checklist.md`](docs/app-consistency-checklist.md). Company SEO uses **Private, simple, clean** and **Engineered, designed and made in Switzerland**; AGPL belongs on legal pages, Store product About copy, and `llms.txt` licensing sections, not in site titles or metadata descriptions. Enforced by Prettier, shared ESLint in [`packages/config/eslint.mjs`](packages/config/eslint.mjs) (including `@typescript-eslint/naming-convention`), and root `consistency:*` scripts such as `consistency:proxy-docs` (web gateway proxy README only), `consistency:toolchain-docs`, `consistency:env-templates`, `consistency:local-env`, `consistency:vercel-apps`, `consistency:guardrails`, `consistency:zone-modernization`, `consistency:supabase-auth`, `consistency:e2ee-aad`, `consistency:auth-action-guards`, `consistency:extension-auth`, `consistency:workspace-scripts`, `consistency:supabase-schema`, `consistency:license`, `consistency:customer-copy`, `consistency:install-manifest-metadata`, `consistency:lifecycle-scripts`, `consistency:pdfjs-worker`, `consistency:filenames`, and `consistency:project-naming` (retired Power Platform Configurator slugs); see `package.json` for the full list.
- **UI/shadcn integration boundaries** (shared primitives in `@helvety/ui/*` only; no `apps/*/components/ui/`): [`docs/ui-shadcn-integration-policy.md`](docs/ui-shadcn-integration-policy.md).
- Workspace layout, per-app entry points, and `ci:check` / `ci:release` expectations are described in this file and in each app or package `README.md` (for example [`packages/ui/README.md`](packages/ui/README.md) for shared UI shells).

## Documentation

Full index: [`docs/README.md`](docs/README.md). Key references:

- **New or audited apps:** [`docs/app-consistency-checklist.md`](docs/app-consistency-checklist.md)
- **Architecture contracts:** [`docs/quality-modernization-baseline.md`](docs/quality-modernization-baseline.md)
- **Vercel monorepo setup:** [`docs/vercel-monorepo-apps.md`](docs/vercel-monorepo-apps.md)
- **Security review cadence:** [`docs/security-review-runbook.md`](docs/security-review-runbook.md)

## Automation

Quality gates run locally via `bun run ci:check` and `bun run ci:release` before push. Vercel builds and deploys from the pushed commit.

- `bun run ci:check` (run during development) runs, in order: `consistency:proxy-docs`, `consistency:toolchain-docs`, `consistency:env-templates`, `consistency:vercel-apps`, `consistency:guardrails`, `consistency:zone-modernization`, `consistency:supabase-auth`, `consistency:e2ee-aad`, `consistency:auth-action-guards`, `consistency:extension-auth`, `consistency:workspace-scripts`, `consistency:supabase-schema`, `consistency:license`, `consistency:customer-copy`, `consistency:install-manifest-metadata`, `consistency:lifecycle-scripts`, `consistency:project-naming`, `test:hygiene`, `deps:security:floors`, `deps:drift`, `consistency:pdfjs-worker`, `consistency:filenames`, `deps:unused` (Knip: unused files, dependencies, exports, types), `format:check`, `lint`, `type-check`, `test`.
  - `consistency:pdfjs-worker` syncs the PDF zone worker from react-pdf's resolved `pdfjs-dist` and rejects API/worker version skew or independent `pdfjs-dist` pins (see [`apps/pdf/README.md`](apps/pdf/README.md) › PDF.js stack).
  - `consistency:proxy-docs` (web gateway `apps/web/proxy.ts` ↔ `apps/web/README.md` only) keeps the public marketing proxy contract documented.
  - `consistency:toolchain-docs` keeps the Bun version called out in this README aligned with root `packageManager`, keeps the Next.js documentation deep link in [`docs/naming-conventions.md`](docs/naming-conventions.md) aligned with the caret minimum in [`apps/web/package.json`](apps/web/package.json) `dependencies.next`, keeps this README's documented `ci:check` step order aligned with `package.json` (all steps, not only `consistency:*`), and keeps Tailwind/PostCSS Vercel guidance aligned across root, [`packages/ui/README.md`](packages/ui/README.md), and [`packages/dev-deps/README.md`](packages/dev-deps/README.md).
- `bun run ci:release` (run before `git push` / before Vercel deploys): `clean:artifacts`, then `ci:check`, then `build`.
- Placeholder env mode (`SKIP_ENV_VALIDATION=1` off Vercel) is available for local build smoke tests, but `ci:release` runs with normal env validation.
- `VERCEL=1` disables placeholder mode; production builds must use real env vars.
- Additional manual dependency/security checks (see [`docs/security-review-runbook.md`](docs/security-review-runbook.md)):
  - `bun run consistency:vercel-prod-env` and `bun run consistency:vercel-preview-env` (Vercel CLI login; Production/Preview env tier parity)
  - `bun run consistency:supabase-rls` (local `supabase/supabase.json` export; gitignored)
  - `bun run deps:security` (security floors + `bun audit`)
  - `bun run deps:drift` (also runs inside `ci:check`; toolchain via `@helvety/dev-deps`)
  - `bun run deps:inventory` (extended pins: ONNX SHA-256, vendored worker/WASM, key lockfile versions; see [`docs/dependency-inventory.md`](docs/dependency-inventory.md))
  - Cursor **dependency-update** skill (`.cursor/skills/dependency-update/`) for full npm + extended sweeps with upstream release research
  - `bun run deps:outdated` then filtered `bun update <pkg...> --filter='@helvety/*'` before releases (manual; no Renovate/Dependabot; see `.cursor/skills/dependency-update/`; never bare `bun update -r` at repo root)
  - `bun run deadcode:sweep` (lighter Knip + lint + type-check without the full `ci:check` suite; `deps:unused` already runs inside `ci:check`)
  - `bun run clean:artifacts` (removes local gitignored `.next/`, `coverage/`, `.turbo/`, test reports, `.DS_Store`; skips active Vitest `coverage/.tmp`; smoke-tested in `@helvety/shared` guardrail tests)
  - `bun run deps:check` / `bun run knip:exports` / `bun run knip:full` / `bun run deps:unused` (also available individually; `knip:full` scans the whole monorepo without `ci:check` entry filters)
  - Optional local dead-code triage: `bun run fallow` / `fallow:dead-code` / `fallow:dupes` / `fallow:health` / `fallow:fix` (`.fallowrc.json`; not in `ci:check`; Knip remains the CI gate via `deps:unused`)
  - `HELVETY_SMOKE_BASE_URL=http://localhost:3001 bun run test:e2e` or `bun run ci:check:e2e` (Playwright gateway smoke; `ci:check:e2e` installs Chromium if needed and starts all zone dev servers when the base URL is unset)

## Environment Model

- Copy each app's `env.template` to `.env.local` before running that app (see setup commands above). `bun run consistency:env-templates` (in `ci:check`) keeps every template aligned with startup validation in `lib/env.ts` and gateway config in `apps/web/next.config.ts`. `bun run consistency:local-env` audits local `.env.local` files against those tiers and shared-secret parity before you sync Vercel Production/Preview. `bun run sync:local-env` rewrites existing `.env.local` files from templates (comments/structure only; values preserved).
- App URL and cookie domain logic are derived from `NODE_ENV` via shared config (`packages/shared/src/config.ts`).
- **Per-app tiers** (see each `apps/*/env.template`, app README, [`docs/turbo-env-tiers.md`](docs/turbo-env-tiers.md), and [`docs/env-vercel-audit-checklist.md`](docs/env-vercel-audit-checklist.md) for how Turbo `build.env` relates to runtime requirements and Vercel project setup):
  - **Admin + rate limit** (`auth`, `store`): `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (`sb_publishable_*` only), `SUPABASE_SECRET_KEY`, Upstash Redis, `HELVETY_COOKIE_SIGNING_SECRET`.
  - **User-scoped + rate limit** (`notes`, `tasks`, `contacts`, `links`): `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (`sb_publishable_*` only), Upstash Redis, `HELVETY_COOKIE_SIGNING_SECRET`, **`DEVICE_TRUST_COOKIE_SECRET`** (same value as `auth`; weekly device-trust gate; no admin client; vault CRUD uses user client + RLS).
  - **Auth only** adds `HELVETY_CHROME_EXTENSION_ORIGINS` (comma-separated Chromium extension ids, or `chrome-extension://<id>`, for extension auth APIs: OTP + passkey). `DEVICE_TRUST_COOKIE_SECRET` is also set on `auth` (mint) and user-scoped E2EE zones (verify).
  - **Public tools + rate limit** (`pdf`, `image-upscaler`): `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (`sb_publishable_*` only), Upstash Redis, and `HELVETY_COOKIE_SIGNING_SECRET` (no `SUPABASE_SECRET_KEY`; auth callbacks require Upstash strict rate limiting).
  - **Gateway** (`web`): `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (`sb_publishable_*` only) plus internal rewrite URLs (`AUTH_URL`, `STORE_URL`, `PDF_URL`, `IMAGE_UPSCALER_URL`, `TASKS_URL`, `CONTACTS_URL`, `NOTES_URL`, `LINKS_URL`) when `VERCEL=1`.
- **Optional** (commented in every `env.template`; not required for normal local dev): `SKIP_ENV_VALIDATION=1` (local build smoke tests only, off Vercel; `ci:release` uses real validation), and `HELVETY_SERVER_ACTION_ALLOWED_ORIGINS` (comma-separated Server Actions origin override; on Vercel, defaults come from deployment URLs plus `https://helvety.com`).
- `apps/web` requires `AUTH_URL`, `STORE_URL`, `PDF_URL`, `IMAGE_UPSCALER_URL`, `TASKS_URL`, `CONTACTS_URL`, `NOTES_URL`, and `LINKS_URL` when `VERCEL=1` so multi-zone rewrites can resolve trusted internal origins. Local dev falls back to localhost ports.
- `HELVETY_COOKIE_SIGNING_SECRET` (min 32 characters; generate with `openssl rand -base64 48`) is required on every zone whose proxy profile enables CSRF (`e2ee-app`, `auth-gateway`, `store-gateway`, `public-tool`). It is **not** interchangeable with `SUPABASE_SECRET_KEY`. The gateway (`apps/web`, `public-marketing` profile) does not bootstrap CSRF cookies and does not need this variable.
- `SUPABASE_SECRET_KEY` is server-only and required on **admin-tier** zones (`auth`, `store`) for privileged Supabase admin/storage operations (for example signed package downloads in Store). E2EE vault zones use the user-scoped client + RLS instead and do not deploy this key.

## Supabase Workflow (Remote-First)

- This repo does not run a local Supabase stack.
- Schema/policy changes are made in the hosted Supabase project.
- `supabase/getSupabase.sql` is used for export/audit queries.
- `supabase/supabase.json` is local-only (gitignored) and must never be committed.
- Regenerate shared DB types when needed:

```bash
SUPABASE_PROJECT_ID=<project-ref> bun run db:gen-types
```

## Security Posture (High Level)

- `proxy.ts` is lightweight request setup (CSP headers with per-request nonce and zone-aware `report-uri` / `report-to` endpoints, CSRF bootstrap/re-issue when needed, and Supabase cookie refresh), not the primary auth boundary. Zoned apps report CSP violations to `/{basePath}/api/csp-report` (gateway uses `/api/csp-report`). Zone `createAppProxy` helpers refresh sessions on root → `basePath` redirects when `sb-*` auth cookies are present; `createSecurityProxy` refreshes on normal document requests and sets `x-helvety-auth-refreshed` when it persisted refreshed cookies so layouts do not retry cookie writes in RSC (route handlers and server actions use `createServerMutatingClient` for session mutations). All session-bearing proxy profiles (**`auth-gateway`**, **`e2ee-app`**, **`store-gateway`**, **`public-tool`**) fail closed on auth refresh errors (clear stale `sb-*` cookies instead of leaving a broken session). The gateway (**`public-marketing`**, `apps/web`) does not. Zone apps inline the same `config.matcher` pattern as `SECURITY_PROXY_MATCHER` in `@helvety/shared/proxy` (Next.js requires a static literal; `ci:check` guardrails keep parity) so common static files (including PDF.js and ONNX worker assets: `.mjs`, `.wasm`, `.json`) skip that chain. The `apps/web` gateway uses a custom matcher with the same static extension exclusions plus zone path skips. Shared public shells target shadcn `ScrollArea` via `[data-slot=scroll-area-viewport]` child selectors (not legacy `data-radix-scroll-area-viewport`).
- Proxy session refresh verifies cookies with `auth.getClaims()` at the edge; **authorization** in Server Components, Server Actions, and route handlers uses `supabase.auth.getUser()` (via `@helvety/shared/auth-retry` `getAuthUser` where shared). Never use `auth.getSession()` for access decisions (`bun run consistency:supabase-auth`). `@supabase/ssr` 0.12+ may pass no-store cache headers through `setAll`; the proxy applies them on refresh and preserves them when rebuilding the outgoing response so authenticated pages are not cached with stale cookies.
- CSRF-enabled zones sign proxy cookies with `HELVETY_COOKIE_SIGNING_SECRET` only (`packages/shared/src/cookie-signing.ts`). The proxy re-issues invalid or stale `csrf_token` cookies (not only when the cookie is absent); rotate the signing secret in Vercel rather than reusing `SUPABASE_SECRET_KEY`.
- Chromium extension sign-in and unlock use public OTP routes and Bearer passkey JSON routes on `helvety-auth`; OTP verify returns server-HMAC `weekly_proof` stored as `helvety_extension_weekly_proof` (Bearer routes require `X-Helvety-Weekly-Proof`). The extension **does not receive the web `helvety_device_trust` HttpOnly cookie**. Allowed extension ids are configured via `HELVETY_CHROME_EXTENSION_ORIGINS` (bare id or `chrome-extension://<id>`; see [`apps/auth/docs/extension-passkey-production.md`](apps/auth/docs/extension-passkey-production.md)).
- All nine Next.js zones share a cookie/storage notice in root layouts (no third-party analytics). User-facing disclosure: Privacy §9; shared footer points to Privacy for storage ([`docs/cookies-telemetry-and-footer.md`](docs/cookies-telemetry-and-footer.md)).
- E2EE apps (`tasks`, `contacts`, `notes`, `links`) enforce server-side page guards and passkey-based unlock flows.

## Project Structure

```text
helvety/
├── apps/
├── packages/
├── supabase/
├── turbo.json
└── package.json
```

Architecture entry points and flow references are documented in each app/package README and in the shared runtime/security docs under `packages/shared`.

## Service and Legal

Services are primarily intended for customers in Switzerland and are not
actively targeted to EU/EEA markets at this time. Account-based flows include a
non-EU/EEA attestation step during sign-in as an eligibility control (not
strict geolocation enforcement). Legal pages are hosted on
<https://helvety.com>:

- Privacy: <https://helvety.com/privacy>
- Terms: <https://helvety.com/terms>
- Impressum (including abuse reporting): <https://helvety.com/impressum#abuse>
- Cookies and shared footer (developer reference): [`docs/cookies-telemetry-and-footer.md`](docs/cookies-telemetry-and-footer.md)
- Internal legal update guardrails: [`docs/legal-change-guardrails.md`](docs/legal-change-guardrails.md)

## License

Licensed under the [GNU Affero General Public License v3.0 or later](./LICENSE).
