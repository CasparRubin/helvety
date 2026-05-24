# App consistency checklist

Use this when adding a new zone under `apps/*` or auditing an existing app for monorepo parity.

## Required files (every Next.js zone)

| File                 | Purpose                                                                                                                                                  |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `proxy.ts`           | Zone security proxy (`createAppProxy` or profiled variant); **no** `middleware.ts`                                                                       |
| `proxy.test.ts`      | Matcher parity with `SECURITY_PROXY_MATCHER` (gateway: zone exclusions + static extensions)                                                              |
| `env.template`       | Documented env keys; validated by `bun run consistency:env-templates`                                                                                    |
| `eslint.config.mjs`  | `createEslintConfig(import.meta.dirname)` from `@helvety/config/eslint`                                                                                  |
| `vitest.config.ts`   | `createVitestConfig(__dirname)` from `@helvety/config/vitest`; workspaces with real tests pass `{ passWithNoTests: false }`                              |
| `vitest.setup.ts`    | `@testing-library/jest-dom` + RTL `cleanup()`                                                                                                            |
| `tsconfig.json`      | Extends `@helvety/config/tsconfig.base.json` with `@/*` → `./*`                                                                                          |
| `postcss.config.mjs` | Re-exports `@helvety/config/postcss` (exact one-liner; enforced by `consistency:guardrails`)                                                             |
| `components.json`    | shadcn registry (add primitives via `packages/ui`, not app-local `ui/`); **`web` may add extra registries** (e.g. React Bits) for the marketing homepage |
| `app/layout.tsx`     | Product metadata via `createHelvetyProductMetadata`                                                                                                      |
| `app/apple-icon.png` | PWA / home-screen icon                                                                                                                                   |
| `vercel.json`        | Root Directory + headers; synced by `consistency:vercel-apps`                                                                                            |

## Required tests (minimum floor)

| Test                                 | Purpose                                                                             |
| ------------------------------------ | ----------------------------------------------------------------------------------- |
| `app/seo-routes.test.ts`             | Sitemap/robots/llms expectations for the zone                                       |
| `app/layout-metadata.test.ts`        | Metadata + JSON-LD alignment; mock only what `layout.tsx` imports (see below)       |
| `app/layout-shell-providers.test.ts` | Root layout uses the correct shell (public vs E2EE) without gateway WebGL in layout |
| `proxy.test.ts`                      | Static matcher matches shared baseline                                              |

Enforced by `bun run test:hygiene` (proxy test), `consistency:guardrails` (layout-shell + env JSDoc), and sibling app patterns.

### `layout-shell-providers.test.ts` families

Every zone asserts layouts omit `@helvety/light-pillar` and `HelvetyShellWithLightPillarBackdrop` (gateway WebGL stays on `web` route components only).

| Family                | Apps                                  | Also assert                                                                  |
| --------------------- | ------------------------------------- | ---------------------------------------------------------------------------- |
| E2EE                  | `tasks`, `contacts`, `notes`, `links` | `E2eeAppRootLayout`, `encryptionProvider={EncryptionProvider}`               |
| Public tool           | `pdf`, `image-upscaler`               | `HelvetyPublicShellRootLayout`, `bootstrapPublicLayoutUser`                  |
| Gateway marketing     | `web`                                 | `HelvetyPublicShellRootLayout`, `bootstrapPublicLayoutUser`                  |
| Auth gateway          | `auth`                                | `bootstrapAuthLayoutSession`; CSRF wraps `EncryptionProvider`; nesting order |
| Store gateway         | `store`                               | CSRF wraps `{shell}`                                                         |
| Docs (public + vault) | `docs`                                | CSRF + `EncryptionProvider`; nesting order                                   |

Copy an existing test from the same family when adding a zone.

### `layout-metadata.test.ts` mocks

Mock the session helper your `app/layout.tsx` actually uses (metadata-only tests import `metadata`, not the default layout):

