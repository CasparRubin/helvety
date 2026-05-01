# @helvety/shared

Shared security, auth, runtime, and cross-app utilities used across Helvety apps.

## Scope

This package centralizes:

- Auth and server-action guards
- Supabase server/client utilities
- CSRF and rate-limiting primitives
- Logging and error-handling helpers
- Shared constants, schemas, and utility functions

## Core Contracts

### Canonical Ownership Map

- Proxy profiles and request bootstrap defaults: `packages/shared/src/proxy.ts`
- Shared action and export limits: `packages/shared/src/constants.ts`
- Auth next-step resolver (app-owned): `apps/auth/lib/auth-step.ts`
- Shared auth callback flow factory: `packages/shared/src/auth-callback.ts`
- Lint/TypeScript workspace baseline: `packages/config/eslint.mjs` and `packages/config/tsconfig.base.json`

### Auth and Server Actions

- `authenticateAndRateLimit` is the default guard for authenticated app actions.
- Action modules can compose:
  - `server-action-primitives`
  - `entity-action-primitives`
    - includes `reorderOwnedEntities(...)` for scoped reorder mutations
    - includes `assignDefinedField(...)` for concise, consistent partial-update payload construction
  - `entity-link-action-primitives`
  - `entity-list-reorder`
    - includes `computeReorderUpdates(...)` for shared DnD reorder computation
- Shared editor draft helper:
  - `hooks/use-rich-text-draft-state` for saved/baseline/dirty-state tracking across rich-text editors
- `proxy` is request bootstrap only (CSP/CSRF/session refresh), not the primary authorization boundary.

### Supabase SSR

- Refresh auth session cookies early when `sb-*` cookies are present.
- Use trusted user reads (`getUser`) for security-sensitive checks.

### Logging and Errors

- Prefer structured logs and metadata-rich error helpers.
- Use `logger.logUnexpectedError(...)` for caught unexpected failures.
- Avoid embedding sensitive values in free-form log strings.

### Rate Limits and Caching

- Security rate limiting is distributed via Upstash.
- Rate-limit keys follow `ratelimit:<domain>:<resource>:...` naming.
- Security keys require explicit TTL semantics.
- Strict production paths fail closed on rate-limit backend failure.
- Request cache helpers are per-request only, not global data caches.

## Usage

Import from package entry points used by your app/action layer:

```ts
import { authenticateAndRateLimit } from "@helvety/shared/action-helpers";
import { logger } from "@helvety/shared/logger";
```

## Related

- Root monorepo docs: [`README.md`](../../README.md)
- Shared UI package: [`packages/ui/README.md`](../ui/README.md)
