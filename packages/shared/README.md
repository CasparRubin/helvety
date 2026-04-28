# @helvety/shared

Shared backend/security primitives used across Helvety apps.

## Scope

This package centralizes:

- Auth and server-action guards
- Supabase server/client utilities
- CSRF and rate-limiting primitives
- Logging and error-handling helpers
- Shared constants, schemas, and utility functions

## Core Contracts

### Auth and Server Actions

- `authenticateAndRateLimit` is the default guard for authenticated app actions.
- Action modules can compose:
  - `server-action-primitives`
  - `entity-action-primitives`
  - `entity-link-action-primitives`
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
