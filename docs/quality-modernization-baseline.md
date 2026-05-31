# Quality Modernization Baseline

Living contracts and guardrails for the Helvety monorepo. Historical modernization decisions are summarized in § Completed modernization; ongoing expectations in § Verification and guardrails.

## Shared Contracts To Preserve

- `@helvety/dev-deps`
  - canonical semver ranges for `eslint`, `typescript`, `vitest`, `prettier`, testing-library, `tailwindcss`, `@tailwindcss/postcss`, and related toolchain packages, pinned in this package’s own **`dependencies`** (so Bun hoists bins/types to workspaces)
  - consumed via `"@helvety/dev-deps": "workspace:*"` in app/package **devDependencies** (enforced by `bun run deps:drift` in `ci:check`); zone apps do not declare Tailwind packages directly
- `@helvety/config`
  - `createHelvetyNextConfig` (base); zone presets `createE2eeZoneNextConfig`, `createPublicToolNextConfig`, `createAuthGatewayNextConfig` (`web` / `store` keep bespoke `createHelvetyNextConfig` overrides)
  - `createSecurityHeaders`
  - shared ESLint/TypeScript/Vitest/PostCSS **config** entrypoints (not pinned toolchain versions; those live in `@helvety/dev-deps`; Vitest resolves testing-library from dev-deps; PostCSS plugin loaded from dev-deps)
- `@helvety/shared`
  - `createAppProxy`, `createProfiledSecurityProxy`, and `SECURITY_PROXY_MATCHER` (canonical `proxy.ts` zone matcher pattern; apps inline the literal per Next.js)
  - auth redirect/callback behavior; **proxy refreshes sessions only** (`refreshSupabaseAuthSession`, including on `createAppProxy` root redirects when `sb-*` cookies are present), verifies with `getClaims()` at the edge, and sets `x-helvety-auth-refreshed` when proxy `setAll` wrote cookies (RSC clients no-op further writes; session mutations use `createServerMutatingClient`) — **authorization uses `getUser()` in Server Components/actions** (often via `getAuthUser` from `@helvety/shared/auth-retry`), never `getSession()` (`bun run consistency:supabase-auth`); **`auth-gateway`**, **`e2ee-app`**, **`store-gateway`**, and **`public-tool`** profiles clear stale `sb-*` cookies when refresh fails (fail-closed); **`public-marketing`** (`web`) does not
  - `@helvety/shared/encrypted-prefetch-api` for vault/list GET routes (`RATE_LIMITS.PREFETCH`, explicit column lists); `bootstrapAuthLayoutSession()` for the auth layout
  - `HELVETY_COOKIE_SIGNING_SECRET` for CSRF/proxy cookie signing (separate from `SUPABASE_SECRET_KEY`; proxy re-issues invalid/stale `csrf_token` cookies)
  - server env validation and Supabase client factories; tiered env factories (`createAppServerUpstashEnv`, `createAppUserScopedE2eeEnv`, `createAppUpstashCookieEnv`, `getValidatedGatewayEnv`); per-app `env.template` parity (`consistency:env-templates`); local/Vercel env ops (`consistency:local-env`, [`env-vercel-audit-checklist.md`](./env-vercel-audit-checklist.md))
  - `auth-session-policy.ts`: unified **24h sliding idle / 7d max** for vault (IndexedDB), device trust (weekly email proof), and PRF salt cache
  - `defineEntityDeleteRegistry` (`entity-delete-message`) for E2EE delete copy
  - `app-product-descriptions` for shared SEO/PWA strings (pdf/image-upscaler re-export via thin `lib/product-copy.ts`)
- `@helvety/ui`
  - auth/encryption gate flow (`EncryptionGate`, `AuthTokenHandler`, `SessionRecovery`)
  - shared navigation/session UX behavior (`create-app-navbar` factories; `E2eeShellRouteLoading` / `HelvetyShellRouteLoading` loading matrix)
  - production `tailwindcss` and `@tailwindcss/postcss` on the zone production dependency graph for Turbopack CSS processing; `@helvety/config/postcss` loads the PostCSS plugin from `@helvety/dev-deps` (versions still canonical in dev-deps; `deps:drift` allows both only on `packages/ui`)

## Multi-zone static assets (`assetPrefix`)

- **Use `assetPrefix` + gateway `*-static` rewrites** when a zone ships a large client bundle under a dedicated path prefix (auth, tasks, contacts, notes, links). The web gateway forwards `/auth-static`, `/tasks-static`, etc. to each deployment.
- **Omit `assetPrefix`** for lighter zones (store, pdf, docs, image-upscaler) that rely on default `/_next/static` under their `basePath`. Add `assetPrefix` only after measuring broken static assets or cache issues in production—not preemptively.

## Completed modernization (2026-05)

