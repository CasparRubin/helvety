# Quality Modernization Best-Practice Mapping

## Next.js App Router

- Removed request-header reads from E2EE root pages to avoid forcing dynamic rendering when handling auth-failure redirects.
- Preserved centralized auth redirect behavior while relying on canonical URL config.

## React 19 Hook/Effect Hygiene

- Synced dashboard selected-item state with live URL search params to prevent stale UI state.
- Added timer cleanup in editors to avoid post-unmount state updates from delayed status resets.
- Replaced root-relative fallback navigation with app-local paths for multi-zone correctness.
- Updated mobile viewport hook to `useSyncExternalStore` for subscription-safe viewport state.

## TypeScript Safety

- Removed an unsafe double-cast in auth device trust cookie secret handling.
- Reduced Supabase admin helper assertion complexity while keeping typed scoped table usage.

## Shared Architecture Guardrails

- Added baseline/contract documentation for modernization phases.
- Standardized security proxy matcher usage in app proxies through shared matcher constants.
- Consolidated app env validation flow via `validateServerUpstashEnv`.
- Added CI guardrails that enforce shared proxy matcher and env-validation contract usage.
