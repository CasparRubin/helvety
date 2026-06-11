# @helvety/shared

Shared security, auth, runtime, and cross-app utilities used across Helvety web apps in this monorepo (helvety.com).

## Scope

This package centralizes:

- Auth and server-action guards
- Supabase server/client utilities and shared auth types via `@helvety/shared/supabase-types` (`User`, `SupabaseClient`, `EmailOtpType`, `AuthError`)
- CSRF and rate-limiting primitives
- Logging and error-handling helpers
- Canonical **user-visible** error strings and rate-limit copy via `@helvety/shared/user-facing-errors` (`GENERIC_USER_ERROR`, `buildRateLimitedUserMessage`) - safe to import from client components (no `server-only`)
- Shared constants, schemas, and utility functions
- Next.js product metadata via `@helvety/shared/seo` (`createHelvetyProductMetadata`, `AI_DISCOVERY_USER_AGENTS`, plus sitemap/robots factories with explicit AI-crawler rules on public vs private zones) and shared SEO blurbs in `@helvety/shared/app-product-descriptions` (`WEB_SITE_DESCRIPTION`, per-app `*_DESCRIPTION`, PWA variants). Public sitemaps list indexable page URLs only; private zones omit `app/sitemap.ts`. Vitest guardrails: `seo-zone-consistency.test.ts`, `seo.test.ts`, and per-app `seo-routes.test.ts` helpers in `@helvety/shared/test-utils/seo-route-test-helpers`.
- Company and licensing copy constants in `@helvety/shared/licensing` (`HELVETY_COMPANY_VALUES_TAGLINE`, `HELVETY_SWISS_ORIGIN_SEO`, `HELVETY_WEB_DEFAULT_TITLE`, plus AGPL helpers for Store/legal/`llms.txt` licensing sections only)
- Dashboard list prefetch helpers via `@helvety/shared/dashboard-prefetch` (row-cap detection plus over-cap messages: generic items string vs contacts-specific copy; see module exports)
- Card-level Helvety Store catalog via `@helvety/shared/store-catalog` (`STORE_PRODUCT_CARDS`, `StoreProductId` literal-id union, plus typed sort/lookup helpers) as the single source of truth for Store card fields (name, blurb, type, category, runs-on, free / open-source flags, release date); UI badges (type colors, artist credit) are styled in `apps/store/components/products/product-badge.tsx`; see `apps/store/README.md` › "Adding a New Product" for the end-to-end add-a-product flow
- Customer-facing copy guardrails via `@helvety/shared/customer-copy-guardrails` (user-facing path list; em-dash rule; SEO license-free checks in `seo-customer-copy.test.ts` and `store-copy-guardrails.test.ts`; enforced by `consistency:customer-copy`, `consistency:install-manifest-metadata`, and Vitest)
- Per-app `env.template` keys validated by root `consistency:env-templates` (`scripts/env-template-expectations.mjs`; Vitest in `env-template-consistency.test.ts`); local `.env.local` tier parity via `consistency:local-env` (`scripts/audit-local-env.mjs`)
- App `lib/env.ts` modules use tiered factories from `@helvety/shared/env-validation`: `createAppServerUpstashEnv` (admin tier), `createAppUserScopedE2eeEnv` (E2EE + docs), `createAppUpstashCookieEnv` (public tools), `getValidatedGatewayEnv` (web)
- E2EE delete copy: `defineEntityDeleteRegistry` in `@helvety/shared/entity-delete-message`
- Monorepo-wide zone wiring guards: `zone-loading-wiring`, `zone-layout-wiring`, `zone-env-factory-wiring`, `zone-next-config-wiring`, `zone-entity-delete-wiring`, `zone-product-copy-wiring` (Vitest; see [`docs/app-consistency-checklist.md`](../../docs/app-consistency-checklist.md))
- PostCSS / Tailwind build wiring validated by `scripts/postcss-app-expectations.mjs` (`consistency:guardrails`, `deps:drift`; Vitest in `postcss-app-consistency.test.ts`). Drift and security-floor scripts are smoke-tested in `deps-guardrail-scripts.test.ts`.
- Navbar About blurbs via `@helvety/shared/app-navbar-about` (per-app product copy; Swiss closing uses `HELVETY_SWISS_ORIGIN_SEO`)

## Core Contracts

### Canonical Ownership Map

