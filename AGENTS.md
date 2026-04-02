# Agent memory (Helvety)

## Learned User Preferences

- After substantive auth or flow changes, run a verification pass and remove stale or unused code before treating the work as done.
- When login or security behavior changes, keep READMEs, code comments, and user-facing legal copy aligned with the implementation.
- Run full pre-deploy checks via root `ci:release` (format-check, lint, type-check, test, build). Use `ci:check` when a build is not needed (it omits `build`).
- Prefer fixing consistency and correctness within the current architecture over large rewrites unless product requirements call for a different shape.
- Do not add AI co-author or similar attribution trailers to git commits.

## Learned Workspace Facts

- Next.js 16 apps here use `proxy.ts` (not `middleware.ts`) for lightweight request handling (`createSecurityProxy`: CSP, CSRF bootstrap, and Supabase auth cookie refresh when `sb-*` session cookies are present). Treat authentication as defense-in-depth in server actions, route handlers, and pages.
- For failures from `catch` or API error objects, prefer `logger.logUnexpectedError(scope, error, context?)` from `@helvety/shared/logger` over `logger.error("message", error)` so production error tracking uses `captureException` (string-first `logger.error` routes to `captureMessage`). Keep `logger.error(message, { ... })` when logging structured metadata without a primary `Error`.
- Vitest mocks of `@helvety/shared/logger` must expose `logUnexpectedError` (and `warn` / `error` when the module under test calls them); assert `logUnexpectedError` with `toHaveBeenCalledWith(scope, …)` where logging is part of the contract. Route handlers that only use `logger.warn` do not need a `logUnexpectedError` stub.
- Use `isUuidString` from `@helvety/shared/uuid-string` for fast ID parameter checks in server actions; keep Zod `.uuid()` on payloads where schemas already validate full objects. `entity-links` shares the same UUID rules via that helper.
- `packages/config/eslint.mjs` exports `createEslintConfig` / `createPackageEslintConfig` for apps and packages, and a **default** flat config so `eslint --config eslint.mjs .` lints the config package itself (with `tsconfig.json` including `vitest.server-only-mock.ts`).
- Auth login UI maps steps via `apps/auth/lib/login-flow-stepper.ts`; server-driven next-step after OTP and in callback flows uses `apps/auth/lib/auth-step.ts` (`resolveAuthStep`) from passkey and encryption readiness.
- Login OTP length and validation are centralized in `apps/auth/lib/otp-code.ts` (6–8 digits) and kept aligned with `otp-actions`.
- Passkey presence for login bootstrap must use the same trusted read path as OTP and callback flows (`user_auth_credentials` via scoped admin where RLS blocks ordinary client reads).
- This monorepo uses Bun and Turbo for scripts; `apps/auth` unit tests cover stepper helpers, auth-step resolution, and related actions.
- Batch reorder and encrypted export row caps for **tasks**, **notes**, and **contacts** server actions use `ACTION_LIMITS` from `@helvety/shared/constants`—keep those limits defined in one place.
- **`@helvety/ui`** has Vitest coverage for selected primitives (e.g. `Button`, `tiptap-utils`); run `bun run test --filter=@helvety/ui` from the repo root.
- Store **account deletion** post-delete verification queries live in `apps/store/lib/account-deletion-verification.ts` (consumed by `account-actions`); unit tests mock the admin client.
- **`hasAccountDeletionVerificationFailures`** is covered for `residualRows`, `residualErrors`, and `authStillExists`; contact **`reorderContacts`** tests assert Zod rejects payloads over `ACTION_LIMITS.MAX_REORDER_ITEMS` so server-action caps stay aligned with `@helvety/shared/constants`.
- **`jsdoc/require-jsdoc`** is turned off for specific **link** actions/hooks/panels and **PDF pipeline** files via glob overrides in `packages/config/eslint.mjs`—prefer that over file-wide `eslint-disable` when adding similar modules.
- Vitest `test:coverage` scripts require `@vitest/coverage-v8` (declared in the root `package.json` devDependencies so it hoists to all workspaces); keep Vitest and `@vitest/coverage-v8` on the same minor line (e.g. 4.1.x) to satisfy peer ranges.
- Root `deps:check` runs Knip for unused files and dependency analysis; `knip.json` uses the Knip 6 schema.
- Contacts main list (`ContactList`) shows all fixed category sections even when the address book is empty, matching Tasks list behavior for built-in stages (`EntityList`); Notes uses the same `EntityList` pattern but the dashboard passes no stages, so the notes list is flat unless that is wired later.
