# Quality Modernization Best-Practice Mapping

## Next.js App Router

- Removed request-header reads from E2EE root pages to avoid forcing dynamic rendering when handling auth-failure redirects.
- Preserved centralized auth redirect behavior while relying on canonical URL config.
- Shell **ecosystem** navigation (`AppSwitcher` in `@helvety/ui`) uses **absolute** `urls.*` hrefs so Next.js **`basePath`** on zoned apps does not prefix another app’s path (for example `/auth/pdf` by mistake).

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
- Standardized Next.js `proxy.ts` matchers: basePath-mounted apps **inline** the same static pattern as `SECURITY_PROXY_MATCHER` in `@helvety/shared/proxy` (Next.js requires a literal `config.matcher`, not an imported binding) so static `public/` assets (including `.mjs` / `.wasm` / `.json` for PDF.js and ONNX runtimes) skip the security proxy chain; CI guardrails parse the shared source and enforce parity.
- Consolidated app env via tiered factories in `@helvety/shared/env-validation` (`createAppServerUpstashEnv`, `createAppUserScopedEnv`, `createAppUpstashCookieEnv`, `getValidatedGatewayEnv`).
- Added CI guardrails that enforce shared matcher parity, `apps/web` extension alignment, zone modernization (loading matrix, layout JSX, `optimizePackageImports` vs deps), and env-validation contract usage.
- Navbar and Next config presets (`create-app-navbar`, `createE2eeZoneNextConfig`, `createPublicToolNextConfig`, `createAuthGatewayNextConfig`) reduce per-zone drift.