| Layout pattern                                         | Mock                                                                     |
| ------------------------------------------------------ | ------------------------------------------------------------------------ |
| `bootstrapPublicLayoutUser()`                          | `@helvety/shared/layout-session-bootstrap`                               |
| `bootstrapE2eeLayoutSession()`                         | `@helvety/shared/layout-session-bootstrap`                               |
| `bootstrapAuthLayoutSession()` (auth layout only)      | `@helvety/shared/layout-session-bootstrap`                               |
| Docs public `page.tsx` session                         | `@helvety/shared/layout-session-bootstrap` (`bootstrapPublicLayoutUser`) |
| `E2eeAppRootLayout` only (no session in layout module) | `next/font/google` only                                                  |

Public-tool `seo-routes.test.ts` should use `expectPublicCrawlerRobots` from `@helvety/shared/test-utils/seo-route-test-helpers` so `*` and `AI_DISCOVERY_USER_AGENTS` stay in sync.

Private E2EE zones (`auth`, `contacts`, `notes`, `tasks`, `links`) use manual robots tests: `disallow: "/"` for all user agents and an empty sitemap. Do not migrate those to `expectPublicCrawlerRobots`.

## Cross-app test contract

Beyond the required floor above, match these templates when adding or auditing tests. Reference implementations live in sibling apps — copy structure, swap entity names only.

### API routes (`app/api/**/route.ts`)

Colocate **`route.test.ts` beside the list handler**. Import `[id]/route` from the same file when a detail route exists (see `apps/contacts/app/api/contacts/route.test.ts`).

| Case                                                | Required?                              | Reference                                      |
| --------------------------------------------------- | -------------------------------------- | ---------------------------------------------- |
| List success + `cache-control: no-store, max-age=0` | Yes                                    | `apps/contacts/app/api/contacts/route.test.ts` |
| Encrypted prefetch auth + `RATE_LIMITS.PREFETCH`    | Yes (E2EE + docs vault list routes)    | Same parent `route.test.ts` files              |
| Auth failure (no Supabase query)                    | Yes                                    | `apps/links/app/api/library/route.test.ts`     |
| `[id]` invalid UUID + no-store header               | Yes                                    | Same parent file imports `./[id]/route`        |
| CSP wiring (`runtime`, domain, `POST`)              | Yes per app with `csp-report/route.ts` | `apps/web/app/api/csp-report/route.test.ts`    |

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

One colocated `*-actions.test.ts` per `*-actions.ts` file. Use mocks from `apps/contacts/app/actions/contact-actions.test.ts` and helpers from `@helvety/shared/test-utils/action-test-helpers`.

### Primary data hooks (E2EE + docs)

1. `describe("get*ApiPath")` — pure basePath prefix tests.
2. `describe("use*")` + `renderHook` — for E2EE list hooks, mock `useEncryptedSortableItems` and `@/lib/crypto`; assert `navigationSource`, `perfMeasureName`, `loadFailureMessage`, `reorderEntities` (see `apps/contacts/hooks/use-contacts.test.ts`).

Docs uses a custom `useDocs` hook (mock `fetch` + `getDocsApiPath` instead of `useEncryptedSortableItems`).

### Components

| Type                   | E2EE reference                                      | Cases                                                                          |
| ---------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------ |
| List                   | `apps/contacts/components/contact-list.test.tsx`    | Refresh visibility, grouped empty, global empty guard, search empty, flat list |
| Editor command bar     | `apps/tasks/components/item-command-bar.test.tsx`   | Back, Save, Refresh, Delete accessible names                                   |
| Cross-app links panels | `apps/notes/components/contact-links-panel.test.ts` | `buildE2eeDeepLink` contract only                                              |

Public tools: command bars use RTL + `getByRole` (see `apps/image-upscaler/components/image-upscaler-command-bar.test.tsx`).

### Lib / copy / crypto

