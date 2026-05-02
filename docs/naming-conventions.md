# Helvety monorepo naming conventions

This document is the source of truth for how we name and format code across `apps/*` and `packages/*`. Tooling enforces much of this via Prettier, ESLint (including `@typescript-eslint/naming-convention`), and CI guardrails.

## References

- **Next.js App Router structure**: [Project structure and file conventions](https://github.com/vercel/next.js/blob/v16.2.2/docs/01-app/01-getting-started/02-project-structure.mdx) — special filenames (`page.tsx`, `layout.tsx`, `route.ts`, `loading.tsx`, `error.tsx`, …), route groups `(segment)`, private folders `_segment`, colocation.
- **TypeScript identifiers**: [typescript-eslint naming-convention](https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/eslint-plugin/docs/rules/naming-convention.mdx).
- **Tests**: [Vitest — test files](https://github.com/vitest-dev/vitest/blob/main/docs/guide/learn/writing-tests.md) — we standardize on `*.test.ts` / `*.test.tsx` (not `*.spec.*`).

## Formatting

- **Prettier** at repo root ([`.prettierrc`](../.prettierrc)): double quotes, semicolons, `trailingComma: "es5"`, `printWidth: 80`, `prettier-plugin-tailwindcss` for class order.
- Do not duplicate formatting rules in ESLint; `eslint-config-prettier` disables stylistic ESLint rules that conflict with Prettier.

## File and directory names

- **Source modules**: `kebab-case` (`batch-actions.ts`, `helvety-shell-navbar.tsx`, `use-contacts.ts`).
- **Next.js reserved names**: exact names required by the framework (`page.tsx`, `layout.tsx`, `route.ts`, `template.tsx`, `default.tsx`, `opengraph-image.tsx`, …).
- **Server actions**: prefer dedicated files under `app/actions/` named `*-actions.ts` with `"use server"` at the top; colocated actions next to a route use the same `*-actions.ts` pattern (e.g. `logout-actions.ts` beside `logout/page.tsx`).
- **Tests**: only `**/*.test.ts`, `**/*.test.tsx` (matches Vitest defaults and keeps one pattern).

## TypeScript and React symbols

- **Types / interfaces / enums**: `PascalCase`. Do not prefix interfaces with `I` (e.g. `User`, not `IUser`).
- **Type parameters**: `PascalCase`; prefer a single letter `T` or a descriptive name (`TEntity`, `RowId`).
- **Variables and functions**: `camelCase`. **Constants** (including module-level config) may use `UPPER_SNAKE_CASE` when they are truly fixed literals or frozen config objects.
- **React components** (functions or consts holding JSX): `PascalCase` in code; file name remains `kebab-case.tsx`.
- **Hooks**: name is `useSomething`; file is `use-something.ts` (or `use-something.tsx` if it returns JSX).

## App Router pages and layouts

- Root **`app/page.tsx`**: default export function named **`Page`** (async when needed).
- **`app/layout.tsx`**: default export named **`RootLayout`** (matches common Next examples).
- **Nested routes** may use descriptive names (e.g. `ImpressumPage` on `app/impressum/page.tsx`).

## Metadata and copy constants

- Primary **metadata `description`** string for an app (used in `createHelvetyProductMetadata` and tests): export or file-local name **`{APP|PRODUCT}_DESCRIPTION`** or **`WEB_SITE_DESCRIPTION`** for the gateway — suffix **`_DESCRIPTION`**, not `_DESCRIPTION_COPY`.
- **Product one-liners** in `lib/product-copy.ts`: same pattern, e.g. `PDF_APP_DESCRIPTION`, `IMAGE_UPSCALER_APP_DESCRIPTION`.
- **JSON-LD** (`jsonLdGraphTail` `SoftwareApplication` / `WebApplication` `description`): prefer the **same** exported string as metadata when the copy can stay aligned (avoids drift; `app/layout-metadata.test.ts` asserts one source — e.g. PDF uses `PDF_APP_DESCRIPTION` for both today). If metadata and structured-data copy must diverge, add a second app-scoped constant with an explicit name (e.g. `*_JSON_LD_DESCRIPTION`) and document why both exist in the app README or layout comment.

## User-visible errors (product copy)

- **Canonical generic line** for unknown failures (server actions, API JSON, toasts, error-boundary titles): export **`GENERIC_USER_ERROR`** from [`@helvety/shared/user-facing-errors`](../packages/shared/src/user-facing-errors.ts). Do not duplicate the string literal across apps.
- **Rate-limit messages** shown to users: build with **`buildRateLimitedUserMessage`** from the same module (used by `authenticateAndRateLimit`, auth/store flows, and the store public download route where applicable).
- **Unexpected `catch` in server actions** (after auth/business logic): prefer **`unexpectedActionError(scope, error)`** from [`@helvety/shared/server-action-primitives`](../packages/shared/src/server-action-primitives.ts) so logging and the generic user response stay aligned.
- **Read / list failures** the user should understand as “data did not arrive”: prefer **`Failed to load …`** (not “get” or “fetch”) in action responses, `app/api/**` routes, and hook fallbacks so wording matches end-to-end.

## Environment variables

- **Client-exposed**: `NEXT_PUBLIC_*` (Supabase URL/key, etc.).
- **Server-only secrets and URLs**: `UPPER_SNAKE_CASE` without `NEXT_PUBLIC_`.

## Workspace packages

- **Package name**: `@helvety/<short-name>` in `package.json`.
- **Public export subpaths** (e.g. `@helvety/ui`): **kebab-case** matching the file stem (`./command-bar` → `command-bar.tsx`).

## Imports

- Follow `@helvety/config` ESLint `import-x/order`: builtins → external → internal (`@/**`) → parent/sibling, blank lines between groups, alphabetical.

## Cross-app boundaries

- Apps must not import from other apps; share code through `@helvety/shared` or `@helvety/ui` (enforced by `no-restricted-imports` in app ESLint config).

## See also

- Root monorepo overview and CI: [`README.md`](../README.md)
