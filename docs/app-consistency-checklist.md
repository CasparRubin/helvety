# App consistency checklist

Use this when adding a new zone under `apps/*` or auditing an existing app for monorepo parity.

## Required files (every Next.js zone)

| File                 | Purpose                                                                                                                                                                                                                                                                            |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `proxy.ts`           | Zone security proxy (`createAppProxy` or profiled variant); **no** `middleware.ts`                                                                                                                                                                                                 |
| `proxy.test.ts`      | Matcher parity with `SECURITY_PROXY_MATCHER` (gateway: zone exclusions + static extensions)                                                                                                                                                                                        |
| `env.template`       | Documented env keys; validated by `bun run consistency:env-templates`; local `.env.local` tier parity via `bun run consistency:local-env` ([`env-vercel-audit-checklist.md`](./env-vercel-audit-checklist.md) for Vercel)                                                          |
| `eslint.config.mjs`  | `createEslintConfig(import.meta.dirname)` from `@helvety/config/eslint`                                                                                                                                                                                                            |
| `vitest.config.ts`   | `createVitestConfig(__dirname)` from `@helvety/config/vitest` (resolves testing-library from `@helvety/dev-deps`; stubs `.css` in unit tests); workspaces with real tests pass `{ passWithNoTests: false }`                                                                        |
| `vitest.setup.ts`    | `/// <reference types="@testing-library/jest-dom/vitest" />` + `import "@helvety/config/vitest.setup";` (jest-dom matchers + RTL `cleanup()` live in [`packages/config/vitest.setup.shared.ts`](../packages/config/vitest.setup.shared.ts))                                        |
| `tsconfig.json`      | Extends `@helvety/config/tsconfig.base.json` with `@/*` → `./*`                                                                                                                                                                                                                    |
| `postcss.config.mjs` | Re-exports `@helvety/config/postcss` (exact one-liner; enforced by `consistency:guardrails`)                                                                                                                                                                                       |
| `components.json`    | shadcn registry (add primitives via `packages/ui`, not app-local `ui/`); **`web` may add extra registries** (e.g. React Bits) for the marketing homepage                                                                                                                           |
| `app/layout.tsx`     | Product metadata via `createHelvetyProductMetadata`                                                                                                                                                                                                                                |
| `app/icon.svg`       | Zone favicon / PWA icon (required on every zone)                                                                                                                                                                                                                                   |
| `app/apple-icon.png` | Optional iOS home-screen PNG (recommended on public/indexable zones; `links`, `image-upscaler`, `image-editor`, and `ocr` ship one today)                                                                                                                                          |
| `vercel.json`        | Root Directory + headers; synced by `consistency:vercel-apps`                                                                                                                                                                                                                      |
| `app/robots.ts`      | Robots via `@helvety/shared/seo`: gateway `createOpenRobots("/sitemap-index.xml", GATEWAY_DISALLOWED_PATHS)` is the RFC 9309 source of truth; other zones use `createAppRobots` / `createPrivateAppRobots` host-absolute **mirrors** (compliant crawlers only fetch `/robots.txt`) |
| `app/sitemap.ts`     | **Public/indexable zones only** (`web`, `store`, `pdf`, `image-upscaler`, `image-editor`, `ocr`); private non-indexable zones omit this file (404 avoids invalid urlset XML in Search Console)                                                                                     |

## Required tests (minimum floor)