- Em-dash, licensing, manifests: enforced in `packages/shared` copy guardrails + `bun run consistency:customer-copy`. Do not duplicate in app tests.
- `lib/product-copy.test.ts`: `docs` (local PWA wrapper constants); `pdf` / `image-upscaler` thin re-exports from `@helvety/shared/app-product-descriptions` (see `zone-product-copy-wiring.test.ts`).
- `lib/llms-copy.test.ts`: only where llms content has unique product behavior (`docs`, `links`).
- Crypto: `buildAAD` + module surface tests in `lib/crypto/` (see `apps/notes/lib/crypto/encryption.test.ts`).

## `package.json` conventions

- **Dependencies**: `@helvety/brand`, `@helvety/shared`, `@helvety/ui` as `workspace:*` (UI carries production `tailwindcss` / `@tailwindcss/postcss` so `next build` can resolve the shared PostCSS config on Vercel)
- **DevDependencies**: `@helvety/config`, `@helvety/dev-deps` as `workspace:*`
- **Scripts**: `dev`, `build`, `start`, `lint`, `lint:fix`, `type-check`, `format`, `format:check`, `test`, `test:watch`, `test:coverage`
- **Version**: align with sibling product apps (currently `3.2.0`) unless the zone is intentionally versioned separately
- **Do not** duplicate toolchain packages pinned in `@helvety/dev-deps` (`bun run deps:drift`, in `ci:check`)

## Proxy profile selection

Pick one profile from `@helvety/shared/proxy` (`SECURITY_PROXY_PROFILE_OPTIONS`):

| Profile            | Typical apps                                                |
| ------------------ | ----------------------------------------------------------- |
| `public-marketing` | `web` (custom matcher excluding other zones)                |
| `auth-gateway`     | `auth`                                                      |
| `store-gateway`    | `store`                                                     |
| `e2ee-app`         | `tasks`, `contacts`, `notes`, `links`                       |
| `public-tool`      | `pdf`, `image-upscaler`; `docs` adds doc-editor CSP options |

Copy `SECURITY_PROXY_MATCHER` as a **static literal** into `export const config = { matcher: [...] }` (Next.js requirement). `scripts/check-consistency-guardrails.mjs` enforces parity with `packages/shared/src/proxy.ts`.

**Fail-closed auth refresh:** `auth-gateway` and `e2ee-app` profiles clear stale `sb-*` cookies when Supabase session refresh fails (`failClosedOnAuthRefresh` on `createAppProxy` / `createProfiledSecurityProxy`). E2EE zone `proxy.ts` files also set `failClosedOnAuthRefresh: true` explicitly; wired by `packages/shared/src/proxy-fail-closed-wiring.test.ts`.

## Root layout shell

| Shell                          | Apps                                                                                                |
| ------------------------------ | --------------------------------------------------------------------------------------------------- |
| `HelvetyPublicShellRootLayout` | `web`, `auth`, `store`, `pdf`, `image-upscaler`; `docs` (+ optional `EncryptionProvider` for vault) |
| `E2eeAppRootLayout`            | `tasks`, `contacts`, `notes`, `links`                                                               |

**Docs** uses `mainVariant: "overflow-main"` (pinned Helvety command bar + Eigenpal editor workspace). Helvety chrome (command bar, vault sheet, dialogs) uses `@helvety/ui` tokens and the navbar `ThemeSwitcher`. Eigenpal editor chrome is themed in `apps/docs/styles/docx-editor-helvety-bridge.css` (semantic `--doc-*` aliases, `--surface-toolbar` alignment with the command bar, File/Format/Insert title-bar menus visible with matching per-row left/right borders, doc icon + Help hidden, comment UI suppressed, Layers 3–8 for slate remaps, chrome surfaces, seamless toolbar stack, and menu/dropdown/tooltip overlays). Printable document pages stay white in both themes.

