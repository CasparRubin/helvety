# Helvety monorepo naming conventions

This document is the source of truth for how we name and format code across `apps/*` and `packages/*`. Tooling enforces much of this via Prettier, ESLint (including `@typescript-eslint/naming-convention`), and local `ci:check` guardrails.

## References

- **Next.js App Router structure**: [Project structure and file conventions](https://github.com/vercel/next.js/blob/v16.2.6/docs/01-app/01-getting-started/02-project-structure.mdx) - special filenames (`page.tsx`, `layout.tsx`, `route.ts`, `loading.tsx`, `error.tsx`, …), route groups `(segment)`, private folders `_segment`, colocation. The `blob/v…/docs/` path must match the caret minimum in `apps/web` `dependencies.next` (enforced by `bun run consistency:toolchain-docs`).
- **TypeScript identifiers**: [typescript-eslint naming-convention](https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/eslint-plugin/docs/rules/naming-convention.mdx).
- **Tests**: [Vitest - Writing tests](https://vitest.dev/guide/learn/writing-tests) (official docs; default `*.test.*` / `*.spec.*` patterns); use `*.test.ts` / `*.test.tsx` in this repo. The monorepo pins **Vitest 4.x** (see workspace `package.json` files). Shared Vitest and related devDependency specifiers stay identical across workspaces via `scripts/check-workspace-version-drift.mjs` (`bun run deps:drift`, in `ci:check`) plus `bun run test:hygiene` (required `proxy.test.ts` per zone). Public-zone `seo-routes.test.ts` files should use `expectPublicCrawlerRobots` from `@helvety/shared/test-utils/seo-route-test-helpers`.

## Formatting

- **Prettier** at repo root ([`prettier.config.mjs`](../prettier.config.mjs)): double quotes, semicolons, `trailingComma: "es5"`, `printWidth: 80`, `prettier-plugin-tailwindcss` for class order (plugin resolved via `@helvety/dev-deps`).
- Do not duplicate formatting rules in ESLint; `eslint-config-prettier` disables stylistic ESLint rules that conflict with Prettier.

## File and directory names

- **Source modules**: `kebab-case` (`batch-actions.ts`, `helvety-shell-navbar.tsx`, `use-contacts.ts`). Enforced under `apps/*/app`, `apps/*/lib`, `apps/*/components`, `apps/*/hooks`, and `packages/*/src` by `bun run consistency:filenames` (Next.js reserved names exempt).
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
- **`lib/product-copy.ts`** (where used): **`pdf`** and **`image-upscaler`** re-export **`PDF_*`** / **`IMAGE_UPSCALER_*`** constants from `@helvety/shared/app-product-descriptions` (canonical strings live in shared; local file is for tests and manifest wiring). **`docs`** keeps **`DOCS_PWA_MANIFEST_DESCRIPTION`** locally when the PWA string differs from metadata.
- **`public/manifest.json` `description`** (PWA install prompt): often matches the metadata string; when it must be shorter, use an explicit **`AUTH_PWA_MANIFEST_DESCRIPTION`** in `app/layout.tsx`, or **`PDF_PWA_MANIFEST_DESCRIPTION`** / **`IMAGE_UPSCALER_PWA_MANIFEST_DESCRIPTION`** in `lib/product-copy.ts`, and keep the JSON identical. **`bun run consistency:install-manifest-metadata`** ([`scripts/check-install-manifest-metadata.mjs`](../scripts/check-install-manifest-metadata.mjs)) fails if manifests drift from those constants (or from exported layout strings for apps without a separate PWA field).
- **JSON-LD** (`jsonLdGraphTail` `SoftwareApplication` / `WebApplication` `description`): prefer the **same** string as **`metadata.description`** where possible (avoids drift; `app/layout-metadata.test.ts` locks this). Example: PDF uses **`PDF_APP_DESCRIPTION`** for metadata and JSON-LD, while **`PDF_PWA_MANIFEST_DESCRIPTION`** is only for **`public/manifest.json`**. If JSON-LD and metadata must diverge, add **`*_JSON_LD_DESCRIPTION`** (or similarly explicit name) and document why both exist.
- **`public/llms.txt`**: the `>` tagline is a hand-maintained crawler summary (company/product positioning only). Put license terms under **`## Licensing`** using `HELVETY_LLMS_LICENSING_NOTE` from `@helvety/shared/licensing`. Include **`## Crawling And Indexing`** (indexable vs noindex/auth-gated intent for agents). Gateway `apps/web/public/llms.txt` links per-zone guides under **`## Agent And Crawler Guides`**. Vitest enforces em-dashes, a license-free tagline, crawling section, and licensing (`store-copy-guardrails.test.ts`). Indexable zones list `llms.txt` in sitemaps via `createAppSitemap` / gateway sitemap.
- **Robots and AI crawlers**: public zones use `createOpenRobots` / `createAppRobots` from `@helvety/shared/seo` (explicit allow for `*` and `AI_DISCOVERY_USER_AGENTS`). Private E2EE zones use `createPrivateAppRobots` (disallow `/` for the same agents). `llms.txt` is optional for Google Search but recommended for agentic discovery; metadata still uses `createHelvetyProductMetadata` (`indexing: "all" | "none"`, `googleBot` large previews).
- **Gateway default document title**: `HELVETY_WEB_DEFAULT_TITLE` in `@helvety/shared/licensing` (used by `apps/web/app/layout.tsx` when no page overrides the title). Do not change this constant unless product marketing explicitly requests a new default title.

## Customer-facing product copy (Store and apps)

Layered copy avoids repeating the same paragraph on a product page and across surfaces:

| Layer                  | Source                                                                                                                                                                                                     | Purpose                                                                                                                                                         |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Store catalog card** | `packages/shared/src/store-catalog.ts` → `shortDescription`                                                                                                                                                | One or two plain sentences: what it is and the main benefit. Shown on Store listing cards, the product detail hero, and OG when the Store owns the page.        |
| **About intro**        | `apps/store/lib/data/products.ts` → `description.intro`                                                                                                                                                    | Who it is for and what changes day to day. Must **not** duplicate the card opening (tests enforce separation).                                                  |
| **About sections**     | `products.ts` → `description.sections`                                                                                                                                                                     | Install steps, limits, privacy, optional “how it works”. Plain language; jargon only when needed.                                                               |
| **App SEO / PWA**      | `app/layout.tsx`, `lib/product-copy.ts`, `public/manifest.json`                                                                                                                                            | Metadata and install prompt; align verbs and claims with the Store card where they describe the same product.                                                   |
| **Extension manifest** | [`power-platform-configurator-browser-extension-chromium`](https://github.com/CasparRubin/power-platform-configurator-browser-extension-chromium) + `power-platform-configurator-copy.ts` `PUBLIC_SUMMARY` | Shortest installed-extension blurb only; not the Store About body. Public install is the Chrome Web Store (`POWER_PLATFORM_CONFIGURATOR_CHROME_WEB_STORE_URL`). |

**Style:** easy to scan, human tone. **No em-dashes (U+2014)** in user-facing copy; use commas, periods, or parentheses instead. Enforced by `bun run consistency:customer-copy` and Vitest (`assertNoEmDashInCustomerCopy`).

**Copy voice (customer-facing):**

| Topic                   | Standard                                                                                                                                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Product names           | `Helvety Tasks`, `Helvety Contacts`, `Helvety Notes`, `Helvety Links`, … (title case; full name on first mention in a block)                                                                      |
| Encryption (E2EE apps)  | Prefer **encrypted on your device before storage** in short UI; reserve **end-to-end encrypted** for legal/privacy and detailed dialogs                                                           |
| Encryption (non-E2EE)   | State **browser-local** / **not sent to Helvety** for local-only flows; never imply full-app E2EE for PDF, Image Upscaler, Store, gateway, or Docs local editing                                  |
| Encryption (Docs vault) | Optional vault save only: **encrypted on your device before storage**; local `.docx` editing needs no account; do not describe Docs as a full E2EE app like Tasks/Contacts/Notes/Links            |
| Company values          | **Private, simple, clean.** (`HELVETY_COMPANY_VALUES_TAGLINE`); lead gateway SEO with this where it fits                                                                                          |
| Swiss origin            | SEO / About closings: **Engineered, designed and made in Switzerland.** (`HELVETY_SWISS_ORIGIN_SEO`); compact PWA lines may use **Swiss-built.** (`HELVETY_SWISS_BUILT_SUFFIX`)                   |
| SEO / PWA / AI taglines | Product value first; **do not** mention AGPL, “open source”, or repo-wide license claims (see `assertLicenseFreeSeoCopy` in tests)                                                                |
| Open-source licensing   | **AGPL-3.0** only on Store product About copy, legal pages, `llms.txt` **`## Licensing`**, and `HELVETY_FREE_AGPL_*` store bullets; never MIT or generic “free and open source” in those surfaces |
| Sentence shape          | Short, active voice; one idea per sentence                                                                                                                                                        |
| Navbar About            | `@helvety/shared/app-navbar-about` (`*_NAVBAR_ABOUT`, `E2EE_NAVBAR_ENCRYPTION_TOOLTIP`); global About dialog in `HelvetyShellNavbar` adds attribution only (no license paragraph)                 |

**Sync order when product behavior or claims change:** `store-catalog.ts` → `products.ts` → `power-platform-configurator-copy.ts` (manifest summary, Chrome Web Store URL, store card suffix) → app metadata / manifests → `llms.txt` → app `README.md` intros → legal pages if claims shift (see `docs/legal-change-guardrails.md`).

**Helvety Docs theme (maintainers):** when changing shared palette tokens, update `packages/ui/globals.css`, then `apps/docs/lib/docx-editor-theme-tokens.ts` and `apps/docs/styles/docx-editor-helvety-bridge.css`, and run `cd apps/docs && bun run test -- lib/docx-editor-theme.test.ts lib/docx-editor-theme-tokens.test.ts`. Keep `apps/docs/README.md` and `apps/docs/public/llms.txt` in sync if user-visible theme or Eigenpal chrome behavior changes (Helvety command bar above Eigenpal title/formatting toolbar rows, visible File/Format/Insert vs hidden Help/doc icon/vendor Open-Save-New, per-row toolbar borders, overlay contrast in light and dark, white page in both themes).

### Retired Power Platform Configurator slugs (forbidden in copy)

Three legacy browser-extension listings were merged into **Power Platform Configurator** (`helvety-power-platform-configurator`). Public install is the Chrome Web Store only; the retired download package id `power-platform-configurator` (Supabase ZIP sideload) is rejected server-side (404) like legacy `power-automate-*` ids. Retired store slugs and package ids (`helvety-power-automate-force-v3-false`, `helvety-power-automate-editor-preference`, `helvety-power-automate-editor-version-enforcer`, `power-platform-configurator`, and matching `power-automate-*` download paths) must **not** appear in customer-facing copy, catalog data, or legal text except in the allowlist below. They may appear only in:

- [`apps/store/lib/packages/create-package-download.test.ts`](../apps/store/lib/packages/create-package-download.test.ts) (asserts download signing rejects legacy package ids)
- [`packages/shared/src/retired-power-platform-extension-naming.ts`](../packages/shared/src/retired-power-platform-extension-naming.ts) (canonical forbidden-pattern registry for tests)
- [`apps/store/lib/packages/config.test.ts`](../apps/store/lib/packages/config.test.ts) (negative assertions for removed package ids)
- [`docs/naming-conventions.md`](naming-conventions.md) (this section; lists retired slugs for contributors)

**Microsoft “Power Automate”** in descriptions, keywords, and host names refers to the vendor product the extension configures, not the old Helvety product title. Forbidden patterns and the allowlist live in [`packages/shared/src/retired-power-platform-extension-naming.ts`](../packages/shared/src/retired-power-platform-extension-naming.ts); **`bun run consistency:project-naming`** ([`scripts/verify-project-naming.mjs`](../scripts/verify-project-naming.mjs)) imports that module repo-wide.

**Regression tests:** `@helvety/shared/customer-copy-guardrails` lists user-facing copy paths; `customer-copy-em-dash.test.ts`, `store-copy-guardrails.test.ts`, `seo-customer-copy.test.ts`, and per-app `layout-metadata.test.ts` files use **`assertNoEmDashInCustomerCopy`**, **`assertLicenseFreeSeoCopy`**, and **`assertSwissOriginInSeoCopy`** from `@helvety/shared/test-utils/customer-copy-test-helpers`. **`bun run consistency:customer-copy`** scans user-facing files and app UI `.tsx` for U+2014 em-dashes; **`bun run consistency:install-manifest-metadata`** keeps PWA `manifest.json` descriptions aligned with shared SEO constants.

- **Root README and root `package.json` `description`**: describe this repository as **helvety.com web applications** (Next.js path zones and shared packages). Do not imply that every Helvety product line (browser extensions, SPFx, WinUI tools, and so on) is developed or released only from this tree; the README overview already points at separately distributed software and the Store.

## User-visible errors (product copy)

- **Canonical generic line** for unknown failures (server actions, API JSON, toasts, error-boundary titles): export **`GENERIC_USER_ERROR`** from [`@helvety/shared/user-facing-errors`](../packages/shared/src/user-facing-errors.ts). Do not duplicate the string literal across apps.
- **Rate-limit messages** shown to users: build with **`buildRateLimitedUserMessage`** from the same module (used by `authenticateAndRateLimit`, auth/store flows, and the store public download route where applicable).
- **Unexpected `catch` in server actions** (after auth/business logic): prefer **`unexpectedActionError(scope, error)`** from [`@helvety/shared/server-action-primitives`](../packages/shared/src/server-action-primitives.ts) so logging and the generic user response stay aligned.
- **Read / list failures** the user should understand as “data did not arrive”: prefer **`Failed to load …`** (not “get” or “fetch”) in action responses, `app/api/**` routes, and hook fallbacks so wording matches end-to-end.

## Environment variables

- **Client-exposed**: `NEXT_PUBLIC_*` (Supabase URL/key, etc.).
- **Server-only secrets and URLs**: `UPPER_SNAKE_CASE` without `NEXT_PUBLIC_`.
- **Per-zone tiers** (which keys each app validates at startup): root [`README.md`](../README.md) § Environment Model, [`turbo-env-tiers.md`](./turbo-env-tiers.md), [`env-vercel-audit-checklist.md`](./env-vercel-audit-checklist.md), and each `apps/<zone>/env.template` (enforced by `bun run consistency:env-templates`; local `.env.local` parity via `bun run consistency:local-env`). `SUPABASE_SECRET_KEY` is required only on **admin-tier** zones (`auth`, `store`); E2EE vault zones and Docs use the user-scoped client + RLS instead.

## Workspace packages

- **Package name**: `@helvety/<short-name>` in `package.json`.
- **Public export subpaths** (e.g. `@helvety/ui`): **kebab-case** matching the file stem (`./command-bar` → `command-bar.tsx`).

## Lucide icon names (E2EE seed data)

- Category, stage, and label configs store **kebab-case** icon strings (for example `check-circle`, `flask-conical`). They resolve at runtime via `@helvety/ui/icon-renderer` (`getLucideIcon`).
- **lucide-react v1** removed brand icons. Use supported Lucide names in seed data only; unknown names fall back to `circle` at runtime (`getLucideIcon`).
- Navbar chrome and the app switcher import Lucide components directly; do not assume every surface uses `icon-renderer`.

## Imports

- Follow `@helvety/config` ESLint `import-x/order`: builtins → external → internal (`@/**`) → parent/sibling, blank lines between groups, alphabetical.

## Cross-app boundaries

- Apps must not import from other apps; share code through `@helvety/shared` or `@helvety/ui` (enforced by `no-restricted-imports` in app ESLint config).

## See also

- Root monorepo overview and `ci:check` / `ci:release`: [`README.md`](../README.md)
- Per-app zone checklist: [`app-consistency-checklist.md`](./app-consistency-checklist.md)
