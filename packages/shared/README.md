# @helvety/shared

Shared security, auth, runtime, and cross-app utilities used across Helvety apps.

## Scope

This package centralizes:

- Auth and server-action guards
- Supabase server/client utilities
- CSRF and rate-limiting primitives
- Logging and error-handling helpers
- Canonical **user-visible** error strings and rate-limit copy via `@helvety/shared/user-facing-errors` (`GENERIC_USER_ERROR`, `buildRateLimitedUserMessage`) - safe to import from client components (no `server-only`)
- Shared constants, schemas, and utility functions
- Next.js product metadata via `@helvety/shared/seo` (`createHelvetyProductMetadata` plus sitemap/robots factories)
- Dashboard list prefetch helpers via `@helvety/shared/dashboard-prefetch` (row-cap detection plus over-cap messages: generic items string vs contacts-specific copy; see module exports)

## Core Contracts

### Canonical Ownership Map

- Proxy profiles, `SECURITY_PROXY_MATCHER` (canonical zone `proxy.ts` matcher pattern; excludes `_next/static`, `_next/image`, `favicon.ico`, and common `public/` extensions including `mjs`, `wasm`, and `json`—zone apps **inline** this string because Next.js requires a static literal), and request bootstrap defaults: `packages/shared/src/proxy.ts`
- Shared action and export limits: `packages/shared/src/constants.ts`
- Auth next-step resolver (app-owned): `apps/auth/lib/auth-step.ts`
- Shared auth callback flow factory: `packages/shared/src/auth-callback.ts`
- Lint/TypeScript workspace baseline: `packages/config/eslint.mjs` and `packages/config/tsconfig.base.json`

### Auth and Server Actions

- `authenticateAndRateLimit` is the default guard for authenticated app actions.
- Action modules can compose:
  - `server-action-primitives` (`parseActionInput`, `unexpectedActionError` for consistent validation and catch-all responses)
  - `entity-action-primitives`
    - includes `reorderOwnedEntities(...)` for scoped reorder mutations
    - includes `assignDefinedField(...)` for concise, consistent partial-update payload construction
  - `entity-link-action-primitives`
  - `entity-list-reorder`
    - includes `computeReorderUpdates(...)` for shared DnD reorder computation
- Shared editor draft helper:
  - `hooks/use-rich-text-draft-state` for saved/baseline/dirty-state tracking across rich-text editors
- `proxy` is request bootstrap only (CSP/CSRF/session refresh), not the primary authorization boundary. Each basePath zone copies the `SECURITY_PROXY_MATCHER` pattern into `config.matcher` as a static literal (Next.js requirement); `scripts/check-consistency-guardrails.mjs` enforces parity with `packages/shared/src/proxy.ts`.

### Supabase SSR

- Refresh auth session cookies early when `sb-*` cookies are present.
- Use trusted user reads (`getUser`) for security-sensitive checks.
- `@helvety/shared/cached-server` exposes per-request cached helpers such as `getCachedUser` and `getCachedCSRFToken` (built with React `cache`) so root layouts and navbars can share one Supabase `getUser` / CSRF read per request without duplicate round-trips.

### Logging and Errors

- Prefer structured logs and metadata-rich error helpers.
- Use `logger.logUnexpectedError(...)` for caught unexpected failures where you still handle the response yourself; otherwise prefer `unexpectedActionError(...)` from `server-action-primitives`, which logs and returns `{ success: false, error: GENERIC_USER_ERROR }`.
- Reuse `@helvety/shared/user-facing-errors` for any user-visible string that must match across server and client (generic line, rate-limit wording).
- Avoid embedding sensitive values in free-form log strings.

### Rate Limits and Caching

- Security rate limiting is distributed via Upstash.
- New shared rate-limit keys should use explicit, readable namespaces and stable key builders (for example `buildDownloadUrlRateLimitKey(...)`) to avoid string drift.
- Security keys require explicit TTL semantics.
- Strict production paths fail closed on rate-limit backend failure.
- Request cache helpers are per-request only, not global data caches.

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
- Shared UI package: [`packages/ui/README.md`](../ui/README.md)
