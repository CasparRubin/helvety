# Quality Modernization Baseline

Living contracts and guardrails for the Helvety monorepo. Completed modernization decisions are summarized below; ongoing expectations are in Verification and guardrails.

## Shared Contracts To Preserve

- `@helvety/dev-deps`
  - canonical semver ranges for `eslint`, `typescript`, `vitest`, `prettier`, testing-library, `tailwindcss`, `@tailwindcss/postcss`, and related toolchain packages, pinned in this package’s own **`dependencies`** (so Bun hoists bins/types to workspaces)
  - consumed via `"@helvety/dev-deps": "workspace:*"` in app/package **devDependencies** (enforced by `bun run deps:drift` in `ci:check`); zone apps do not declare Tailwind packages directly
- `@helvety/config`
  - `createHelvetyNextConfig` (base); zone preset `createPublicToolNextConfig` (`web` / `store` keep bespoke `createHelvetyNextConfig` overrides)
  - `createSecurityHeaders`
  - shared ESLint/TypeScript/Vitest/PostCSS **config** entrypoints (not pinned toolchain versions; those live in `@helvety/dev-deps`)
- `@helvety/shared`
  - `createAppProxy`, `createProfiledSecurityProxy`, and `SECURITY_PROXY_MATCHER` (canonical `proxy.ts` zone matcher pattern; apps inline the literal per Next.js)
  - server env validation; tiered env factories (`createAppUpstashEnv`, `getValidatedGatewayEnv`); per-app `env.template` parity (`consistency:env-templates`); local/Vercel env ops
  - `app-product-descriptions` for shared SEO/PWA strings (pdf, image-editor, and ocr re-export via thin `lib/product-copy.ts`)
  - Store / ecosystem catalogs: `helvety-ecosystem-sections`, `store-catalog`
- `@helvety/ui`
  - public shell (`HelvetyPublicShellRootLayout`), shared navigation (`HelvetyShellNavbar`, `AppSwitcher`), command bars, public-tool workspace helpers
  - production `tailwindcss` and `@tailwindcss/postcss` on the zone production dependency graph for Turbopack CSS processing

## Multi-zone static assets (`assetPrefix`)

- **Omit `assetPrefix`** for current zones (store, pdf, image-editor, ocr) that rely on default `/_next/static` under their `basePath`. Add `assetPrefix` only after measuring broken static assets or cache issues in production, not preemptively.

## Completed modernization (2026-05)

- Foundation guardrails, Next.js App Router patterns, shared public shells
- **Cross-zone navigation:** shell ecosystem navigation (`AppSwitcher`) uses absolute `urls.*` hrefs so `basePath` does not prefix another app’s path
- **Proxy matchers:** basePath-mounted apps inline `SECURITY_PROXY_MATCHER` so static `public/` assets (`.mjs` / `.wasm` / `.json` for PDF.js and OCR) skip the security proxy chain
- **Vercel Root Directory:** each zone project uses `apps/<slug>` (see [`vercel-monorepo-apps.md`](./vercel-monorepo-apps.md))
- Store ecosystem categories and catalog caching; public-tool product copy; Playwright gateway smoke
- UI stack: **@base-ui/react** (`base-vega`), lucide-react v1, shadcn CLI v4
- Toolchain: TypeScript 6 and ESLint 10 across workspaces (`deps:drift` in `ci:check`)

## Verification and guardrails (ongoing)

- Lint, type-check, and tests must stay green; run `bun run ci:check` during development and `bun run ci:release` before push.
- `consistency:env-templates`, `consistency:workspace-scripts`, `consistency:zone-modernization`, and shadcn `rsc`/`tsx` enforced in `consistency:guardrails`; add primitives via `packages/ui/components.json`.
- `deps:drift`, `deps:security:floors`, and `consistency:filenames` run inside `ci:check`; every zone with `proxy.ts` must ship `proxy.test.ts` (`test:hygiene`). New zones: [`app-consistency-checklist.md`](./app-consistency-checklist.md).
- Upstash rate-limit metrics/dashboard enabled in production for Store downloads (not site visitor analytics).

**Stack note:** Helvety public tools and Store use **Next.js** on Vercel.