- Proxy profiles, `SECURITY_PROXY_MATCHER` (canonical zone `proxy.ts` matcher pattern; excludes `_next/static`, `_next/image`, `favicon.ico`, and common `public/` extensions including `mjs`, `wasm`, and `json`; zone apps **inline** this string because Next.js requires a static literal), and request bootstrap defaults: `packages/shared/src/proxy.ts`
- Shared action and export limits: `packages/shared/src/constants.ts`
- Auth next-step resolver (app-owned): `apps/auth/lib/auth-step.ts`
- Shared auth callback flow factory: `packages/shared/src/auth-callback.ts`
- Toolchain config entrypoints: `packages/config/eslint.mjs`, `packages/config/tsconfig.base.json`, `packages/config/vitest.mjs`, `packages/config/postcss.mjs` (pinned versions in [`packages/dev-deps`](../dev-deps/); PostCSS plugin loaded from dev-deps; `@helvety/ui` production Tailwind packages for Turbopack CSS graph)
- E2EE server page guard and path helpers: `@helvety/shared/e2ee-page-auth` (`requireE2eeAppPageAuth`, `requiresE2eeBrowserUnlock`, `E2EE_APP_PAGE_PATHS`)
- Passkey encryption params for E2EE apps: `@helvety/shared/encryption-actions` (`getEncryptionParams`, `getPasskeyParams`, `getPasskeyParamsWithOptions`); the auth zone wraps `getPasskeyParamsWithOptions` with auth-specific rate limits

### Auth and Server Actions

- `authenticateAndRateLimit` is the default guard for authenticated app actions.
- Action modules can compose:
  - `server-action-primitives` (`parseActionInput`, `unexpectedActionError` for consistent validation and catch-all responses)
  - `entity-action-primitives`
    - includes `reorderOwnedEntities(...)` and `mapReorderOwnedEntitiesFailure(...)` for scoped reorder mutations
    - includes `fetchOwnedEncryptedExport(...)`, `isExportWithinCap` / `areExportTablesWithinCap`, and `logEncryptedExportRequested(...)` for capped encrypted exports (used by Tasks, Notes, and Links entity actions)
    - includes `assignDefinedField(...)` for concise, consistent partial-update payload construction
  - `entity-link-action-primitives`
  - `entity-list-reorder`
    - includes `computeReorderUpdates(...)` for shared DnD reorder computation
- Shared editor draft helper:
  - `hooks/use-rich-text-draft-state` for saved/baseline/dirty-state tracking across rich-text editors
- E2EE list and draft cleanup helpers via `@helvety/shared/e2ee-draft` (`getE2eeListTitle`, `isDraftSnapshotUnchanged` for pristine-draft deletion on sheet close)
- `proxy` is request bootstrap only (CSP, CSRF cookie bootstrap/re-issue, session refresh), not the primary authorization boundary. Each basePath zone copies the `SECURITY_PROXY_MATCHER` pattern into `config.matcher` as a static literal (Next.js requirement); `scripts/check-consistency-guardrails.mjs` enforces parity with `packages/shared/src/proxy.ts`. All session-bearing profiles (**`auth-gateway`**, **`e2ee-app`**, **`store-gateway`**, **`public-tool`**) use fail-closed auth refresh (clear stale `sb-*` cookies when Supabase session refresh fails); **`public-marketing`** (`web`) does not. See `packages/shared/src/proxy-fail-closed-wiring.test.ts`. Session mutations must use `createServerMutatingClient` (`packages/shared/src/zone-supabase-session-mutation-wiring.test.ts`, `bun run consistency:supabase-auth`).
- `@helvety/shared/encrypted-prefetch-api` — `encryptedPrefetchAuthOptions`, `ENCRYPTED_PREFETCH_COLUMNS`, `CONTACT_LINK_PICKER_COLUMNS` (slim contact list for Tasks contact link picker), and `ENCRYPTED_PREFETCH_READ_RATE_LIMIT` (`RATE_LIMITS.PREFETCH`, 20/min) for encrypted dashboard list/detail GET routes (contacts, tasks, notes, links, docs vault APIs). No `select("*")` on those handlers. Docs vault routes use the authenticated user Supabase client (RLS), not `createAdminClient()`.
- `@helvety/shared/encrypted-prefetch-queries` — shared Supabase list queries for encrypted dashboard batch actions and list API routes (tasks, contacts, notes, links, docs).
- `@helvety/shared/client-env` — client-safe `NEXT_PUBLIC_*` Zod validation (`getValidatedClientEnv`, `getClientSupabaseUrl`, `getClientSupabaseKey`); used by `@helvety/shared/supabase/client`.
- **Approved Bearer exception:** `apps/auth/lib/extension-bearer-auth.ts` is the only place that constructs a raw `@supabase/supabase-js` `createClient` (extension `Authorization: Bearer` header; no cookie session). All other app code uses `@helvety/shared/supabase/*` factories.
- `@helvety/shared/entity-links` — cross-app link CRUD helpers; `ENTITY_LINK_COLUMNS` for explicit `entity_links` reads (no `select("*")`). Cross-link picker titles use `decryptItemDisplayTitle` / `decryptNoteDisplayTitle` from `@helvety/shared/crypto`.