Gateway marketing WebGL (`@helvety/light-pillar`) belongs on the homepage route/component in `web`, not in zone layouts.

Use JSX for root layouts: `<HelvetyPublicShellRootLayout>` or `<E2eeAppRootLayout>` (not `return HelvetyPublicShellRootLayout({...})`). E2EE zones use `export default async function RootLayout`. Enforced by `consistency:zone-modernization`.

## Root `app/loading.tsx` matrix

| Shell family                 | Apps                                  | Export                     |
| ---------------------------- | ------------------------------------- | -------------------------- |
| Gateway / scroll-area public | `web`, `auth`, `store`                | `HelvetyShellRouteLoading` |
| Public tools                 | `pdf`, `docs`, `image-upscaler`       | `LoadingSpinner`           |
| E2EE                         | `tasks`, `contacts`, `notes`, `links` | `E2eeShellRouteLoading`    |

Nested routes (e.g. store products) use `LoadingSpinner`. Enforced by `consistency:zone-modernization`.

## E2EE `EncryptionProvider`

E2EE zones re-export the client provider from `@/lib/crypto` and pass `encryptionProvider={EncryptionProvider}` into `E2eeAppRootLayout` (test mocking + app boundary).

## `lib/env.ts` factory

| Tier                          | Factory                                                        | Apps                                  |
| ----------------------------- | -------------------------------------------------------------- | ------------------------------------- |
| Admin + rate limit            | `createAppServerUpstashEnv` + `serverUpstashMergedSchema`      | `store`                               |
| Admin + rate limit (extended) | `createAppServerUpstashEnv` + custom schema                    | `auth` (`DEVICE_TRUST_COOKIE_SECRET`) |
| User-scoped + rate limit      | `createAppUserScopedEnv` + `userScopedServerEnvSchema`         | E2EE apps, `docs`                     |
| Public tool + rate limit      | `createAppUpstashCookieEnv` + `upstashCookieSigningEnvSchema`  | `pdf`, `image-upscaler`               |
| Gateway                       | `getValidatedGatewayEnv` (re-exported as `getValidatedWebEnv`) | `web`                                 |

Wired by `packages/shared/src/zone-env-factory-wiring.test.ts` and `consistency:guardrails`.

## Next.js config presets

| Preset                         | Apps                                            |
| ------------------------------ | ----------------------------------------------- |
| `createE2eeZoneNextConfig`     | `tasks`, `contacts`, `notes`, `links`           |
| `createPublicToolNextConfig`   | `pdf`, `docs`, `image-upscaler`                 |
| `createAuthGatewayNextConfig`  | `auth`                                          |
| `createHelvetyNextConfig` only | `web`, `store` (bespoke `overrides` / rewrites) |

Wired by `packages/shared/src/zone-next-config-wiring.test.ts` and `consistency:zone-modernization` (`optimizePackageImports` must match declared dependencies).

## Navbar factories

Zone `components/navbar.tsx` files are thin wrappers around `@helvety/ui/create-app-navbar`:

- E2EE: `createE2eeAppNavbar`
- Public tools: `createPublicShellNavbar` + `publicToolNavbarBrand`
- Docs vault: `createVaultAwareShellNavbar`

Wired by `packages/shared/src/app-navbar-wiring.test.ts` and `packages/ui/src/e2ee-dashboard-wiring.test.ts`.

## Centralized zone wiring tests

In addition to per-zone `app/layout-shell-providers.test.ts` and `test:hygiene` floors, `@helvety/shared` ships Vitest guards for all ten zones: `zone-loading-wiring`, `zone-layout-wiring`, `zone-env-factory-wiring`, `zone-next-config-wiring`, `zone-entity-delete-wiring`, `zone-product-copy-wiring`. Prefer extending those when auditing monorepo-wide patterns instead of duplicating per-app `loading.test.ts` files.

## Multi-zone static assets (`assetPrefix`)

