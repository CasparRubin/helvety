# @helvety/shared

Shared backend/security primitives for Helvety apps.

## Auth and Server-Action Contract

- `action-helpers.authenticateAndRateLimit` is the default guard for authenticated app server actions.
- Server-action modules can compose additional shared primitives for consistency and safety:
  - `server-action-primitives` for structured Zod parse+warn and standardized unexpected-error responses
  - `entity-action-primitives` for ownership scope checks, chunked reorder updates, and export-cap helpers
  - `entity-link-action-primitives` for canonical link create/delete orchestration and ownership validation
- Auth app flows in `apps/auth` may use local action guards for flow-specific checks, but must keep CSRF handling, trusted IP fail-closed behavior, and rate limiting explicit.
- `proxy` is a lightweight request stage for CSP/CSRF bootstrap and Supabase cookie refresh; it is not the primary authorization boundary.
- Server Components, Server Actions, and Route Handlers remain the authoritative authn/authz enforcement points.

## Supabase SSR Contract

- Use `supabase/refresh-auth-session-in-proxy` to refresh session cookies early when `sb-* auth` cookies are present.
- Use `auth.getUser()` for security-sensitive server checks; do not rely on unverified cookie session payloads for authorization decisions.

## Security Logging Contract

- Use `auth-logger` event enums/constants for auth-specific `action` and `reason` metadata.
- For generic server-action failures, prefer `logger.logUnexpectedError(...)` (directly or via shared action primitives) and keep metadata structured.
- Keep metadata structured and avoid embedding sensitive values in message strings.

## Cache Contract

- **Distributed security cache (`@upstash/redis` + `@upstash/ratelimit`)** lives in `src/rate-limit.ts` for cross-instance limits and lockouts.
- **Key naming** uses colon-delimited namespaces (`ratelimit:<domain>:<resource>:...`) with normalized lowercase identifiers.
- **TTL rule**: every persisted security key must have explicit expiry semantics (`Ratelimit` windows, Redis `EXPIRE`, or `SET` with `ex`).
- **Failure policy**: production `strict` paths fail closed when Redis is unavailable; `soft` paths may allow and log structured metadata.
- **Request cache** (`src/cached-server.ts`) is per-request only (`react cache()`), not a cross-request data cache.
- **Client caches** (localStorage / in-memory) must be bounded by max-age or max-size and self-heal stale entries.