### Cross-app URLs (`config.ts`)

- **`urls`**: canonical absolute base URLs for each helvety.com zone (and the dev gateway host).
- **`getLocalAppHref`**: strips Helvety / localhost origins to **root-relative** paths for **`next/link`** in the **gateway** (`apps/web`, no Next **`basePath`**). Do **not** use it for cross-zone **`Link`** targets rendered inside **`basePath`** apps; use absolute **`urls.*`** (see **`AppSwitcher`** / `packages/ui` README).
- **Inside a `basePath` zone** (`apps/docs`, `apps/tasks`, …): App Router navigation (`router.replace`, `<Link href>`) uses **zone-relative** paths (`/`, `/?doc=…` on Docs, `/?item=…` on Tasks, etc.). Browser **`fetch`**, **`getLoginUrl`** return paths, and **`revalidatePath`** use **gateway-visible** paths (`/docs/api/…`, `/docs`, …). Passing `/docs` to `router.replace` inside Docs yields `/docs/docs` (404). Docs `?doc=` is a **vault bookmark** (URL sync after explicit open/save; editor starts blank on load), not an E2EE-style auto-open sheet link. Reference: [`apps/docs/README.md`](../../apps/docs/README.md) § Routing and [`apps/docs/lib/docs-zone-path.ts`](../../apps/docs/lib/docs-zone-path.ts).

### Supabase SSR

- Refresh auth session cookies early when `sb-*` cookies are present (`refreshSupabaseAuthSession` in `createSecurityProxy`, and on `createAppProxy` root → `basePath` redirects when session cookies are present). Edge verification uses `auth.getClaims()`; authorization elsewhere uses `getUser()`.
- `@supabase/ssr` 0.12+ may call `setAll(cookies, headers)` with `Cache-Control` / `Pragma` / `Expires` on session refresh. `refreshSupabaseAuthSession` applies those to redirect and `next()` responses; `createSecurityProxy` copies them onto the rebuilt `NextResponse.next()` via `copySupabaseAuthRefreshResponseHeaders` so browsers do not cache stale auth cookies. RSC `createServerSupabaseClient` accepts the optional header map but ignores it (no response object in Server Components).
- After the proxy persists refreshed session cookies via `setAll`, it sets `x-helvety-auth-refreshed: 1` on the request and forwards it to Server Components. `createServerSupabaseClient` then **no-ops** `setAll` so RSC does not attempt disallowed cookie writes; use `createServerMutatingClient` in route handlers and server actions that create or clear sessions (`exchangeCodeForSession`, `verifyOtp`, `signOut`, `updateUser`, etc.). Development still throws if the header is absent and an RSC write is blocked (guardrail for missing proxy refresh).
- CSRF cookie signing uses `HELVETY_COOKIE_SIGNING_SECRET` only (not `SUPABASE_SECRET_KEY`). Required on apps whose proxy profile sets `includeCsrf: true`: `e2ee-app`, `auth-gateway`, `store-gateway`, and `public-tool` (including `apps/docs`, which uses the user-scoped + Upstash env tier for vault APIs). The proxy re-issues the signed `csrf_token` cookie when it is missing or fails validation (for example after secret rotation); layouts read the current token via `getCachedCSRFToken` (cookie, then `x-csrf-bootstrap-token`). The gateway (`public-marketing`) does not bootstrap CSRF cookies. Auth sets `helvety_device_trust` via `DEVICE_TRUST_COOKIE_SECRET` after email verification; E2EE apps and docs verify that cookie on `requireAuth` (weekly email proof). E2EE apps, Docs, and the Chromium extension cache derived master keys in IndexedDB (`helvety-crypto`) per `auth-session-policy.ts` (24h sliding idle, 7d max).
- Use trusted user reads for security-sensitive checks: call `supabase.auth.getUser()` directly or via `@helvety/shared/auth-retry` (`getAuthUser`, single-shot, fail-closed). Do not use `auth.getSession()` for authorization (`bun run consistency:supabase-auth`).
- `lookupCredentialByCredentialId` in `packages/shared/src/supabase/admin.ts` centralizes passkey credential lookup by WebAuthn credential id (used by auth passkey sign-in).
- `createAdminClient()` is for system flows only; approved call sites are listed in `packages/shared/src/supabase/admin.ts`. Prefer `createScopedAdminQuery(userId)` for user-owned tables.
- `@helvety/shared/cached-server` exposes per-request cached helpers such as `getCachedUser` and `getCachedCSRFToken` (built with React `cache`) so root layouts and navbars can share one Supabase `getUser` / CSRF read per request without duplicate round-trips.
- `@helvety/shared/layout-session-bootstrap`:
  - `bootstrapPublicLayoutUser()` — user only (`apps/web`, `apps/pdf`, `apps/image-upscaler`).
  - Docs `app/page.tsx` uses `getCachedUser()` directly (deduped with `bootstrapE2eeLayoutSession()` in the root layout).
  - `bootstrapE2eeLayoutSession()` — CSRF + user in parallel (`apps/store`, `apps/docs` layouts, `@helvety/ui/e2ee-app-root-layout` for tasks/contacts/notes/links). Docs uses this for optional vault save while keeping the main editor route public.
  - `bootstrapAuthLayoutSession()` — same CSRF + user contract as `bootstrapE2eeLayoutSession()` (`apps/auth` root layout).
  - All helpers log and return safe fallbacks on failure.