- **Use** `assetPrefix` + gateway `*-static` rewrites for heavy client bundles: `auth`, `tasks`, `contacts`, `notes`, `links`.
- **Omit** for lighter zones until production shows static asset conflicts: `store`, `pdf`, `docs`, `image-upscaler`.

See [`quality-modernization-baseline.md`](./quality-modernization-baseline.md).

## Environment tiers and Turbo

Turbo lists a **superset** of env vars on `build` in [`turbo.json`](../turbo.json) so cached builds invalidate when any zone secret changes. See [`turbo-env-tiers.md`](./turbo-env-tiers.md). **Required keys at runtime** still follow each app's `env.template`:

| Tier                         | Apps                    | Required secrets (typical)                                                        |
| ---------------------------- | ----------------------- | --------------------------------------------------------------------------------- |
| **Admin + rate limit**       | `auth`, `store`         | Supabase public + `SUPABASE_SECRET_KEY`, Upstash, `HELVETY_COOKIE_SIGNING_SECRET` |
| **User-scoped + rate limit** | E2EE apps, `docs`       | Supabase public + Upstash, `HELVETY_COOKIE_SIGNING_SECRET` (no admin client)      |
| **Public tool + rate limit** | `pdf`, `image-upscaler` | Supabase public + Upstash, `HELVETY_COOKIE_SIGNING_SECRET`                        |
| **Auth extra**               | `auth`                  | `DEVICE_TRUST_COOKIE_SECRET`                                                      |
| **Gateway**                  | `web`                   | Public Supabase + zone rewrite URLs when `VERCEL=1`                               |

See root [`README.md`](../README.md) § Environment Model.

## `lib/env.ts` JSDoc

| Tier                     | Apps                    | JSDoc must mention `ci:release` / `SKIP_ENV_VALIDATION` |
| ------------------------ | ----------------------- | ------------------------------------------------------- |
| Admin + rate limit       | `auth`, `store`         | Yes (`createAppServerUpstashEnv`)                       |
| User-scoped + rate limit | E2EE apps, `docs`       | Yes (`createAppUserScopedEnv`)                          |
| Public tool + rate limit | `pdf`, `image-upscaler` | Yes (`createAppUpstashCookieEnv`)                       |
| Gateway                  | `web`                   | Yes (`getValidatedWebEnv`)                              |

## E2EE UX patterns

| Pattern               | Canonical                                                       | Apps                                                                                   |
| --------------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Navbar login return   | `E2eeAppNavbar` with `loginReturnUrl="current"` (default)       | `tasks`, `notes`, `contacts`, `links`                                                  |
| Hook errors           | `reportE2eeHookError` / `reportE2eeActionFailure` in list hooks | E2EE apps                                                                              |
| Vault delete confirm  | `AlertDialog` before vault document delete                      | `docs`                                                                                 |
| Cross-app link panels | `EntityLinksPanel` in `@helvety/ui` + per-app hooks             | `tasks`, `notes` contact/note panels; contacts→notes/tasks use bespoke lazy-load hooks |

## Validation before merge

```bash
bun run ci:check    # includes zone-modernization, deps:drift, test:hygiene
bun run ci:release  # ci:check + build (before push / Vercel)
```

GitHub Actions (`.github/workflows/ci.yml`) runs `ci:check` on push/PR with `SKIP_ENV_VALIDATION=1`.

Optional local E2E: `bun run test:e2e` (Playwright gateway smoke; requires `@helvety/web` dev server). New E2EE zones: `bun run scaffold:e2ee-zone <slug>` prints the copy-from-contacts checklist.

## See also

- [`naming-conventions.md`](./naming-conventions.md)
- [`quality-modernization-baseline.md`](./quality-modernization-baseline.md)
- [`vercel-monorepo-apps.md`](./vercel-monorepo-apps.md)
- [`ui-shadcn-integration-policy.md`](./ui-shadcn-integration-policy.md)