- Foundation guardrails and Supabase auth patterns (`consistency:supabase-auth` bans `auth.getSession()` for authorization; admin client call sites documented in `packages/shared/src/supabase/admin.ts`)
- **Next.js App Router:** removed request-header reads from E2EE root pages to avoid forcing dynamic rendering on auth-failure redirects; preserved centralized auth redirect behavior via canonical URL config
- **Cross-zone navigation:** shell **ecosystem** navigation (`AppSwitcher` in `@helvety/ui`) uses **absolute** `urls.*` hrefs so Next.js **`basePath`** on zoned apps does not prefix another app’s path (for example `/auth/pdf` by mistake)
- Entity action export/reorder primitives in `@helvety/shared/entity-action-primitives`
- E2EE URL sync (tasks, notes, contacts, links): `useE2eeEntityPanelWithUrl` + `useSyncE2eeEntityPanelFromUrl`; Links uses `useLinksPanelUrlSync` (`?link=` / `?folder=`); E2EE `app/page.tsx` files wrap dashboards in `<Suspense>`; cross-link editor panels use `dynamic(..., { ssr: false })`
- **React 19 hook/effect hygiene:** synced dashboard selected-item state with live URL search params; timer cleanup in editors; app-local fallback navigation paths (not root-relative); mobile viewport hook via `useSyncExternalStore`
- EncryptionGate redirect intent derivation (fewer effects)
- Hyperspeed React 19 ref-callback mount/dispose; animation timing via `THREE.Timer` (not deprecated `THREE.Clock`); sources under `apps/web/components/vendor/`
- E2EE list hooks: `useEncryptedSortableItems` in `@helvety/ui`; tasks, notes, and contacts list hooks are thin wrappers; hook errors via `reportE2eeHookError` / `reportE2eeActionFailure` (not ad-hoc toast + redirect)
- **TypeScript safety:** removed unsafe double-cast in auth device trust cookie secret handling; reduced Supabase admin helper assertion complexity while keeping typed scoped table usage
- **Proxy matchers:** basePath-mounted apps **inline** the same static pattern as `SECURITY_PROXY_MATCHER` in `@helvety/shared/proxy` (Next.js requires a literal `config.matcher`, not an imported binding) so static `public/` assets (`.mjs` / `.wasm` / `.json` for PDF.js and ONNX) skip the security proxy chain; `ci:check` guardrails enforce parity
- **Vercel Root Directory (ops):** each zone project must use `apps/<slug>` as Root Directory (see [`vercel-monorepo-apps.md`](./vercel-monorepo-apps.md)); `bun run consistency:vercel-apps` enforces identical `vercel.json` and `env.template` headers via `bun run ci:check`
- **CSS chunking:** all apps inherit `experimental.cssChunking: "strict"` from `@helvety/config/next` (`packages/config/next.test.mjs`)
- **Sheet/Dialog a11y:** use `AccessibleSheetHeader` or an explicit `*Description` on every Radix sheet/dialog (`packages/ui`)
- Store product catalog caching via per-request `React.cache()` in `apps/store/lib/data/product-catalog-cache.ts` (not the Next.js `'use cache'` directive)
- Toolchain: TypeScript 6 and ESLint 10 across workspaces (`deps:drift` in `ci:check`)
- UI majors: lucide-react v1 (`icon-renderer` kebab-case map), react-day-picker v10 (`Calendar`), shadcn CLI v4 devDep
- **Dead code:** schedule `bun run deps:unused` quarterly (already in `ci:check`); triage Knip findings before major releases
- **E2EE nested boundaries:** when adding nested entity routes, copy store’s `error.tsx` / `loading.tsx` pattern per segment
- Encrypted prefetch APIs: shared `encrypted-prefetch-api`, `RATE_LIMITS.PREFETCH`, route tests; auth layout uses `bootstrapAuthLayoutSession()`; fail-closed proxy wiring test; `public.docs` on hosted Supabase + `consistency:supabase-schema` (types guardrail)
- **Zone modernization (2026-05):** JSX root layouts; `E2eeShellRouteLoading` matrix; tiered env factories; Next config presets (`createE2eeZoneNextConfig`, `createPublicToolNextConfig`, `createAuthGatewayNextConfig`); navbar factories (`create-app-navbar`); centralized pdf/upscaler product copy; `consistency:zone-modernization` + `zone-*-wiring` Vitest guards; Playwright gateway smoke (`bun run test:e2e`); `bun run scaffold:e2ee-zone` checklist for new E2EE apps

## Verification and guardrails (ongoing)

- Lint, type-check, and tests must stay green; run `bun run ci:check` during development and `bun run ci:release` before push.
- `consistency:env-templates`, `consistency:supabase-auth`, `consistency:zone-modernization`, and shadcn `rsc`/`tsx` enforced in `consistency:guardrails`; add primitives via `packages/ui/components.json`.
- `deps:drift` and `consistency:filenames` run inside `ci:check`; every zone with `proxy.ts` must ship `proxy.test.ts` (`test:hygiene`). New zones: [`app-consistency-checklist.md`](./app-consistency-checklist.md).
- Fail-closed auth refresh on all session-bearing proxy profiles; deprecated E2EE deep-link helpers removed; prefetch/export/pickers use explicit Supabase column lists (`ENCRYPTED_PREFETCH_COLUMNS`, `CONTACT_LINK_PICKER_COLUMNS` for Tasks contact picker, `ENTITY_LINK_COLUMNS` for `entity_links` reads).
- Upstash rate-limit metrics/dashboard enabled in production (not site visitor analytics).
- **Supabase release:** before schema migrations, run Supabase security/performance advisors (Dashboard or MCP) and address critical findings.
