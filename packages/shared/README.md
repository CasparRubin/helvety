# @helvety/shared

Shared runtime, security, SEO, and cross-app utilities for Helvety web apps in this monorepo (helvety.com).

**Current zones:** `web`, `store`, `pdf`, `image-editor`, `ocr`.

## Scope

This package centralizes:

- Logging and error-handling helpers
- Canonical **user-visible** error strings and rate-limit copy via `@helvety/shared/user-facing-errors` (`GENERIC_USER_ERROR`, `buildRateLimitedUserMessage`) - safe to import from client components (no `server-only`)
- Shared constants, schemas, and utility functions
- Next.js product metadata via `@helvety/shared/seo` (`createHelvetyProductMetadata`, `AI_DISCOVERY_USER_AGENTS`, `GATEWAY_DISALLOWED_PATHS`, plus sitemap/robots factories). Canonical crawl policy is gateway `/robots.txt` (RFC 9309); zone robots files are host-absolute mirrors. Vitest guardrails: `seo.test.ts` and per-app `seo-routes.test.ts` helpers in `@helvety/shared/test-utils/seo-route-test-helpers`.
- Company and licensing copy constants in `@helvety/shared/licensing`
- Helvety ecosystem product sections via `@helvety/shared/helvety-ecosystem-sections` (app switcher grouping, store filter pills, category badges). Register new products here first.
- Card-level Helvety Store catalog via `@helvety/shared/store-catalog` (card fields, `StoreProductType`, sort/lookup helpers). See `apps/store/README.md` › "Adding a New Product".
- Customer-facing copy guardrails via `@helvety/shared/customer-copy-guardrails` (enforced by `consistency:customer-copy` and related checks)
- Per-app `env.template` keys validated by root `consistency:env-templates`; local `.env.local` tier parity via `consistency:local-env`
- App `lib/env.ts` modules use factories from `@helvety/shared/env-validation`: `createAppUpstashEnv` (store rate limiting), `getValidatedGatewayEnv` (web)
- PostCSS / Tailwind build wiring validated by `scripts/postcss-app-expectations.mjs`
- Navbar About blurbs via `@helvety/shared/app-navbar-about`

## Core Contracts

### Canonical Ownership Map

- Proxy profiles, `SECURITY_PROXY_MATCHER` (canonical zone `proxy.ts` matcher pattern; zone apps **inline** this string because Next.js requires a static literal), and request bootstrap defaults: `packages/shared/src/proxy.ts`
- Shared action and export limits: `packages/shared/src/constants.ts`
- Toolchain config entrypoints: `packages/config/eslint.mjs`, `packages/config/tsconfig.base.json`, `packages/config/vitest.mjs`, `packages/config/postcss.mjs` (pinned versions in [`packages/dev-deps`](../dev-deps/))

### Proxy and CSP

- `proxy` is request bootstrap only (CSP headers). Per-request CSP uses a cryptographic nonce; **CSP violation reports** post to `/api/csp-report` on the gateway (`apps/web`) or `/{basePath}/api/csp-report` on zoned apps. Each basePath zone copies the `SECURITY_PROXY_MATCHER` pattern into `config.matcher` as a static literal; `scripts/check-consistency-guardrails.mjs` enforces parity.
- Profiles in use: **`public-marketing`** (`web`), **`store-gateway`** (`store`), **`public-tool`** (`pdf`, `image-editor`, `ocr`).

### Cross-app URLs (`config.ts`)

- **`urls`**: canonical absolute base URLs for each helvety.com zone (and the dev gateway host).
- **`urls.storeProducts`**: catalog landing (`…/store/products`) for nav CTAs; prefer over **`urls.store`** when opening the product list.
- **`urls.cloud`**: Helvety Cloud product origin (`https://helvety.cloud`), not a helvety.com path zone.
- **`getLocalAppHref`**: strips Helvety / localhost origins to **root-relative** paths for **`next/link`** in the **gateway** (`apps/web`, no Next **`basePath`**). Do **not** use it for cross-zone **`Link`** targets rendered inside **`basePath`** apps; use absolute **`urls.*`** (see **`AppSwitcher`** / `packages/ui` README).

### Rate Limits and Caching

- Security rate limiting is distributed via Upstash (Store public downloads).
- New shared rate-limit keys should use explicit, readable namespaces and stable key builders (for example `buildPublicDownloadRateLimitKey(...)`).
- Request cache helpers are per-request only (`React.cache`). Public store catalog **cards** also use Next.js `unstable_cache` with a `store-catalog` tag in `apps/store/lib/data/product-catalog-cache.ts`.

### Logging and Errors

- Prefer structured logs and metadata-rich error helpers.
- Use `logger.logUnexpectedError(...)` for caught unexpected failures.
- Reuse `@helvety/shared/user-facing-errors` for any user-visible string that must match across server and client.
- Avoid embedding sensitive values in free-form log strings.

## Test helpers

Vitest-only modules (not for production app bundles):

- `@helvety/shared/test-utils/customer-copy-test-helpers`
- `@helvety/shared/test-utils/seo-route-test-helpers`: `expectPublicCrawlerRobots` for public-zone `robots.ts` tests
- `@helvety/shared/test-utils/base-ui-test-helpers`: menu/slider helpers for Base UI shadcn

See [`docs/app-consistency-checklist.md`](../../docs/app-consistency-checklist.md).

## Usage

```ts
import { logger } from "@helvety/shared/logger";
import { GENERIC_USER_ERROR } from "@helvety/shared/user-facing-errors";
```

## Related

- Root monorepo docs: [`README.md`](../../README.md)
- Monorepo naming and formatting: [`docs/naming-conventions.md`](../../docs/naming-conventions.md)
- App zone checklist: [`docs/app-consistency-checklist.md`](../../docs/app-consistency-checklist.md)
- Shared UI package: [`packages/ui/README.md`](../ui/README.md)