- `@helvety/shared/e2ee-deep-link` -> `buildE2eeDeepLink`: Cross-app entity deep links for tasks, notes, and contacts URL query params.

### Logging and Errors

- Prefer structured logs and metadata-rich error helpers.
- Use `logger.logUnexpectedError(...)` for caught unexpected failures where you still handle the response yourself; otherwise prefer `unexpectedActionError(...)` from `server-action-primitives`, which logs and returns `{ success: false, error: GENERIC_USER_ERROR }`.
- Reuse `@helvety/shared/user-facing-errors` for any user-visible string that must match across server and client (generic line, rate-limit wording).
- Avoid embedding sensitive values in free-form log strings.

### Rate Limits and Caching

- Security rate limiting is distributed via Upstash. Shared buckets include `RATE_LIMITS.API`, `READ`, `EXPORT` (tight encrypted exports), and `PREFETCH` (encrypted list prefetch GET routes via `encrypted-prefetch-api`). List query bodies and overflow copy live in `encrypted-prefetch-queries` and `dashboard-prefetch`.
- New shared rate-limit keys should use explicit, readable namespaces and stable key builders (for example `buildPublicDownloadRateLimitKey(...)`) to avoid string drift.
- Security keys require explicit TTL semantics.
- Strict production paths fail closed on rate-limit backend failure.
- Request cache helpers are per-request only (`React.cache` in `@helvety/shared/cached-server` and store `getCachedAllProducts`). Public store catalog **cards** also use Next.js `unstable_cache` with a `store-catalog` tag in `apps/store/lib/data/product-catalog-cache.ts` (not for E2EE user data).

## Test helpers

Vitest-only modules (not for production app bundles):

- `@helvety/shared/test-utils/customer-copy-test-helpers` — em-dash, license-free SEO, Swiss-origin assertions
- `@helvety/shared/test-utils/seo-route-test-helpers` — `expectPublicCrawlerRobots` for public-zone `robots.ts` tests (`*` plus `AI_DISCOVERY_USER_AGENTS`)
- `@helvety/shared/test-utils/action-test-helpers` — shared server-action test utilities

See [`docs/app-consistency-checklist.md`](../../docs/app-consistency-checklist.md) for which layout/metadata mocks each zone needs.

## Usage

Import from package entry points used by your app/action layer:

```ts
import { authenticateAndRateLimit } from "@helvety/shared/action-helpers";
import { logger } from "@helvety/shared/logger";
import { unexpectedActionError } from "@helvety/shared/server-action-primitives";
import { GENERIC_USER_ERROR } from "@helvety/shared/user-facing-errors";
```

## Related

- Root monorepo docs: [`README.md`](../../README.md)
- Monorepo naming and formatting: [`docs/naming-conventions.md`](../../docs/naming-conventions.md)
- App zone checklist: [`docs/app-consistency-checklist.md`](../../docs/app-consistency-checklist.md)
- Shared UI package: [`packages/ui/README.md`](../ui/README.md)
