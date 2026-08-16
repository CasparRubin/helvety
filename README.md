# Helvety

Monorepo for Helvety **web applications** served from **helvety.com** (Next.js path zones and shared packages).

## Overview

Helvety is a Next.js monorepo for apps served under `helvety.com` paths:

- Other Helvety products (browser extensions, SPFx controls, Windows desktop tools, and similar) are **distributed separately** from their own repositories; where source is published for those products, the applicable repository `LICENSE` file governs it. The [Helvety Store catalog](https://helvety.com/store/products) lists product pages with Store-hosted downloads (for example SPFx and desktop ZIPs), Chrome Web Store install links (for example Power Platform Configurator), and other install or source links across the full product line (zone root `/store` redirects to that catalog).
- Public gateway and tools: `web`, `store`, `pdf`, `image-editor`, `ocr`
- Shared packages: `@helvety/shared`, `@helvety/ui` (components, `globals.css`, and production Tailwind/PostCSS packages for Vercel builds), `@helvety/config` (shared config entrypoints), `@helvety/dev-deps` (canonical toolchain versions), `@helvety/brand`, `@helvety/extension-chrome` (shared UI chrome for external extension repos such as Power Platform Configurator)

Root layouts for these zones use `@helvety/ui/helvety-public-shell-root-layout`. Shells inject blocking `HelvetyThemeInitScript` in `<head>` (script body from `@helvety/shared/layout-primitives`, rendered by `@helvety/ui`) so `html.dark` and `bg-background` match storage/system before body paint; Store uses `themeProviderScope: "navbar-only"` for `ThemeProvider` placement only. The gateway homepage server-renders copy via [`HeroMarketingShell`](apps/web/components/hero-marketing-shell.tsx) on a plain theme background (company-values tagline `private · simple · clean` from `HELVETY_COMPANY_VALUES_TAGLINE`). Command bars (store section nav, PDF/image/OCR toolbars) stay pinned outside scroll via shell slots (`scrollAreaMainPrefix`, `overflow-main` flex columns). Each app builds product `metadata` with `@helvety/shared/seo` (`createHelvetyProductMetadata`) in `app/layout.tsx`.

## Applications

| App                                       | URL                                | Purpose                                                                                                                                |
| ----------------------------------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| [`apps/web`](apps/web/)                   | <https://helvety.com>              | Gateway app, marketing homepage (static SSR hero on plain theme background), legal pages, sitemap index, cross-zone navigation         |
| [`apps/store`](apps/store/)               | <https://helvety.com/store>        | Product catalog (landing `/store/products`), Store-hosted package downloads, and external install links (for example Chrome Web Store) |
| [`apps/pdf`](apps/pdf/)                   | <https://helvety.com/pdf>          | Browser-based PDF tools                                                                                                                |
| [`apps/image-editor`](apps/image-editor/) | <https://helvety.com/image-editor> | Browser-based image annotation                                                                                                         |
| [`apps/ocr`](apps/ocr/)                   | <https://helvety.com/ocr>          | Browser-based OCR for PDFs and images                                                                                                  |

## Shared Packages

| Package                                                   | Purpose                                                                                                                                                                                                                                                                   |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`packages/brand`](packages/brand/)                       | Shared brand assets                                                                                                                                                                                                                                                       |
| [`packages/config`](packages/config/)                     | Shared ESLint, TypeScript, Vitest, PostCSS, and Next.js **configuration** entrypoints (not pinned toolchain versions)                                                                                                                                                     |
| [`packages/dev-deps`](packages/dev-deps/)                 | Canonical **toolchain dependency versions** (`eslint`, `typescript`, `vitest`, `prettier`, testing libraries, Tailwind PostCSS packages), pinned in this package’s **`dependencies`**; workspaces consume via `"@helvety/dev-deps": "workspace:*"` in **devDependencies** |
| [`packages/shared`](packages/shared/)                     | Shared config, SEO, rate-limit, CSP, licensing, ecosystem/store catalog, and public-tool helpers                                                                                                                                                                          |
| [`packages/ui`](packages/ui/)                             | Shared UI components, `globals.css`, and **production** `tailwindcss` / `@tailwindcss/postcss` (Turbopack CSS graph for zone builds; PostCSS plugin path via `@helvety/config/postcss` → dev-deps)                                                                        |
| [`packages/extension-chrome`](packages/extension-chrome/) | Shared Chromium extension UI chrome for external extension repos (action popups; not used by Next.js zones in this monorepo)                                                                                                                                              |

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
cp apps/store/env.template apps/store/.env.local
cp apps/pdf/env.template apps/pdf/.env.local
cp apps/image-editor/env.template apps/image-editor/.env.local
cp apps/ocr/env.template apps/ocr/.env.local
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

