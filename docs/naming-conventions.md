# Helvety monorepo naming conventions

This document is the source of truth for how we name and format code across `apps/*` and `packages/*`. Tooling enforces much of this via Prettier, ESLint (including `@typescript-eslint/naming-convention`), and CI guardrails.

## References

- **Next.js App Router structure**: [Project structure and file conventions](https://github.com/vercel/next.js/blob/v16.2.6/docs/01-app/01-getting-started/02-project-structure.mdx) - special filenames (`page.tsx`, `layout.tsx`, `route.ts`, `loading.tsx`, `error.tsx`, …), route groups `(segment)`, private folders `_segment`, colocation. The `blob/v…/docs/` path must match the caret minimum in `apps/web` `dependencies.next` (enforced by `bun run consistency:toolchain-docs`).
- **TypeScript identifiers**: [typescript-eslint naming-convention](https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/eslint-plugin/docs/rules/naming-convention.mdx).
- **Tests**: [Vitest - test files](https://github.com/vitest-dev/vitest/blob/main/docs/guide/learn/writing-tests.md) - use `*.test.ts` / `*.test.tsx`. The monorepo pins **Vitest 4.x** (see workspace `package.json` files). Shared Vitest and related devDependency specifiers stay identical across workspaces via `scripts/check-workspace-version-drift.mjs` (`bun run deps:drift`) plus `bun run test:hygiene`.

## Formatting

- **Prettier** at repo root ([`.prettierrc`](../.prettierrc)): double quotes, semicolons, `trailingComma: "es5"`, `printWidth: 80`, `prettier-plugin-tailwindcss` for class order.
- Do not duplicate formatting rules in ESLint; `eslint-config-prettier` disables stylistic ESLint rules that conflict with Prettier.

## File and directory names

- **Source modules**: `kebab-case` (`batch-actions.ts`, `helvety-shell-navbar.tsx`, `use-contacts.ts`).
- **Next.js reserved names**: exact names required by the framework (`page.tsx`, `layout.tsx`, `route.ts`, `template.tsx`, `default.tsx`, `opengraph-image.tsx`, …).
- **Server actions**: prefer dedicated files under `app/actions/` named `*-actions.ts` with `"use server"` at the top; colocated actions next to a route use the same `*-actions.ts` pattern (e.g. `logout-actions.ts` beside `logout/page.tsx`).
- **Tests**: prefer `**/*.test.ts`, `**/*.test.tsx`.

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

- Primary **metadata `description`** for an app (used in `createHelvetyProductMetadata`, Open Graph, Twitter, tests): export **`{APP|PRODUCT}_*DESCRIPTION`** or **`WEB_SITE_DESCRIPTION`** for the gateway; suffix **`_DESCRIPTION`**, not `_DESCRIPTION_COPY`. Example: **`AUTH_DESCRIPTION`**, **`CONTACTS_APP_DESCRIPTION`**, **`STORE_DESCRIPTION`** (see each `app/layout.tsx`).
- **`lib/product-copy.ts`** (where used): holds long-form **`PDF_APP_DESCRIPTION`**, **`IMAGE_UPSCALER_APP_DESCRIPTION`**, and related limits copy; layouts import these for metadata / JSON-LD.
- **`public/manifest.json` `description`** (PWA install prompt): often matches the metadata string; when it must be shorter, use an explicit **`AUTH_PWA_MANIFEST_DESCRIPTION`** in `app/layout.tsx`, or **`PDF_PWA_MANIFEST_DESCRIPTION`** / **`IMAGE_UPSCALER_PWA_MANIFEST_DESCRIPTION`** in `lib/product-copy.ts`, and keep the JSON identical. **`bun run consistency:install-manifest-metadata`** ([`scripts/check-install-manifest-metadata.mjs`](../scripts/check-install-manifest-metadata.mjs)) fails if manifests drift from those constants (or from exported layout strings for apps without a separate PWA field).
- **JSON-LD** (`jsonLdGraphTail` `SoftwareApplication` / `WebApplication` `description`): prefer the **same** string as **`metadata.description`** where possible (avoids drift; `app/layout-metadata.test.ts` locks this). Example: PDF uses **`PDF_APP_DESCRIPTION`** for metadata and JSON-LD, while **`PDF_PWA_MANIFEST_DESCRIPTION`** is only for **`public/manifest.json`**. If JSON-LD and metadata must diverge, add **`*_JSON_LD_DESCRIPTION`** (or similarly explicit name) and document why both exist.
- **`public/llms.txt`**: opening summary lines are hand-maintained crawler hints; keep factual claims aligned with runtime and with legal/product copy whenever behavior or eligibility changes (no automated check today).

## Customer-facing product copy (Store and apps)

Layered copy avoids repeating the same paragraph on a product page and across surfaces:

| Layer                  | Source                                                                    | Purpose                                                                                                                                                  |
| ---------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Store catalog card** | `packages/shared/src/store-catalog.ts` → `shortDescription`               | One or two plain sentences: what it is and the main benefit. Shown on Store listing cards, the product detail hero, and OG when the Store owns the page. |
| **About intro**        | `apps/store/lib/data/products.ts` → `description.intro`                   | Who it is for and what changes day to day. Must **not** duplicate the card opening (tests enforce separation).                                           |
| **About sections**     | `products.ts` → `description.sections`                                    | Install steps, limits, privacy, optional “how it works”. Plain language; jargon only when needed.                                                        |
| **App SEO / PWA**      | `app/layout.tsx`, `lib/product-copy.ts`, `public/manifest.json`           | Metadata and install prompt; align verbs and claims with the Store card where they describe the same product.                                            |
| **Extension manifest** | External repo + `power-automate-editor-enforcer-copy.ts` `PUBLIC_SUMMARY` | Shortest installed-extension blurb only; not the Store About body.                                                                                       |

**Style:** easy to scan, human tone. **No em-dashes (U+2014)** in user-facing copy; use commas, periods, or parentheses instead. Enforced by `bun run consistency:customer-copy` and Vitest (`assertNoEmDashInCustomerCopy`).

**Copy voice (customer-facing):**

| Topic                  | Standard                                                                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Product names          | `Helvety Tasks`, `Helvety Contacts`, … (title case; full name on first mention in a block)                                              |
| Encryption (E2EE apps) | Prefer **encrypted on your device before storage** in short UI; reserve **end-to-end encrypted** for legal/privacy and detailed dialogs |
| Encryption (non-E2EE)  | State **browser-local** / **not sent to Helvety**; never imply E2EE for PDF, Image Upscaler, Store, gateway                             |
| Swiss origin           | SEO: **Swiss-built**; navbar About closings: **Built in Switzerland.**                                                                  |
| Open source            | **AGPL-3.0** via `@helvety/shared/licensing` constants; never MIT or generic “free and open source”                                     |
| Sentence shape         | Short, active voice; one idea per sentence                                                                                              |
| Navbar About           | `@helvety/shared/app-navbar-about` (`*_NAVBAR_ABOUT`, `E2EE_NAVBAR_ENCRYPTION_TOOLTIP`)                                                 |

**Sync order when product behavior or claims change:** `store-catalog.ts` → `products.ts` → app metadata / manifests → `llms.txt` → app `README.md` intros → legal pages if claims shift (see `docs/legal-change-guardrails.md`).

**Regression tests:** `@helvety/shared/customer-copy-guardrails` lists user-facing copy paths; `customer-copy-em-dash.test.ts`, `store-copy-guardrails.test.ts`, and app tests call **`assertNoEmDashInCustomerCopy`**. **`bun run consistency:customer-copy`** scans user-facing files and app UI `.tsx` for U+2014 em-dashes.

- **Root README and root `package.json` `description`**: describe this repository as **helvety.com web applications** (Next.js path zones and shared packages). Do not imply that every Helvety product line (browser extensions, SPFx, WinUI tools, and so on) is developed or released only from this tree; the README overview already points at separately distributed software and the Store.

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