| Test                                 | Purpose                                                                                                                                                                          |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/seo-routes.test.ts`             | Robots + sitemap expectations for the zone (public: `expectPublicCrawlerRobots` + `assertValidPublicSitemapEntries`; private: `expectPrivateZoneRobots(robots(), "/zone")` only) |
| `app/layout-metadata.test.ts`        | Metadata + JSON-LD alignment; mock only what `layout.tsx` imports (see below)                                                                                                    |
| `app/layout-shell-providers.test.ts` | Root layout uses the correct shell (public vs E2EE)                                                                                                                              |
| `proxy.test.ts`                      | Static matcher matches shared baseline                                                                                                                                           |

Enforced by `bun run test:hygiene` (proxy test), `consistency:guardrails` (layout-shell + env JSDoc), and sibling app patterns.

### `layout-shell-providers.test.ts` families

| Family            | Apps                                           | Also assert                                                                                                                                                                                                                                               |
| ----------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E2EE              | `tasks`, `contacts`, `notes`, `links`          | `E2eeAppRootLayout`, `encryptionProvider={EncryptionProvider}`                                                                                                                                                                                            |
| Public tool       | `pdf`, `image-upscaler`, `image-editor`, `ocr` | `HelvetyPublicShellRootLayout`, `bootstrapPublicLayoutUser`                                                                                                                                                                                               |
| Gateway marketing | `web`                                          | `HelvetyPublicShellRootLayout`, `bootstrapPublicLayoutUser`                                                                                                                                                                                               |
| Auth gateway      | `auth`                                         | `bootstrapAuthLayoutSession`; CSRF wraps `EncryptionProvider`; nesting order; OTP verify returns rotated `csrfToken` for `useSetCSRFToken` before passkey; client syncs `?step=` via `syncLoginUrlStep` (no post-OTP server redirect when session exists) |
| Store gateway     | `store`                                        | CSRF wraps `{shell}`                                                                                                                                                                                                                                      |

Copy an existing test from the same family when adding a zone.

### `layout-metadata.test.ts` mocks

Mock the session helper your `app/layout.tsx` actually uses (metadata-only tests import `metadata`, not the default layout):

| Layout pattern                                         | Mock                                       |
| ------------------------------------------------------ | ------------------------------------------ |
| `bootstrapPublicLayoutUser()`                          | `@helvety/shared/layout-session-bootstrap` |
| `bootstrapE2eeLayoutSession()`                         | `@helvety/shared/layout-session-bootstrap` |
| `bootstrapAuthLayoutSession()` (auth layout only)      | `@helvety/shared/layout-session-bootstrap` |
| `E2eeAppRootLayout` only (no session in layout module) | `next/font/google` only                    |

Public-tool `seo-routes.test.ts` should use `expectPublicCrawlerRobots` and `assertValidPublicSitemapEntries` from `@helvety/shared/test-utils/seo-route-test-helpers` so `*` and `AI_DISCOVERY_USER_AGENTS` stay in sync and sitemap entries follow Google best practices.

Private non-indexable zones (`auth`, `contacts`, `notes`, `tasks`, `links`) use `expectPrivateZoneRobots(robots(), "/zone")` from `@helvety/shared/test-utils/seo-route-test-helpers` and **no** `app/sitemap.ts` route (private zone sitemap URLs 404). Gateway `/robots.txt` is the RFC 9309 source of truth (`GATEWAY_DISALLOWED_PATHS`). `auth` is not an E2EE vault app (see root README); it shares the private robots contract with E2EE vault apps. Do not migrate these zones to `expectPublicCrawlerRobots`.

## Cross-app test contract

Beyond the required floor above, match these templates when adding or auditing tests. Reference implementations live in sibling apps — copy structure, swap entity names only.

### Base UI shadcn (menus, sliders, link-styled buttons)

Use shared helpers from `@helvety/shared/test-utils/base-ui-test-helpers` so jsdom tests stay consistent after the Radix → Base UI migration:

| Helper                                            | Use when                                                                          |
| ------------------------------------------------- | --------------------------------------------------------------------------------- |
| `openMenuTrigger(element)`                        | Opening `DropdownMenu` / export menus (pointerdown + click)                       |
| `getRangeInputByLabel(screen, label)`             | Querying `@helvety/ui/slider` (hidden `input[type="range"]`, not `role="slider"`) |
| `getByRole("button")` + `toHaveAttribute("href")` | `Button render={<a\|Link>}` + `nativeButton={false}` (role stays `button`)        |

Wiring guardrails: `packages/ui/src/ui-base-ui-wiring.test.ts`, `packages/ui/src/ui-docs-copy-wiring.test.ts` (READMEs + `docs/*.md` must not describe the retired Radix/cmdk stack as current), `form-control-touch-wiring.test.ts`. Component examples: `entity-links-panel.test.tsx`, `product-filters.test.tsx`, `image-editor-command-bar.test.tsx`.

### API routes (`app/api/**/route.ts`)

Colocate **`route.test.ts` beside the list handler**. Import `[id]/route` from the same file when a detail route exists (see `apps/contacts/app/api/contacts/route.test.ts`).

| Case                                                | Required?                              | Reference                                             |
| --------------------------------------------------- | -------------------------------------- | ----------------------------------------------------- |
| List success + `cache-control: no-store, max-age=0` | Yes                                    | `apps/contacts/app/api/contacts/route.test.ts`        |
| Encrypted prefetch auth + `RATE_LIMITS.PREFETCH`    | Yes (E2EE vault list routes)           | Same parent `route.test.ts` files                     |
| Auth failure (no Supabase query)                    | Yes                                    | `apps/links/app/api/library/route.test.ts`            |
| Bearer + allowlisted origin (extension passkey)     | When present                           | `apps/auth/app/api/extension/passkey/*/route.test.ts` |
| Allowlisted origin (extension OTP)                  | When present                           | `apps/auth/app/api/extension/otp/*/route.test.ts`     |
| `[id]` invalid UUID + no-store header               | Yes                                    | Same parent file imports `./[id]/route`               |
| CSP wiring (`runtime`, domain, `POST`)              | Yes per app with `csp-report/route.ts` | `apps/web/app/api/csp-report/route.test.ts`           |

Data-route mock stack:

```typescript
vi.mock("@helvety/shared/action-helpers", () => ({
  authenticateAndRateLimit: mocks.authenticateAndRateLimit,
}));
vi.mock("@helvety/shared/logger", () => ({
  logger: { logUnexpectedError: mocks.logUnexpectedError },
}));
```

### Server actions (`app/actions/*-actions.ts`)

One colocated `*-actions.test.ts` per `*-actions.ts` file. Use mocks from `apps/contacts/app/actions/contact-actions.test.ts` and helpers from `@helvety/shared/test-utils/action-test-helpers` (`sampleEncryptedField()` for valid encrypted JSON fixtures). Cross-app link mutations in zone actions use `entity-link-action-primitives` (`createCanonicalLink`, `deleteCanonicalLink`); mock those primitives in tests (see `apps/tasks/app/actions/note-link-actions.test.ts`, `apps/tasks/app/actions/link-entity-link-actions.test.ts`, `apps/links/app/actions/note-link-actions.test.ts`). For Supabase list/export reads, assert explicit `.select(...)` column lists (`ENCRYPTED_PREFETCH_COLUMNS`, `CONTACT_LINK_PICKER_COLUMNS`, or `ENTITY_LINK_COLUMNS`) rather than `*`. Examples: `apps/tasks/app/actions/entity-actions.test.ts`, `apps/contacts/app/api/contacts/route.test.ts`, `apps/links/app/actions/batch-actions.test.ts`.

### Primary data hooks (E2EE)

1. `describe("get*ApiPath")` — pure basePath prefix tests.
2. `describe("use*")` + `renderHook` — for E2EE **list** hooks, mock `useEncryptedSortableItems` and `@/lib/crypto`; assert `navigationSource`, `perfMeasureName`, `loadFailureMessage`, `reorderEntities` (see `apps/contacts/hooks/use-contacts.test.ts`).
3. For E2EE **dashboard sheet editors**, use the Links pattern (list hook `update`/`remove`/`refresh` passed as props — see `packages/ui/src/e2ee-dashboard-wiring.test.ts`). Do not add per-entity `useItem` / `useContact` wrappers.
4. `describe("useDataExport")` — mock `useE2eeDataExport` with `{ handleExportData, isExporting }` and assert delegation to the zone `lib/data-export.ts` download function (see `apps/*/hooks/use-data-export.test.ts`). Optional `lib/data-export.test.ts` asserts `buildExportData` mapping via mocked `@helvety/shared/e2ee-json-export` (see `apps/contacts`, `apps/tasks`, `apps/notes`, and `apps/links`).

Links library state uses `use-link-library` (not the shared sortable/single-item hooks).

### Components

| Type                   | E2EE reference                                        | Cases                                                                          |
| ---------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------ |
| List                   | `apps/contacts/components/contact-list.test.tsx`      | Refresh visibility, grouped empty, global empty guard, search empty, flat list |
| Editor command bar     | `apps/tasks/components/item-command-bar.test.tsx`     | Back, Save, Refresh, Delete accessible names                                   |
| Cross-app links panels | `apps/notes/components/contact-links-panel.test.ts`   | `buildE2eeDeepLink` contract only                                              |
| Contact picker columns | `apps/tasks/app/actions/contact-link-actions.test.ts` | `CONTACT_LINK_PICKER_COLUMNS` on `getContacts`                                 |

Public canvas tools (PDF, image upscaler, image editor, OCR): pinned `CommandBar` labels, placement, and empty-state copy follow [`ui-action-button-contract.md`](./ui-action-button-contract.md) (Canvas tools section). Command bar RTL + `getByRole` tests: `apps/pdf/components/pdf/pdf-command-bar.test.tsx`, `apps/image-upscaler/components/image-upscaler-command-bar.test.tsx`, `apps/image-editor/components/image-editor-command-bar.test.tsx`, `apps/ocr/components/ocr-command-bar.test.tsx`.

### Scrollable sheets and detail panels

| Surface                                            | Implementation                                               | Wiring test                                                                                                                                                     |
| -------------------------------------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E2EE entity detail (Notes, Tasks, Contacts, Links) | `E2eeEntityDetailSheet` + zone editor `CommandBarPageLayout` | `packages/ui/src/e2ee-dashboard-wiring.test.ts` (Links pattern: `onUpdate` from list hook, no per-entity hooks in sheet editors), `sheet-scroll-wiring.test.ts` |
| App switcher, mobile nav menu                      | `SHEET_SCROLLABLE_SHELL_CLASS` + header + `ScrollArea`       | `sheet-scroll-wiring.test.ts`, RTL in `app-switcher.test.tsx` / `helvety-shell-navbar.test.tsx`                                                                 |

See [`docs/ui-shadcn-integration-policy.md`](./ui-shadcn-integration-policy.md) for the flex height chain (`min-h-0`, `flex-1`, `overflow-hidden`). Entity editors use `stacked` action panels inside the scroll region (no sticky sidebars in sheets).

### List row and toolbar actions

| Pattern                                 | Canonical                                                              | Guard                                                                                                                                 |
| --------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Row icon actions (web lists)            | `@helvety/ui/row-action-button` (`aria-label`; optional local wrapper) | [`ui-action-button-contract.md`](./ui-action-button-contract.md), `consistency:ui-actions`                                            |
| Row delete icon                         | `Trash2Icon` + `ICON_SIZE_CLASS`                                       | `consistency:ui-actions`, `ui-actions-wiring.test.ts`                                                                                 |
| Editor form fields (extension + shared) | `@helvety/ui/form-field`, `@helvety/ui/e2ee-form-layout`               | Extension `entity-form-view.test.ts`; links/contacts/tasks (`item-action-panel`, `folder-editor`) via `e2ee-dashboard-wiring.test.ts` |
| Public-tool sidebars                    | `@helvety/ui/public-tool-workspace`                                    | PDF toolkit, image-upscaler, image-editor layers panel, OCR workspace                                                                 |
| Toasts in apps                          | `import { toast } from "@helvety/ui/sonner"`                           | Knip (`deps:unused`), `consistency:ui-actions`                                                                                        |

Chromium extension: `IconTooltipButton` enables tooltips on `RowActionButton`; delete in edit mode is in the **header** (`DataTabsView`), not `EntityFormView` footer.

### Lib / copy / crypto

- Em-dash, licensing, manifests: enforced in `packages/shared` copy guardrails + `bun run consistency:customer-copy`. Do not duplicate in app tests.
- `lib/product-copy.test.ts`: `pdf` / `image-upscaler` / `image-editor` / `ocr` thin re-exports from `@helvety/shared/app-product-descriptions` (see `zone-product-copy-wiring.test.ts`).
- `lib/llms-copy.test.ts`: only where llms content has unique product behavior (`links`).
- Store catalog SSOT: `@helvety/shared/helvety-ecosystem-sections` (categories + app-switcher grouping) → `@helvety/shared/store-catalog` (card fields, `StoreProductType`; `category` derived) → `apps/store/lib/types/products.ts` (`Product.type` imports `StoreProductType`) → `apps/store/lib/data/products.ts` (full rows). Wiring: `helvety-ecosystem-sections.test.ts`, `store-catalog.test.ts`, `packages/ui/src/app-switcher-sections.test.ts`, `apps/store/components/products/product-ui-wiring.test.ts`.
- Crypto: field-bound AAD (`buildFieldAAD`) allowlist per zone in `lib/crypto/*encryption*.test.ts` (contacts: `contact-encryption.test.ts`); entity encryption modules use `encryptEntityField` / `decryptEntityField` only (`consistency:e2ee-aad`; no raw `await encrypt(` / `await decrypt(`). Ciphertext wire format is `ENCRYPTION_VERSION = 2` only. Shared E2EE SSOT: `@helvety/shared/e2ee-entity-columns`, `@helvety/shared/e2ee-write-guard`, `@helvety/shared/e2ee-entity-defaults`, `@helvety/shared/e2ee-entity-catalogs`, `@helvety/shared/e2ee-url-normalize`, `@helvety/shared/crypto/e2ee-entity-crypto`, `@helvety/shared/e2ee-domain-types`, `@helvety/shared/e2ee-record-to-input`, `@helvety/shared/validate-e2ee-draft`, `@helvety/shared/entity-list-grouping`, `@helvety/shared/link-tree-ops` (`consistency:e2ee-catalogs`; wiring tests in `packages/shared/src/e2ee-*-wiring.test.ts`, `entity-list-grouping.test.ts`, `link-tree-ops.test.ts`, `crypto/e2ee-entity-crypto.test.ts`).

## `package.json` conventions

- **Dependencies**: `@helvety/brand`, `@helvety/shared`, `@helvety/ui` as `workspace:*` (UI carries production `tailwindcss` / `@tailwindcss/postcss` for Turbopack CSS; `@helvety/config/postcss` loads the plugin from `@helvety/dev-deps`)
- **DevDependencies**: `@helvety/config`, `@helvety/dev-deps` as `workspace:*`
- **Scripts**: `dev`, `build`, `start`, `lint`, `lint:fix`, `type-check`, `format`, `format:check`, `test`, `test:watch`, `test:coverage`
- **Version**: align with sibling product apps (currently `3.8.0`) unless the zone is intentionally versioned separately
- **Do not** duplicate toolchain packages pinned in `@helvety/dev-deps` (`bun run deps:drift`, in `ci:check`)

## Proxy profile selection

Pick one profile from `@helvety/shared/proxy` (`SECURITY_PROXY_PROFILE_OPTIONS`):

| Profile            | Typical apps                                   |
| ------------------ | ---------------------------------------------- |
| `public-marketing` | `web` (custom matcher excluding other zones)   |
| `auth-gateway`     | `auth`                                         |
| `store-gateway`    | `store`                                        |
| `e2ee-app`         | `tasks`, `contacts`, `notes`, `links`          |
| `public-tool`      | `pdf`, `image-upscaler`, `image-editor`, `ocr` |

**PDF worker sync:** `apps/pdf` and `apps/ocr` run `bun run sync:pdf-worker` before dev/build to copy the worker from react-pdf's resolved `pdfjs-dist` into `public/` (must match the runtime API). Root `bun run consistency:pdfjs-worker` (in `ci:check`) **syncs then validates** alignment for both zones and rejects independent `pdfjs-dist` pins/overrides. See [`apps/pdf/README.md`](../apps/pdf/README.md) and [`apps/ocr/README.md`](../apps/ocr/README.md) › PDF.js stack.

Copy `SECURITY_PROXY_MATCHER` as a **static literal** into `export const config = { matcher: [...] }` (Next.js requirement). `scripts/check-consistency-guardrails.mjs` enforces parity with `packages/shared/src/proxy.ts`.

**CSP report endpoints:** Gateway uses `/api/csp-report`; zoned apps use `/{basePath}/api/csp-report` (wired in `@helvety/config/next-headers` `resolveCspReportEndpoint`, static headers via `createSecurityHeaders`, and per-request CSP in `createSecurityProxy`). Guardrails: `packages/config/next-headers.test.mjs`, `packages/shared/src/proxy.test.ts`.

**Fail-closed auth refresh:** All session-bearing profiles (`auth-gateway`, `e2ee-app`, `store-gateway`, `public-tool`) clear stale `sb-*` cookies when Supabase session refresh fails (`FAIL_CLOSED_AUTH_REFRESH_PROFILES` in `@helvety/shared/proxy` plus `failClosedOnAuthRefresh: true` on `createAppProxy` for root redirects). **`public-marketing`** (`web`) omits fail-closed. Wired by `packages/shared/src/proxy-fail-closed-wiring.test.ts`.

**Session cookie writes:** Proxy refresh sets `x-helvety-auth-refreshed` only when `setAll` wrote cookies. `@supabase/ssr` 0.12+ may also pass `Cache-Control` / `Pragma` / `Expires` via `setAll`; `refreshSupabaseAuthSession` applies them, and `createSecurityProxy` preserves them when rebuilding `NextResponse.next()` (`copySupabaseAuthRefreshResponseHeaders`). RSC and read-only server code use `createServerClient` (no-ops further cookie writes when that header is set; ignores the optional header map). Sign-in, sign-out, callbacks, OTP verify, passkey session mint, and `updateUser` use `createServerMutatingClient`. See `packages/shared/README.md`, `packages/shared/src/zone-supabase-session-mutation-wiring.test.ts`, `packages/shared/src/proxy-supabase-ssr-cache-docs-wiring.test.ts`, and `packages/shared/src/auth-callback.test.ts`.

## Root layout shell

| Shell                          | Apps                                                                   |
| ------------------------------ | ---------------------------------------------------------------------- |
| `HelvetyPublicShellRootLayout` | `web`, `auth`, `store`, `pdf`, `image-upscaler`, `image-editor`, `ocr` |
| `E2eeAppRootLayout`            | `tasks`, `contacts`, `notes`, `links`                                  |

**ScrollArea viewport selectors:** Public shells and `CommandBarPageLayout` target child viewports with `[data-slot=scroll-area-viewport]` (shadcn Base UI `data-slot`, not legacy `data-radix-scroll-area-viewport`). Guardrail: `packages/ui/src/helvety-layout-wiring.test.ts`, `command-bar-page-layout.test.tsx`.

Use JSX for root layouts: `<HelvetyPublicShellRootLayout>` or `<E2eeAppRootLayout>` (not `return HelvetyPublicShellRootLayout({...})`). E2EE zones use `export default async function RootLayout`. Enforced by `consistency:zone-modernization`.

## Root `app/loading.tsx` matrix

| Shell family                 | Apps                                           | Export                     |
| ---------------------------- | ---------------------------------------------- | -------------------------- |
| Gateway / scroll-area public | `web`, `auth`, `store`                         | `HelvetyShellRouteLoading` |
| Public tools                 | `pdf`, `image-upscaler`, `image-editor`, `ocr` | `LoadingSpinner`           |
| E2EE                         | `tasks`, `contacts`, `notes`, `links`          | `E2eeShellRouteLoading`    |

Nested routes (e.g. store products) use `LoadingSpinner`. Enforced by `consistency:zone-modernization`.

## E2EE `EncryptionProvider`

E2EE zones and vault-aware zones (`auth`) re-export the client provider from `@/lib/crypto` and pass `encryptionProvider={EncryptionProvider}` into their root layout (test mocking + app boundary). Do not import `EncryptionProvider` directly from `@helvety/shared/crypto/encryption-context` in `app/layout.tsx`.

## `lib/env.ts` factory

| Tier                          | Factory                                                        | Apps                                                                      |
| ----------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Admin + rate limit            | `createAppServerUpstashEnv` + `serverUpstashMergedSchema`      | `store`                                                                   |
| Admin + rate limit (extended) | `createAppServerUpstashEnv` + custom schema                    | `auth` (`DEVICE_TRUST_COOKIE_SECRET`, `HELVETY_CHROME_EXTENSION_ORIGINS`) |
| User-scoped E2EE              | `createAppUserScopedE2eeEnv` + `userScopedE2eeServerEnvSchema` | E2EE apps (`DEVICE_TRUST_COOKIE_SECRET` for weekly device-trust gate)     |
| Public tool + rate limit      | `createAppUpstashCookieEnv` + `upstashCookieSigningEnvSchema`  | `pdf`, `image-upscaler`, `image-editor`, `ocr`                            |
| Gateway                       | `getValidatedGatewayEnv` (re-exported as `getValidatedWebEnv`) | `web`                                                                     |

Wired by `packages/shared/src/zone-env-factory-wiring.test.ts` and `consistency:guardrails`.

## Next.js config presets

| Preset                         | Apps                                            |
| ------------------------------ | ----------------------------------------------- |
| `createE2eeZoneNextConfig`     | `tasks`, `contacts`, `notes`, `links`           |
| `createPublicToolNextConfig`   | `pdf`, `image-upscaler`, `image-editor`, `ocr`  |
| `createAuthGatewayNextConfig`  | `auth`                                          |
| `createHelvetyNextConfig` only | `web`, `store` (bespoke `overrides` / rewrites) |

Wired by `packages/shared/src/zone-next-config-wiring.test.ts` and `consistency:zone-modernization` (`optimizePackageImports` must match declared dependencies).

## Navbar factories

Zone `components/navbar.tsx` files are thin wrappers around `@helvety/ui/create-app-navbar`:

- E2EE: `createE2eeAppNavbar`
- Public tools: `createPublicShellNavbar` + `publicToolNavbarBrand`

Wired by `packages/shared/src/app-navbar-wiring.test.ts` and `packages/ui/src/e2ee-dashboard-wiring.test.ts`.

## Centralized zone wiring tests

In addition to per-zone `app/layout-shell-providers.test.ts` and `test:hygiene` floors, `@helvety/shared` ships Vitest guards for all eleven zones: `zone-loading-wiring`, `zone-layout-wiring`, `zone-env-factory-wiring`, `zone-next-config-wiring`, `zone-entity-delete-wiring`, `zone-product-copy-wiring`, plus cross-cutting `encrypted-data-wiring` (E2EE mutation actions import `EncryptedDataSchema`), `e2ee-catalog-wiring`, `e2ee-crypto-wiring`, `e2ee-extension-wiring` (when the extension sibling repo is present), `entity-list-grouping`, `link-tree-ops`, `validate-e2ee-draft`, `e2ee-record-to-input`, `crypto/e2ee-entity-crypto`, `csrf-wiring`, `supabase-rls-export` (pairs with `bun run consistency:supabase-rls`), `auth-server-action-guards.test.ts` (unit tests for `verifyAuthActionGuards`), and `workspace-script-parity.test.ts`. Exec smoke tests for auth-action and workspace-script guardrail scripts live in `deps-guardrail-scripts.test.ts`. Prefer extending those when auditing monorepo-wide patterns instead of duplicating per-app `loading.test.ts` files.

## Multi-zone static assets (`assetPrefix`)

- **Use** `assetPrefix` + gateway `*-static` rewrites for heavy client bundles: `auth`, `tasks`, `contacts`, `notes`, `links`.
- **Omit** for lighter zones until production shows static asset conflicts: `store`, `pdf`, `image-upscaler`, `image-editor`, `ocr`.

See [`quality-modernization-baseline.md`](./quality-modernization-baseline.md).

## Environment tiers and Turbo

Turbo lists a **superset** of env vars on `build` in [`turbo.json`](../turbo.json) so cached builds invalidate when any zone secret changes. See [`turbo-env-tiers.md`](./turbo-env-tiers.md) and [`env-vercel-audit-checklist.md`](./env-vercel-audit-checklist.md). **Required keys at runtime** still follow each app's `env.template` (`bun run consistency:env-templates`; local `.env.local`: `bun run consistency:local-env`):

| Tier                         | Apps                                           | Required secrets (typical)                                                                                 |
| ---------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Admin + rate limit**       | `auth`, `store`                                | Supabase public + `SUPABASE_SECRET_KEY`, Upstash, `HELVETY_COOKIE_SIGNING_SECRET`                          |
| **User-scoped + rate limit** | E2EE apps                                      | Supabase public + Upstash, `HELVETY_COOKIE_SIGNING_SECRET`, `DEVICE_TRUST_COOKIE_SECRET` (no admin client) |
| **Public tool + rate limit** | `pdf`, `image-upscaler`, `image-editor`, `ocr` | Supabase public + Upstash, `HELVETY_COOKIE_SIGNING_SECRET`                                                 |
| **Auth extra**               | `auth`                                         | `DEVICE_TRUST_COOKIE_SECRET` (mint), `HELVETY_CHROME_EXTENSION_ORIGINS`                                    |
| **Gateway**                  | `web`                                          | Public Supabase + zone rewrite URLs when `VERCEL=1`                                                        |

See root [`README.md`](../README.md) § Environment Model.

## `lib/env.ts` JSDoc

| Tier                     | Apps                                           | JSDoc must mention `ci:release` / `SKIP_ENV_VALIDATION` |
| ------------------------ | ---------------------------------------------- | ------------------------------------------------------- |
| Admin + rate limit       | `auth`, `store`                                | Yes (`createAppServerUpstashEnv`)                       |
| User-scoped E2EE         | E2EE apps                                      | Yes (`createAppUserScopedE2eeEnv`)                      |
| Public tool + rate limit | `pdf`, `image-upscaler`, `image-editor`, `ocr` | Yes (`createAppUpstashCookieEnv`)                       |
| Gateway                  | `web`                                          | Yes (`getValidatedWebEnv`)                              |

## E2EE UX patterns

| Pattern               | Canonical                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Apps                                                               |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| Navbar login return   | `E2eeAppNavbar` with `loginReturnUrl="current"` (default)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | `tasks`, `notes`, `contacts`, `links`                              |
| Hook errors           | `reportE2eeHookError` / `reportE2eeActionFailure` in list hooks (`useEncryptedSortableItems`); Links via `use-link-library`; shared `useEncryptedSingleItem` remains in `@helvety/ui` for future single-entity screens                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | E2EE vault apps (tasks, notes, contacts, links)                    |
| Missing master key    | `guardE2eeMasterKey` in `@helvety/ui/auth-navigation` (hard logout when `isUnlocked` without key); list hooks via `useEncryptedSortableItems`; optional detail fetch via `useEncryptedSingleItem`; cross-link hooks via `createE2eeEntityLinksHook`; Links library via `use-link-library`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | E2EE apps                                                          |
| Sheet editor wiring   | **Links pattern:** dashboard passes list-hook `update` / `remove` / `refresh` into the zone editor; resolve the active entity via `useE2eeDashboardSelectedEntity` (tasks/notes/contacts) or `library.links` / `library.folders` (links); remount editor with `key={entityId}`. Rich-text: `E2eeRichTextItemEditorShell` + `initialDescription` (not live TipTap `content`). Links: `library.updateLink`. **Form fields:** contacts/links editors and tasks `item-action-panel` date pickers use `@helvety/ui/form-field` with stable `id`s; `DatePicker` / `DateTimePicker` forward `id` for label association                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | `tasks`, `notes`, `contacts`, `links`                              |
| Save-first create     | **New** opens `formMode: "create"` (no id, no URL, no list row). First save calls `create()` / `library.createLink` / `library.createFolder` with a client UUID at encrypt time (E2EE v2 field-bound AAD). Web zones use `openCreate()` + `useE2eeEntityPanelWithUrl`; after save, `openEntity(id)` writes `?param=`. Cross-link panels only in edit mode. Owned updates use `ownedUpdateMissingRow` after `.select("id").maybeSingle()`. Links uses local panel state + `useLinksPanelUrlSync` instead of `useE2eeEntityPanelWithUrl`. Empty defaults from `@helvety/shared/e2ee-create-inputs` (aligned with the Chromium extension). Form defaults use `null` for unset structural fields (e.g. task `label_id`); DB sentinels such as `DEFAULT_TASK_LABEL_ID` are coalesced server-side or at extension encrypt time only. List hooks merge structural fields on create/update via `pickDefinedStructuralFields`. Create placeholder metadata that surfaces Created/Modified must use ISO timestamps (not `""`) before `formatDateTime`; `@helvety/shared/dates` returns `"—"` for invalid input. Contacts save validation uses `@helvety/shared/validate-e2ee-draft` (same helper as the Chromium extension). | `tasks`, `notes`, `contacts`, `links`                              |
| Vault session TTL     | `auth-session-policy.ts` + `vault-session.ts` (24h sliding idle, 7d max); enforced in `encryption-context`, Chromium extension side panel, and IndexedDB                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | All zones using `EncryptionProvider` + Chromium extension          |
| Cross-app link panels | `EntityLinksPanel` in `@helvety/ui` (Popover + Input Add picker; not cmdk) + `createE2eeEntityLinksHook` per-app hooks; shared section titles/icons via `@helvety/ui/e2ee-app-link-ui`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | `tasks`, `notes`, `contacts`, `links` (four-way cross-link panels) |

## Validation before merge

```bash
bun run ci:check    # full gate; see root README Automation for step order
bun run ci:release  # clean:artifacts + ci:check + build (before push / Vercel)
```

Run these locally before merge; Vercel validates builds on deploy.

Optional local E2E: `bun run ci:check:e2e` (installs Chromium if needed, starts all zone dev servers when `HELVETY_SMOKE_BASE_URL` is unset, and uses non-production placeholder credentials when local service env is absent) or `HELVETY_SMOKE_BASE_URL=http://localhost:3001 bun run test:e2e`. New E2EE zones: `bun run scaffold:e2ee-zone <slug>` prints the copy-from-contacts checklist.

## See also

- [`naming-conventions.md`](./naming-conventions.md)
- [`quality-modernization-baseline.md`](./quality-modernization-baseline.md)
- [`vercel-monorepo-apps.md`](./vercel-monorepo-apps.md)
- [`ui-shadcn-integration-policy.md`](./ui-shadcn-integration-policy.md)
- [`ui-action-button-contract.md`](./ui-action-button-contract.md) — action placement, icons, responsive labels
