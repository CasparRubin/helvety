# App consistency checklist

Use this when adding a new zone under `apps/*` or auditing an existing app for monorepo parity.

**Next.js zones:** `web`, `store`, `pdf`, `image-editor`, `ocr`.

## Required files (every Next.js zone)

| File                 | Purpose                                                                                                                                                                                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `proxy.ts`           | Zone security proxy (`createAppProxy` or profiled variant); **no** `middleware.ts`                                                                                                                                                                      |
| `proxy.test.ts`      | Matcher parity with `SECURITY_PROXY_MATCHER` (gateway: zone exclusions + static extensions)                                                                                                                                                             |
| `env.template`       | Documented env keys; validated by `bun run consistency:env-templates`; local `.env.local` tier parity via `bun run consistency:local-env` ([`env-vercel-audit-checklist.md`](./env-vercel-audit-checklist.md) for Vercel)                               |
| `eslint.config.mjs`  | `createEslintConfig(import.meta.dirname)` from `@helvety/config/eslint`                                                                                                                                                                                 |
| `vitest.config.ts`   | `createVitestConfig(__dirname)` from `@helvety/config/vitest` (resolves testing-library from `@helvety/dev-deps`; stubs `.css` in unit tests); workspaces with real tests pass `{ passWithNoTests: false }`                                             |
| `vitest.setup.ts`    | `/// <reference types="@testing-library/jest-dom/vitest" />` + `import "@helvety/config/vitest.setup";` (jest-dom matchers + RTL `cleanup()` live in [`packages/config/vitest.setup.shared.ts`](../packages/config/vitest.setup.shared.ts))             |
| `tsconfig.json`      | Extends `@helvety/config/tsconfig.base.json` with `@/*` → `./*`                                                                                                                                                                                         |
| `postcss.config.mjs` | Re-exports `@helvety/config/postcss` (exact one-liner; enforced by `consistency:guardrails`)                                                                                                                                                            |
| `components.json`    | shadcn registry (add primitives via `packages/ui`, not app-local `ui/`); **`web` may add extra registries** (e.g. React Bits) for the marketing homepage                                                                                                |
| `app/layout.tsx`     | Product metadata via `createHelvetyProductMetadata`                                                                                                                                                                                                     |
| `app/icon.svg`       | Zone favicon / PWA icon (required on every zone)                                                                                                                                                                                                        |
| `app/apple-icon.png` | Optional iOS home-screen PNG (recommended on public/indexable zones; `image-editor` and `ocr` ship one today)                                                                                                                                           |
| `vercel.json`        | Root Directory + headers; synced by `consistency:vercel-apps`                                                                                                                                                                                           |
| `app/robots.ts`      | Robots via `@helvety/shared/seo`: gateway `createOpenRobots("/sitemap-index.xml", GATEWAY_DISALLOWED_PATHS)` is the RFC 9309 source of truth; other zones use `createAppRobots` host-absolute **mirrors** (compliant crawlers only fetch `/robots.txt`) |
| `app/sitemap.ts`     | **Public/indexable zones** (`web`, `store`, `pdf`, `image-editor`, `ocr`)                                                                                                                                                                               |

## Required tests (minimum floor)

| Test                                 | Purpose                                                                                         |
| ------------------------------------ | ----------------------------------------------------------------------------------------------- |
| `app/seo-routes.test.ts`             | Robots + sitemap expectations (`expectPublicCrawlerRobots` + `assertValidPublicSitemapEntries`) |
| `app/layout-metadata.test.ts`        | Metadata + JSON-LD alignment; mock only what `layout.tsx` imports                               |
| `app/layout-shell-providers.test.ts` | Root layout uses `HelvetyPublicShellRootLayout`                                                 |
| `proxy.test.ts`                      | Static matcher matches shared baseline                                                          |

Enforced by `bun run test:hygiene` (proxy test), `consistency:guardrails` (layout-shell + env JSDoc), and sibling app patterns.

### `layout-shell-providers.test.ts` families

| Family            | Apps                         | Also assert                    |
| ----------------- | ---------------------------- | ------------------------------ |
| Public tool       | `pdf`, `image-editor`, `ocr` | `HelvetyPublicShellRootLayout` |
| Gateway marketing | `web`                        | `HelvetyPublicShellRootLayout` |
| Store gateway     | `store`                      | `HelvetyPublicShellRootLayout` |

Copy an existing test from the same family when adding a zone.

Public-zone `seo-routes.test.ts` should use `expectPublicCrawlerRobots` and `assertValidPublicSitemapEntries` from `@helvety/shared/test-utils/seo-route-test-helpers` so `*` and `AI_DISCOVERY_USER_AGENTS` stay in sync and sitemap entries follow Google best practices.

## Cross-app test contract

### Base UI shadcn (menus, sliders, link-styled buttons)

Use shared helpers from `@helvety/shared/test-utils/base-ui-test-helpers`:

