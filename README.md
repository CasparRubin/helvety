# Helvety

Monorepo for Helvety **web applications** served from **helvety.com** (Next.js path zones and shared packages).

## Overview

Helvety is a Next.js monorepo for apps served under `helvety.com` paths:

- Other Helvety products (browser extensions, SPFx controls, WinUI tools, and similar) are **distributed separately** from their own repositories; where source is published for those products, it is **AGPL-3.0-licensed**. The [Helvety Store](https://helvety.com/store) lists installers and deep links across the full product line.
- Public gateway and tools: `web`, `store`, `pdf`, `image-upscaler`
- Centralized account: `auth` (not an E2EE vault app; hosts shared sign-in)
- Client-encrypted apps (E2EE): `tasks`, `contacts`, `notes`, `links`
- Shared packages: `@helvety/shared`, `@helvety/ui`, `@helvety/config`, `@helvety/brand`, `@helvety/light-pillar` (Store/Auth shell backdrop)

Root layouts follow two shared shells. Public apps (`web`, `auth`, `store`, `pdf`, `image-upscaler`) use `@helvety/ui/helvety-public-shell-root-layout`, while E2EE apps (`tasks`, `contacts`, `notes`, `links`) use `@helvety/ui/e2ee-app-root-layout`. **Store** and **Auth** wrap the public shell in `@helvety/light-pillar` (`HelvetyShellWithLightPillarBackdrop`: shell UI paints first; Light Pillar WebGL on **md+**, static `bg-background` below **md** or with reduced motion; see [`packages/light-pillar`](packages/light-pillar/README.md)). Command bars (store section nav, list toolbars, PDF/image toolbars, E2EE dashboards/editors) stay pinned outside scroll via shell slots (`scrollAreaMainPrefix`, `overflow-main` flex columns, or `CommandBarPageLayout` + shadcn `ScrollArea`). Each app builds product `metadata` with `@helvety/shared/seo` (`createHelvetyProductMetadata`) in `app/layout.tsx`. Public layouts bootstrap SSR user state via `@helvety/shared/layout-session-bootstrap`; E2EE layouts bootstrap CSRF and user state inside `E2eeAppRootLayout` through the same shared helper layer.

## Applications

| App                                           | URL                                  | Purpose                                                                                                                |
| --------------------------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| [`apps/web`](apps/web/)                       | <https://helvety.com>                | Gateway app, marketing homepage (Hyperspeed + React Bits hero text), legal pages, sitemap index, cross-zone navigation |
| [`apps/auth`](apps/auth/)                     | <https://helvety.com/auth>           | Centralized passwordless auth (email OTP + passkey)                                                                    |
| [`apps/store`](apps/store/)                   | <https://helvety.com/store>          | Product catalog and package downloads                                                                                  |
| [`apps/pdf`](apps/pdf/)                       | <https://helvety.com/pdf>            | Browser-based PDF tools                                                                                                |
| [`apps/image-upscaler`](apps/image-upscaler/) | <https://helvety.com/image-upscaler> | Browser-based image upscaling                                                                                          |
| [`apps/tasks`](apps/tasks/)                   | <https://helvety.com/tasks>          | E2EE task management                                                                                                   |
| [`apps/contacts`](apps/contacts/)             | <https://helvety.com/contacts>       | E2EE contact management                                                                                                |
| [`apps/notes`](apps/notes/)                   | <https://helvety.com/notes>          | E2EE notes                                                                                                             |
| [`apps/links`](apps/links/)                   | <https://helvety.com/links>          | E2EE bookmarks with nested folders                                                                                     |

## Shared Packages

| Package                                           | Purpose                                                                                                                                                          |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`packages/brand`](packages/brand/)               | Shared brand assets                                                                                                                                              |
| [`packages/config`](packages/config/)             | Shared TypeScript, ESLint, Vitest, PostCSS, Next config                                                                                                          |
| [`packages/shared`](packages/shared/)             | Security, auth, rate-limit, and Supabase helpers, plus shared constants, SEO metadata factory, user-facing error copy, and dashboard prefetch utilities          |
| [`packages/ui`](packages/ui/)                     | Shared UI components and app-shell primitives                                                                                                                    |
| [`packages/light-pillar`](packages/light-pillar/) | Shared React Bits Light Pillar shell backdrop for Store and Auth (content-first reveal on md+; static `bg-background` below md or with `prefers-reduced-motion`) |

