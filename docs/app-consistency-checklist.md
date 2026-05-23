# App consistency checklist

Use this when adding a new zone under `apps/*` or auditing an existing app for monorepo parity.

## Required files (every Next.js zone)

| File                 | Purpose                                                                                                                                                  |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `proxy.ts`           | Zone security proxy (`createAppProxy` or profiled variant); **no** `middleware.ts`                                                                       |
| `proxy.test.ts`      | Matcher parity with `SECURITY_PROXY_MATCHER` (gateway: zone exclusions + static extensions)                                                              |
| `env.template`       | Documented env keys; validated by `bun run consistency:env-templates`                                                                                    |
| `eslint.config.mjs`  | `createEslintConfig(import.meta.dirname)` from `@helvety/config/eslint`                                                                                  |
| `vitest.config.ts`   | `createVitestConfig(__dirname)` from `@helvety/config/vitest`                                                                                            |
| `vitest.setup.ts`    | `@testing-library/jest-dom` + RTL `cleanup()`                                                                                                            |
| `tsconfig.json`      | Extends `@helvety/config/tsconfig.base.json` with `@/*` → `./*`                                                                                          |
| `postcss.config.mjs` | Re-exports `@helvety/config/postcss`                                                                                                                     |
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

| Family                | Apps                                  | Also assert                                                    |
| --------------------- | ------------------------------------- | -------------------------------------------------------------- |
| E2EE                  | `tasks`, `contacts`, `notes`, `links` | `E2eeAppRootLayout`, `encryptionProvider={EncryptionProvider}` |
| Public tool           | `pdf`, `image-upscaler`               | `HelvetyPublicShellRootLayout`, `getCachedUser`                |
| Gateway marketing     | `web`                                 | `HelvetyPublicShellRootLayout`, `bootstrapPublicLayoutUser`    |
| Auth gateway          | `auth`                                | CSRF wraps `EncryptionProvider`; nesting order                 |
| Store gateway         | `store`                               | CSRF wraps `{shell}`                                           |
| Docs (public + vault) | `docs`                                | CSRF + `EncryptionProvider`; nesting order                     |

Copy an existing test from the same family when adding a zone.

### `layout-metadata.test.ts` mocks

Mock the session helper your `app/layout.tsx` actually uses (metadata-only tests import `metadata`, not the default layout):

| Layout pattern                                         | Mock                                                                      |
| ------------------------------------------------------ | ------------------------------------------------------------------------- |
| `bootstrapPublicLayoutUser()`                          | `@helvety/shared/layout-session-bootstrap`                                |
| `bootstrapE2eeLayoutSession()`                         | `@helvety/shared/layout-session-bootstrap`                                |
| Inline `getCachedUser` / `getCachedCSRFToken`          | `@helvety/shared/cached-server` (+ `logger` if the layout catches errors) |
| `E2eeAppRootLayout` only (no session in layout module) | `next/font/google` only                                                   |

Public-tool `seo-routes.test.ts` should use `expectPublicCrawlerRobots` from `@helvety/shared/test-utils/seo-route-test-helpers` so `*` and `AI_DISCOVERY_USER_AGENTS` stay in sync.

## `package.json` conventions

- **Dependencies**: `@helvety/brand`, `@helvety/shared`, `@helvety/ui` as `workspace:*`
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

## Root layout shell

| Shell                          | Apps                                                                                                |
| ------------------------------ | --------------------------------------------------------------------------------------------------- |
| `HelvetyPublicShellRootLayout` | `web`, `auth`, `store`, `pdf`, `image-upscaler`; `docs` (+ optional `EncryptionProvider` for vault) |
| `E2eeAppRootLayout`            | `tasks`, `contacts`, `notes`, `links`                                                               |

Gateway marketing WebGL (`@helvety/light-pillar`) belongs on the homepage route/component in `web`, not in zone layouts.

## Multi-zone static assets (`assetPrefix`)

- **Use** `assetPrefix` + gateway `*-static` rewrites for heavy client bundles: `auth`, `tasks`, `contacts`, `notes`, `links`.
- **Omit** for lighter zones until production shows static asset conflicts: `store`, `pdf`, `docs`, `image-upscaler`.

See [`quality-modernization-baseline.md`](./quality-modernization-baseline.md).

## Environment tiers and Turbo

Turbo lists a **superset** of env vars on `build` in [`turbo.json`](../turbo.json) so cached builds invalidate when any zone secret changes. See [`turbo-env-tiers.md`](./turbo-env-tiers.md). **Required keys at runtime** still follow each app's `env.template`:

| Tier             | Apps                               | Required secrets (typical)                                                        |
| ---------------- | ---------------------------------- | --------------------------------------------------------------------------------- |
| **Full stack**   | `auth`, E2EE apps, `store`, `docs` | Supabase public + `SUPABASE_SECRET_KEY`, Upstash, `HELVETY_COOKIE_SIGNING_SECRET` |
| **Auth extra**   | `auth`                             | `DEVICE_TRUST_COOKIE_SECRET`                                                      |
| **Public tools** | `pdf`, `image-upscaler`            | Supabase public + `HELVETY_COOKIE_SIGNING_SECRET` only                            |
| **Gateway**      | `web`                              | Public Supabase + zone rewrite URLs when `VERCEL=1`                               |

See root [`README.md`](../README.md) § Environment Model.

## `lib/env.ts` JSDoc

| Tier         | Apps                       | JSDoc must mention `ci:release` / `SKIP_ENV_VALIDATION` |
| ------------ | -------------------------- | ------------------------------------------------------- |
| Full stack   | E2EE apps, `store`, `docs` | Yes (`validateServerUpstashEnv`)                        |
| Public tools | `pdf`, `image-upscaler`    | Yes (`validateCookieSigningEnv`)                        |
| Auth         | `auth`                     | Yes (extended schema)                                   |
| Gateway      | `web`                      | No `lib/env.ts`                                         |

## Validation before merge

```bash
bun run ci:check    # includes deps:drift, consistency:filenames, test:hygiene
bun run ci:release  # ci:check + build (before push / Vercel)
```

## See also

- [`naming-conventions.md`](./naming-conventions.md)
- [`quality-modernization-baseline.md`](./quality-modernization-baseline.md)
- [`vercel-monorepo-apps.md`](./vercel-monorepo-apps.md)
- [`ui-shadcn-integration-policy.md`](./ui-shadcn-integration-policy.md)