| Helper                                            | Use when                                                                          |
| ------------------------------------------------- | --------------------------------------------------------------------------------- |
| `openMenuTrigger(element)`                        | Opening `DropdownMenu` / export menus (pointerdown + click)                       |
| `getRangeInputByLabel(screen, label)`             | Querying `@helvety/ui/slider` (hidden `input[type="range"]`, not `role="slider"`) |
| `getByRole("button")` + `toHaveAttribute("href")` | `Button render={<a\|Link>}` + `nativeButton={false}` (role stays `button`)        |

Wiring guardrails: `packages/ui/src/ui-base-ui-wiring.test.ts`, `packages/ui/src/ui-docs-copy-wiring.test.ts`, `form-control-touch-wiring.test.ts`. Component examples: `product-filters.test.tsx`, `image-editor-command-bar.test.tsx`.

### API routes (`app/api/**/route.ts`)

Colocate **`route.test.ts` beside the handler**. Typical cases for remaining zones:

| Case                                              | Required?                              | Reference                                       |
| ------------------------------------------------- | -------------------------------------- | ----------------------------------------------- |
| List/download success + appropriate cache headers | When present                           | `apps/store/app/api/packages/.../route.test.ts` |
| CSP wiring (`runtime`, domain, `POST`)            | Yes per app with `csp-report/route.ts` | `apps/web/app/api/csp-report/route.test.ts`     |

### Components

Public canvas tools (PDF, image editor, OCR): pinned `CommandBar` labels, placement, and empty-state copy follow [`ui-action-button-contract.md`](./ui-action-button-contract.md) (Canvas tools section). Command bar RTL + `getByRole` tests: `apps/pdf/components/pdf/pdf-command-bar.test.tsx`, `apps/image-editor/components/image-editor-command-bar.test.tsx`, `apps/ocr/components/ocr-command-bar.test.tsx`.

### Scrollable sheets and detail panels

| Surface                       | Implementation                                         | Wiring test                                                               |
| ----------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------- |
| App switcher, mobile nav menu | `SHEET_SCROLLABLE_SHELL_CLASS` + header + `ScrollArea` | `sheet-scroll-wiring.test.ts`, RTL in `app-switcher` / shell navbar tests |

See [`docs/ui-shadcn-integration-policy.md`](./ui-shadcn-integration-policy.md) for the flex height chain (`min-h-0`, `flex-1`, `overflow-hidden`).

### List row and toolbar actions

| Pattern              | Canonical                                    | Guard                                                                          |
| -------------------- | -------------------------------------------- | ------------------------------------------------------------------------------ |
| Public-tool sidebars | `@helvety/ui/public-tool-workspace`          | PDF toolkit, image-editor layers panel, OCR workspace; `consistency:ui-actions` |
| Toasts in apps       | `import { toast } from "@helvety/ui/sonner"` | Knip (`deps:unused`), `consistency:ui-actions`                                 |
| Toolbar / delete     | [`ui-action-button-contract.md`](./ui-action-button-contract.md) | Lucide icons; `Trash2Icon` for delete                                 |

### Lib / copy

- Em-dash, licensing, manifests: enforced in `packages/shared` copy guardrails + `bun run consistency:customer-copy`.
- `lib/product-copy.test.ts`: `pdf` / `image-editor` / `ocr` thin re-exports from `@helvety/shared/app-product-descriptions` (see `zone-product-copy-wiring.test.ts`).
- Store catalog SSOT: `@helvety/shared/helvety-ecosystem-sections` → `@helvety/shared/store-catalog` → `apps/store/lib/types/products.ts` → `apps/store/lib/data/products.ts`. Wiring: `helvety-ecosystem-sections.test.ts`, `store-catalog.test.ts`, `packages/ui/src/app-switcher-sections.test.ts`, `apps/store/components/products/product-ui-wiring.test.ts`.

## `package.json` conventions

- **Dependencies**: `@helvety/brand`, `@helvety/shared`, `@helvety/ui` as `workspace:*` (UI carries production `tailwindcss` / `@tailwindcss/postcss` for Turbopack CSS; `@helvety/config/postcss` loads the plugin from `@helvety/dev-deps`)
- **DevDependencies**: `@helvety/config`, `@helvety/dev-deps` as `workspace:*`
- **Scripts**: `dev`, `build`, `start`, `lint`, `lint:fix`, `type-check`, `format`, `format:check`, `test`, `test:watch`, `test:coverage`
- **Version**: align with sibling product apps unless the zone is intentionally versioned separately
- **Do not** duplicate toolchain packages pinned in `@helvety/dev-deps` (`bun run deps:drift`, in `ci:check`)

## Proxy profile selection

Pick one profile from `@helvety/shared/proxy` (`SECURITY_PROXY_PROFILE_OPTIONS`):

| Profile            | Typical apps                                 |
| ------------------ | -------------------------------------------- |
| `public-marketing` | `web` (custom matcher excluding other zones) |
| `store-gateway`    | `store`                                      |
| `public-tool`      | `pdf`, `image-editor`, `ocr`                 |

**PDF worker sync:** `apps/pdf` and `apps/ocr` run `bun run sync:pdf-worker` before dev/build. Root `bun run consistency:pdfjs-worker` (in `ci:check`) syncs then validates both zones. See [`apps/pdf/README.md`](../apps/pdf/README.md) and [`apps/ocr/README.md`](../apps/ocr/README.md).