# remove local gitignored artifacts (.next/, coverage/, .turbo/, .DS_Store, …)
# skips coverage/ dirs while Vitest is writing coverage (.tmp) or when HELVEY_SKIP_COVERAGE_CLEAN=1
bun run clean:artifacts
```

## Testing Consistency

- Prefer semantic Testing Library queries (`getByRole`, `getByLabelText`) over DOM-structure or text-count assertions.
- Prefer `*.test.ts(x)` naming for tests.
- Keep `vi.mock(...)` at module scope and reset mocks in `beforeEach`; restore spies/globals in `afterEach` where applicable.
- For async rejection cases, capture one promise and assert multiple expectations against that same invocation.
- Workspace `vitest.setup.ts` files use `/// <reference types="@testing-library/jest-dom/vitest" />` plus `import "@helvety/config/vitest.setup";` (matchers + RTL `cleanup()` in [`packages/config/vitest.setup.shared.ts`](packages/config/vitest.setup.shared.ts)); do not duplicate that setup locally.
- Prefer typed fixture builders in tests (`buildXxx(...)`) over repeated `as unknown as` casting so test inputs evolve with production types.
- When `app/layout.tsx` imports shared helpers for metadata tests, mock those `@helvety/shared/*` modules in `app/layout-metadata.test.ts` so metadata tests stay hermetic (see existing `web` and `store` tests).
- Shared toolchain versions (`eslint`, `typescript`, `vitest`, `prettier`, testing libraries, Tailwind PostCSS, and related packages) live in [`packages/dev-deps`](packages/dev-deps) **`dependencies`**. Apps and packages declare `"@helvety/dev-deps": "workspace:*"` in **devDependencies** instead of duplicating those entries. [`packages/config/vitest.mjs`](packages/config/vitest.mjs) resolves testing-library from dev-deps; [`packages/config/postcss.mjs`](packages/config/postcss.mjs) loads the Tailwind PostCSS plugin from dev-deps. **`@helvety/ui`** also declares production `tailwindcss` and `@tailwindcss/postcss` so Tailwind packages sit on zone apps’ production dependency graph for Turbopack (see [`packages/dev-deps/README.md`](packages/dev-deps/README.md)). Runtime dependency specifiers are kept in lockstep by [`scripts/workspace-version-drift.config.json`](scripts/workspace-version-drift.config.json) (enforced by [`scripts/check-workspace-version-drift.mjs`](scripts/check-workspace-version-drift.mjs) / `bun run deps:drift`, also in `ci:check`) and [`scripts/check-test-hygiene.mjs`](scripts/check-test-hygiene.mjs) (`bun run test:hygiene`, including required `proxy.test.ts` per zone). Store listing counts in tests follow `STORE_PRODUCT_CARDS.length` and assert the tie-break map matches every card id; see [`packages/shared/src/store-catalog.test.ts`](packages/shared/src/store-catalog.test.ts) and [`apps/store/README.md`](apps/store/README.md) › **Adding a New Product**.

## Monorepo Conventions

- ESLint boundary rules enforce that apps do not import code directly from other apps; shared logic must live in workspace packages.
- **Naming and formatting** (files, symbols, metadata copy constants, tests): [`docs/naming-conventions.md`](docs/naming-conventions.md). **New or audited apps**: [`docs/app-consistency-checklist.md`](docs/app-consistency-checklist.md). Company SEO uses **Private, simple, clean** and **Engineered, designed and made in Switzerland**; AGPL belongs on legal pages, Store product About copy, and `llms.txt` licensing sections, not in site titles or metadata descriptions. Enforced by Prettier, shared ESLint in [`packages/config/eslint.mjs`](packages/config/eslint.mjs) (including `@typescript-eslint/naming-convention`), and root `consistency:*` scripts such as `consistency:proxy-docs` (web gateway proxy README only), `consistency:toolchain-docs`, `consistency:env-templates`, `consistency:local-env`, `consistency:vercel-apps`, `consistency:guardrails`, `consistency:ui-actions`, `consistency:zone-modernization`, `consistency:workspace-scripts`, `consistency:license`, `consistency:customer-copy`, `consistency:install-manifest-metadata`, `consistency:lifecycle-scripts`, `consistency:pdfjs-worker`, `consistency:filenames`, and `consistency:project-naming` (retired Power Platform Configurator slugs); see `package.json` for the full list.
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

