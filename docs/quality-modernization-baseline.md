# Quality Modernization Baseline

## Baseline Status

- `bun run lint`: passing at workspace scope
- `bun run type-check`: passing at workspace scope
- `bun run test`: passing at workspace scope

## Shared Contracts To Preserve

- `@helvety/config`
  - `createHelvetyNextConfig`
  - `createSecurityHeaders`
  - shared ESLint/TS policy entrypoints
- `@helvety/shared`
  - `createAppProxy`, `createProfiledSecurityProxy`, and `SECURITY_PROXY_MATCHER` (canonical `proxy.ts` zone matcher pattern; apps inline the literal per Next.js)
  - auth redirect/callback behavior; **proxy refreshes sessions only — authorization uses `getUser()` in Server Components/actions (often via `getAuthUser` from `@helvety/shared/auth-retry`), never `getSession()`** (`bun run consistency:supabase-auth`)
  - `HELVETY_COOKIE_SIGNING_SECRET` for CSRF/proxy cookie signing (separate from `SUPABASE_SECRET_KEY`; proxy re-issues invalid/stale `csrf_token` cookies)
  - server env validation and Supabase client factories
- `@helvety/ui`
  - auth/encryption gate flow (`EncryptionGate`, `AuthTokenHandler`, `SessionRecovery`)
  - shared navigation/session UX behavior

## Phase Success Criteria

1. **Config/shared foundation** — done
   - `consistency:supabase-auth` bans `auth.getSession()` for authorization; admin client call sites documented in `packages/shared/src/supabase/admin.ts`; Upstash rate-limit analytics enabled in production.
2. **App router/fetch** — done (store catalog)
   - Store static catalog uses per-request `React.cache()` via `apps/store/lib/data/product-catalog-cache.ts` (not the Next.js `'use cache'` directive; dedupes metadata + page reads within one RSC render).
3. **Hook correctness** — done
   - `useE2eeEntityPanelWithUrl` (tasks, notes, contacts) and links `useLinksPanelUrlSync` (`?link=` / `?folder=`) for shareable E2EE detail-sheet deep links.
4. **Domain hardening** — done
   - Shared export/reorder helpers in `@helvety/shared/entity-action-primitives`.
5. **E2EE convergence** — done (URL-synced sheets)
   - Tasks/notes/contacts use `useE2eeEntityPanelWithUrl`; links keeps discriminated link/folder panel state with `useLinksPanelUrlSync` and the same `E2eeEntityDetailSheet` shell.
6. **Verification/guardrails** — ongoing
   - Lint/type-check/tests must stay green; `consistency:supabase-auth` and shadcn `rsc`/`tsx` enforced in `consistency:guardrails`; add primitives via `packages/ui/components.json`.

## Multi-zone static assets (`assetPrefix`)

- **Use `assetPrefix` + gateway `*-static` rewrites** when a zone ships a large client bundle under a dedicated path prefix (auth, tasks, contacts, notes, links). The web gateway forwards `/auth-static`, `/tasks-static`, etc. to each deployment.
- **Omit `assetPrefix`** for lighter zones (store, pdf, image-upscaler) that rely on default `/_next/static` under their `basePath`. Add `assetPrefix` only after measuring broken static assets or cache issues in production—not preemptively.

## Completed modernization (2026-05)

- Foundation guardrails and Supabase auth patterns
- Entity action export/reorder primitives
- E2EE URL sync (tasks, notes, contacts, links)
- EncryptionGate redirect intent derivation (fewer effects)
- Hyperspeed React 19 ref-callback mount/dispose
- Store product catalog caching