Copy `SECURITY_PROXY_MATCHER` as a **static literal** into `export const config = { matcher: [...] }` (Next.js requirement). `scripts/check-consistency-guardrails.mjs` enforces parity with `packages/shared/src/proxy.ts`.

**CSP report endpoints:** Gateway uses `/api/csp-report`; zoned apps use `/{basePath}/api/csp-report` (wired in `@helvety/config/next-headers`). Guardrails: `packages/config/next-headers.test.mjs`, `packages/shared/src/proxy.test.ts`.

## Root layout shell

| Shell                          | Apps                                         |
| ------------------------------ | -------------------------------------------- |
| `HelvetyPublicShellRootLayout` | `web`, `store`, `pdf`, `image-editor`, `ocr` |

**ScrollArea viewport selectors:** Public shells target child viewports with `[data-slot=scroll-area-viewport]` (shadcn Base UI `data-slot`). Guardrail: `packages/ui/src/helvety-layout-wiring.test.ts`.

Use JSX for root layouts: `<HelvetyPublicShellRootLayout>` (not `return HelvetyPublicShellRootLayout({...})`). Enforced by `consistency:zone-modernization`.

## Root `app/loading.tsx` matrix

| Shell family                 | Apps                         | Export                     |
| ---------------------------- | ---------------------------- | -------------------------- |
| Gateway / scroll-area public | `web`, `store`               | `HelvetyShellRouteLoading` |
| Public tools                 | `pdf`, `image-editor`, `ocr` | `LoadingSpinner`           |

Nested routes (e.g. store products) use `LoadingSpinner`. Enforced by `consistency:zone-modernization`.

## `lib/env.ts` factory

| Tier               | Factory                                                        | Apps                         |
| ------------------ | -------------------------------------------------------------- | ---------------------------- |
| Store + rate limit | `createAppUpstashEnv` + `upstashEnvSchema`                     | `store`                      |
| Gateway            | `getValidatedGatewayEnv` (re-exported as `getValidatedWebEnv`) | `web`                        |
| Public tools       | No `lib/env.ts` (empty `env.template`)                         | `pdf`, `image-editor`, `ocr` |

Wired by `packages/shared/src/zone-env-factory-wiring.test.ts` and `consistency:guardrails`.

## Next.js config presets

| Preset                         | Apps                                            |
| ------------------------------ | ----------------------------------------------- |
| `createPublicToolNextConfig`   | `pdf`, `image-editor`, `ocr`                    |
| `createHelvetyNextConfig` only | `web`, `store` (bespoke `overrides` / rewrites) |

Wired by `packages/shared/src/zone-next-config-wiring.test.ts` and `consistency:zone-modernization`.

## Navbar factories

Zone `components/navbar.tsx` files are thin wrappers around `@helvety/ui/create-app-navbar` (`createPublicShellNavbar` + `publicToolNavbarBrand` for public tools).

## Multi-zone static assets (`assetPrefix`)

Omit `assetPrefix` for current zones (`store`, `pdf`, `image-editor`, `ocr`) until production shows static asset conflicts. See [`quality-modernization-baseline.md`](./quality-modernization-baseline.md).

## Environment tiers and Turbo

Turbo lists a **superset** of env vars on `build` in [`turbo.json`](../turbo.json). See [`turbo-env-tiers.md`](./turbo-env-tiers.md) and [`env-vercel-audit-checklist.md`](./env-vercel-audit-checklist.md). **Required keys at runtime** still follow each app's `env.template`:

| Tier                   | Apps                         | Required secrets (typical)        |
| ---------------------- | ---------------------------- | --------------------------------- |
| **Store + rate limit** | `store`                      | Upstash (`UPSTASH_REDIS_REST_*`)  |
| **Public tools**       | `pdf`, `image-editor`, `ocr` | None                              |
| **Gateway**            | `web`                        | Zone rewrite URLs when `VERCEL=1` |

See root [`README.md`](../README.md) § Environment Model.

## `lib/env.ts` JSDoc

| Tier               | Apps    | JSDoc must mention `ci:release` / `SKIP_ENV_VALIDATION` |
| ------------------ | ------- | ------------------------------------------------------- |
| Store + rate limit | `store` | Yes (`createAppUpstashEnv`)                             |
| Gateway            | `web`   | Yes (`getValidatedWebEnv`)                              |

## Validation before merge

```bash
bun run ci:check    # full gate; see root README Automation for step order
bun run ci:release  # clean:artifacts + ci:check + build (before push / Vercel)
```

## See also

- [`naming-conventions.md`](./naming-conventions.md)
- [`quality-modernization-baseline.md`](./quality-modernization-baseline.md)
- [`vercel-monorepo-apps.md`](./vercel-monorepo-apps.md)
- [`ui-shadcn-integration-policy.md`](./ui-shadcn-integration-policy.md)
- [`ui-action-button-contract.md`](./ui-action-button-contract.md)