- `bun run ci:check` (run during development) runs, in order: `consistency:proxy-docs`, `consistency:toolchain-docs`, `consistency:env-templates`, `consistency:vercel-apps`, `consistency:guardrails`, `consistency:ui-actions`, `consistency:zone-modernization`, `consistency:workspace-scripts`, `consistency:license`, `consistency:customer-copy`, `consistency:install-manifest-metadata`, `consistency:lifecycle-scripts`, `consistency:project-naming`, `test:hygiene`, `deps:security:floors`, `deps:drift`, `consistency:pdfjs-worker`, `consistency:filenames`, `deps:unused` (Knip: unused files, dependencies, exports, types), `format:check`, `lint`, `type-check`, `test`.
  - `consistency:ui-actions` enforces `@helvety/ui/sonner` imports in apps, public-tool workspace constants (`PUBLIC_TOOL_SIDEBAR_WIDTH_CLASS`), and extension OKLCH token imports (see [`docs/ui-action-button-contract.md`](docs/ui-action-button-contract.md)).
  - `consistency:pdfjs-worker` syncs the PDF and OCR zone workers from react-pdf's resolved `pdfjs-dist` and rejects API/worker version skew or independent `pdfjs-dist` pins (see [`apps/pdf/README.md`](apps/pdf/README.md) and [`apps/ocr/README.md`](apps/ocr/README.md) › PDF.js stack).
  - `consistency:proxy-docs` (web gateway `apps/web/proxy.ts` ↔ `apps/web/README.md` only) keeps the public marketing proxy contract documented.
  - `consistency:toolchain-docs` keeps the Bun version called out in this README aligned with root `packageManager`, keeps the Next.js documentation deep link in [`docs/naming-conventions.md`](docs/naming-conventions.md) aligned with the caret minimum in [`apps/web/package.json`](apps/web/package.json) `dependencies.next`, keeps this README's documented `ci:check` step order aligned with `package.json` (all steps, not only `consistency:*`), and keeps Tailwind/PostCSS Vercel guidance aligned across root, [`packages/ui/README.md`](packages/ui/README.md), and [`packages/dev-deps/README.md`](packages/dev-deps/README.md).
- `bun run ci:release` (run before `git push` / before Vercel deploys): `clean:artifacts`, then `ci:check`, then `build`.
- Placeholder env mode (`SKIP_ENV_VALIDATION=1` off Vercel) is available for local build smoke tests, but `ci:release` runs with normal env validation.
- `VERCEL=1` disables placeholder mode; production builds must use real env vars.
- Additional manual dependency/security checks (see [`docs/security-review-runbook.md`](docs/security-review-runbook.md)):
  - `bun run consistency:vercel-prod-env` and `bun run consistency:vercel-preview-env` (Vercel CLI login; Production/Preview env tier parity)
  - `bun run deps:security` (security floors + `bun audit`)
  - `bun run deps:drift` (also runs inside `ci:check`; toolchain via `@helvety/dev-deps`)
  - `bun run deps:inventory` (extended pins: vendored worker assets, key lockfile versions; see [`docs/dependency-inventory.md`](docs/dependency-inventory.md))
  - Cursor **dependency-update** skill (`.cursor/skills/dependency-update/`) for full npm + extended sweeps with upstream release research
  - `bun run deps:outdated` then filtered `bun update <pkg...> --filter='@helvety/*'` before releases (manual; no Renovate/Dependabot; see `.cursor/skills/dependency-update/`; never bare `bun update -r` at repo root)
  - `bun run deadcode:sweep` (lighter Knip + lint + type-check without the full `ci:check` suite; `deps:unused` already runs inside `ci:check`)
  - `bun run clean:artifacts` (removes local gitignored `.next/`, `coverage/`, `.turbo/`, `.DS_Store`; skips active Vitest `coverage/.tmp`; smoke-tested in `@helvety/shared` guardrail tests)
  - `bun run deps:check` / `bun run knip:exports` / `bun run knip:full` / `bun run deps:unused` (`deps:unused` is the CI gate; `knip:full` also reports unlisted deps and binaries that `ci:check` does not fail on)
  - Optional local dead-code triage: `bun run fallow` / `fallow:dead-code` / `fallow:dupes` / `fallow:health` / `fallow:fix` (`.fallowrc.json` may use broader ignores than [`knip.json`](knip.json); not in `ci:check`)

