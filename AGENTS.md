# Agent memory (Helvety)

## Learned User Preferences

- After substantive auth or flow changes, run a verification pass and remove stale or unused code before treating the work as done.
- When login or security behavior changes, keep READMEs, code comments, and user-facing legal copy aligned with the implementation.
- Run full pre-deploy checks (lint, format, type-check, test, build); root `ci:check` is format-check plus lint, type-check, and test only—add build explicitly when a release build is required.
- Prefer fixing consistency and correctness within the current architecture over large rewrites unless product requirements call for a different shape.
- Do not add AI co-author or similar attribution trailers to git commits.

## Learned Workspace Facts

- Next.js 16 apps here use `proxy.ts` (not `middleware.ts`) for lightweight request handling; treat authentication as defense-in-depth in server actions, route handlers, and pages.
- Auth login UI maps steps via `apps/auth/lib/login-flow-stepper.ts`; server-driven next-step after OTP and in callback flows uses `apps/auth/lib/auth-step.ts` (`resolveAuthStep`) from passkey and encryption readiness.
- Login OTP length and validation are centralized in `apps/auth/lib/otp-code.ts` (6–8 digits) and kept aligned with `otp-actions`.
- Passkey presence for login bootstrap must use the same trusted read path as OTP and callback flows (`user_auth_credentials` via scoped admin where RLS blocks ordinary client reads).
- This monorepo uses Bun and Turbo for scripts; `apps/auth` unit tests cover stepper helpers, auth-step resolution, and related actions.
- Vitest `test:coverage` scripts require `@vitest/coverage-v8` (declared in the root `package.json` devDependencies so it hoists to all workspaces).