## Prerequisites

- [Bun](https://bun.sh/) `1.3.13`
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
# run all dev servers
bun run dev

# run one workspace
bun run dev --filter=@helvety/web

# quality checks
bun run lint
bun run type-check
bun run test
bun run format
```

## Testing Consistency

- Prefer semantic Testing Library queries (`getByRole`, `getByLabelText`) over DOM-structure or text-count assertions.
- Prefer `*.test.ts(x)` naming for tests.
- Keep `vi.mock(...)` at module scope and reset mocks in `beforeEach`; restore spies/globals in `afterEach` where applicable.
- For async rejection cases, capture one promise and assert multiple expectations against that same invocation.
- Use explicit `cleanup()` in workspace `vitest.setup.ts` files that use `@testing-library/react`.
- Prefer typed fixture builders in tests (`buildXxx(...)`) over repeated `as unknown as` casting so test inputs evolve with production types.
- Apps that bootstrap session state from `app/layout.tsx` should mock the relevant `@helvety/shared/*` helpers in `app/layout-metadata.test.ts` so metadata tests stay hermetic (see existing `web`, `store`, `auth`, and E2EE app tests).
- Vitest and related testing dependency specifiers are kept in lockstep across workspaces by [`scripts/check-workspace-version-drift.mjs`](scripts/check-workspace-version-drift.mjs) (`bun run deps:drift`) and [`scripts/check-test-hygiene.mjs`](scripts/check-test-hygiene.mjs) (`bun run test:hygiene`). Store listing counts in tests follow `STORE_PRODUCT_CARDS.length` and assert the tie-break map matches every card id; see [`packages/shared/src/store-catalog.test.ts`](packages/shared/src/store-catalog.test.ts) and [`apps/store/README.md`](apps/store/README.md) › **Adding a New Product**.

## Monorepo Conventions

- ESLint boundary rules enforce that apps do not import code directly from other apps; shared logic must live in workspace packages.
- **Naming and formatting** (files, symbols, metadata copy constants, tests): [`docs/naming-conventions.md`](docs/naming-conventions.md). Company SEO uses **Private, simple, clean** and **Engineered, designed and made in Switzerland**; AGPL belongs on legal pages, Store product About copy, and `llms.txt` licensing sections, not in site titles or metadata descriptions. Enforced by Prettier, shared ESLint in [`packages/config/eslint.mjs`](packages/config/eslint.mjs) (including `@typescript-eslint/naming-convention`), and root `consistency:*` scripts such as `consistency:guardrails`, `consistency:supabase-auth`, `consistency:license`, `consistency:customer-copy`, and `consistency:install-manifest-metadata`; see `package.json` for the full list.
- **UI/shadcn integration boundaries** (shared-vs-local primitive ownership, allowed app-local wrappers, and guardrail expectations): [`docs/ui-shadcn-integration-policy.md`](docs/ui-shadcn-integration-policy.md).
- Workspace layout, per-app entry points, and CI/release expectations are described in this file and in each app or package `README.md` (for example [`packages/ui/README.md`](packages/ui/README.md) for shared UI shells).

## Automation

All quality gates run locally. There is no GitHub Actions or other remote CI in this repo; deployment is handled by Vercel from the pushed commit.

- `bun run ci:check` (run during development) runs, in order: `consistency:proxy-docs`, `consistency:toolchain-docs`, `consistency:guardrails`, `consistency:supabase-auth`, `consistency:license`, `consistency:customer-copy`, `consistency:install-manifest-metadata`, `consistency:lifecycle-scripts`, `test:hygiene`, `deps:unused` (Knip: unused files, dependencies, exports, types), `format:check`, `lint`, `type-check`, `test`.
  - `consistency:toolchain-docs` keeps the Bun version called out in this README aligned with root `packageManager`, and keeps the Next.js documentation deep link in [`docs/naming-conventions.md`](docs/naming-conventions.md) aligned with the caret minimum in [`apps/web/package.json`](apps/web/package.json) `dependencies.next`.
- `bun run ci:release` (run before `git push` / before Vercel deploys) - `ci:check` plus `build`.
- Placeholder env mode (`SKIP_ENV_VALIDATION=1` off Vercel) is available for local build smoke tests, but `ci:release` runs with normal env validation.
- `VERCEL=1` disables placeholder mode; production builds must use real env vars.
- Additional manual dependency/security checks:
  - `bun run deps:security` (security floors + `bun audit`)
  - `bun run deps:drift` (workspace version drift)
  - `bun run deadcode:sweep` (lighter Knip + lint + type-check without the full `ci:check` suite; `deps:unused` already runs inside `ci:check`)
  - `bun run deps:check` / `bun run knip:exports` / `bun run deps:unused` (also available individually)

## Environment Model

- App URL and cookie domain logic are derived from `NODE_ENV` via shared config.
- `HELVETY_SERVER_ACTION_ALLOWED_ORIGINS` can override the server-action trusted-origin allowlist as a comma-separated list; on Vercel, defaults are derived automatically from deployment/runtime URLs plus `https://helvety.com`.
- `apps/web` additionally requires `AUTH_URL`, `STORE_URL`, `PDF_URL`, `IMAGE_UPSCALER_URL`, `TASKS_URL`, `CONTACTS_URL`, `NOTES_URL`, and `LINKS_URL` when `VERCEL=1` so multi-zone rewrites can resolve trusted internal origins.
- App READMEs document per-app env templates; shared runtime/security defaults are documented in this root README and `packages/config`.
- `HELVETY_COOKIE_SIGNING_SECRET` (min 32 characters; generate with `openssl rand -base64 48`) is required on every zone whose proxy profile enables CSRF (`e2ee-app`, `auth-gateway`, `store-gateway`, `public-tool`). It is **not** interchangeable with `SUPABASE_SECRET_KEY`. The gateway (`apps/web`, `public-marketing` profile) does not bootstrap CSRF cookies and does not need this variable.
- `SUPABASE_SECRET_KEY` is server-only and used for privileged Supabase admin/storage operations (for example signed package downloads in Store). Public download redirect allowlisting uses the project origin from `NEXT_PUBLIC_SUPABASE_URL` only.

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

- `proxy.ts` is lightweight request setup (CSP headers, optional CSRF bootstrap, and Supabase cookie refresh), not the primary auth boundary. Zone apps inline the same `config.matcher` pattern as `SECURITY_PROXY_MATCHER` in `@helvety/shared/proxy` (Next.js requires a static literal; CI guardrails keep parity) so common static files (including PDF.js and ONNX worker assets: `.mjs`, `.wasm`, `.json`) skip that chain. The `apps/web` gateway uses a custom matcher with the same static extension exclusions plus zone path skips.
- Primary auth/authz enforcement lives in Server Components, Server Actions, and route handlers. Use `supabase.auth.getUser()` (via `@helvety/shared/auth-retry` `getAuthUser` where shared) for authorization decisions; never `auth.getSession()` (`bun run consistency:supabase-auth`).
- CSRF-enabled zones sign proxy cookies with `HELVETY_COOKIE_SIGNING_SECRET` only (`packages/shared/src/cookie-signing.ts`).
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
- Internal legal update guardrails: [`docs/legal-change-guardrails.md`](docs/legal-change-guardrails.md)

## License

Licensed under the [GNU Affero General Public License v3.0 or later](./LICENSE).