## Environment Model

- Copy each app's `env.template` to `.env.local` before running that app (see setup commands above). `bun run consistency:env-templates` (in `ci:check`) keeps every template aligned with startup validation in `lib/env.ts` and gateway config in `apps/web/next.config.ts`. `bun run consistency:local-env` audits local `.env.local` files against those tiers before you sync Vercel Production/Preview. `bun run sync:local-env` rewrites existing `.env.local` files from templates (comments/structure only; values preserved).
- App URL logic is derived from `NODE_ENV` via shared config (`packages/shared/src/config.ts`). Local zone ports are contiguous `3001`–`3005` (`DEV_PORTS`: web, store, pdf, image-editor, ocr).
- **Per-app tiers** (see each `apps/*/env.template`, app README, [`docs/turbo-env-tiers.md`](docs/turbo-env-tiers.md), and [`docs/env-vercel-audit-checklist.md`](docs/env-vercel-audit-checklist.md)):
  - **Store** (`store`): Upstash Redis for public package download rate limiting.
  - **Public tools** (`pdf`, `image-editor`, `ocr`): no required service env (browser-local processing).
  - **Gateway** (`web`): internal rewrite URLs (`STORE_URL`, `PDF_URL`, `IMAGE_EDITOR_URL`, `OCR_URL`) when `VERCEL=1`.
- **Optional** (commented in every `env.template`; not required for normal local dev): `SKIP_ENV_VALIDATION=1` (local build smoke tests only, off Vercel; `ci:release` uses real validation), and `HELVETY_SERVER_ACTION_ALLOWED_ORIGINS` (comma-separated Server Actions origin override; on Vercel, defaults come from deployment URLs plus `https://helvety.com`).
- `apps/web` requires `STORE_URL`, `PDF_URL`, `IMAGE_EDITOR_URL`, and `OCR_URL` when `VERCEL=1` so multi-zone rewrites can resolve trusted internal origins. Local dev falls back to localhost ports.
- Zone proxy profiles (`store-gateway`, `public-tool`, `public-marketing`) set CSP and security headers only.

## Security Posture (High Level)

- `proxy.ts` is lightweight request setup (CSP headers with per-request nonce and zone-aware `report-uri` / `report-to` endpoints), not a full application security boundary. Zoned apps report CSP violations to `/{basePath}/api/csp-report` (gateway uses `/api/csp-report`). Zone apps inline the same `config.matcher` pattern as `SECURITY_PROXY_MATCHER` in `@helvety/shared/proxy` (Next.js requires a static literal) so common static files skip that chain. The `apps/web` gateway uses a custom matcher with the same static extension exclusions plus zone path skips.
- All five Next.js zones share the site footer in root layouts (copyright + legal nav; contact in the About dialog; no third-party analytics). User-facing storage disclosure: Privacy §8 ([`docs/cookies-telemetry-and-footer.md`](docs/cookies-telemetry-and-footer.md)).

## Project Structure

```text
helvety/
├── apps/
├── packages/
├── turbo.json
└── package.json
```

Architecture entry points and flow references are documented in each app/package README and in the shared runtime/security docs under `packages/shared`.

## Service and Legal

Services are primarily intended for customers in Switzerland and are not
offered in the EU/EEA. Public tools and the Store catalog do not require a
helvety.com account. Helvety Cloud (helvety.cloud) uses email OTP accounts and
is covered by the same legal pages. Legal pages are hosted on
<https://helvety.com>:

- Privacy: <https://helvety.com/privacy>
- Terms: <https://helvety.com/terms> (includes eligibility, AUP, E2EE, billing)
- Impressum (including abuse reporting): <https://helvety.com/impressum#abuse>
- Cookies and shared footer (developer reference): [`docs/cookies-telemetry-and-footer.md`](docs/cookies-telemetry-and-footer.md)
- Internal legal update guardrails: [`docs/legal-change-guardrails.md`](docs/legal-change-guardrails.md)

## License

Licensed under the [GNU Affero General Public License v3.0 or later](./LICENSE).
