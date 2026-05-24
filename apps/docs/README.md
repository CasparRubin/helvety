# Helvety Docs

Browser-based `.docx` editor with optional encrypted vault save.

**App URL:** <https://helvety.com/docs>  
**Monorepo path:** `apps/docs`  
**Local dev port:** `3010` (via gateway: <http://localhost:3001/docs>)

## Key Features

- Root `app/layout.tsx` composes `@helvety/ui/helvety-public-shell-root-layout` (`overflow-main`; the shell injects `HelvetyThemeInitScript` in `<head>`). The layout calls `bootstrapE2eeLayoutSession()` and wraps the shell in `CSRFProvider` plus `EncryptionProvider` (vault save uses the same passkey-derived keys as Tasks/Notes). That session also feeds the navbar user snapshot (`<Navbar initialUser={initialUser} />`). The main editor route stays public (no full-app `EncryptionGate`). `app/page.tsx` calls `bootstrapPublicLayoutUser()` for the vault sheet’s `initialUser` prop and the navbar.
- SEO description: `DOCS_APP_DESCRIPTION` in `@helvety/shared/app-product-descriptions` (used by `app/layout.tsx` metadata and JSON-LD). [`lib/product-copy.ts`](./lib/product-copy.ts) re-exports that constant for tests and defines `DOCS_PWA_MANIFEST_DESCRIPTION` for [`public/manifest.json`](./public/manifest.json) (verified by root `bun run consistency:install-manifest-metadata`). Crawler and LLM hints: [`public/llms.txt`](./public/llms.txt) (vault bookmarks, theme, licensing).
- `@eigenpal/docx-editor-react` loads via `dynamic(..., { ssr: false })` per vendor Next.js guidance.
- **Local editing:** open, create, upload, and download `.docx` files without signing in; bytes stay in the browser for editing. The editor **always opens to a blank document** (logged in or not). **New** resets to a fresh blank page.
- **Light / dark theme:** navbar **ThemeSwitcher** (system, light, or dark). Helvety chrome uses `@helvety/ui` tokens; the Eigenpal editor shell is themed via [`styles/docx-editor-helvety-bridge.css`](./styles/docx-editor-helvety-bridge.css) (see [Theme](#theme-light--dark) below). The printable page stays white in both modes.
- **Vault save (optional):** when signed in and vault-unlocked, encrypted display title + encrypted `.docx` bytes in Postgres (`docs` table). `EncryptionGateApp` is scoped to the **My documents** sheet only, not the whole app.
- **Vault bookmarks (`?doc=`):** `https://helvety.com/docs?doc=<uuid>` can appear in shared links and auth return URLs. The editor **always starts with a blank page** on load (including when `?doc=` is present); open saved documents from **My documents** in the command bar sheet after sign-in and vault unlock. The URL updates to `?doc=<uuid>` when you open or save a vault document from the app (not on initial landing).

## Routing (`basePath: /docs`)

This app uses Next.js `basePath: /docs`. Path rules differ by API:

| Use case                                       | Path shape                          | Helper                                                                   |
| ---------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------ |
| `router.replace`, `<Link href>` inside the app | Zone-relative (`/`, `/?doc=<uuid>`) | `usePathname()` + query (see `helvety-docs-shell.tsx`)                   |
| Browser `fetch` to vault APIs                  | Gateway-visible `/docs/api/...`     | `getDocsApiPath()` in [`lib/docs-zone-path.ts`](./lib/docs-zone-path.ts) |
| Auth sign-in return (`getLoginUrl`)            | Gateway-visible `/docs…`            | `buildDocsPublicPath()` in the same module                               |
| `revalidatePath` after server actions          | `/docs` (includes basePath)         | `revalidateDocsRoutes()` in `doc-actions.ts`                             |

Do **not** pass `/docs` to `router.replace` inside this app. Next prepends `basePath` again and the browser lands on `/docs/docs` (404). CI guards this in [`lib/docs-zone-routing.test.ts`](./lib/docs-zone-routing.test.ts).

**`?doc=` is not an auto-open deep link** (unlike Tasks `?item=`, Notes `?note=`, or Contacts `?contact=` sheet links). Landing with `?doc=<uuid>` strips the query and leaves a blank editor; only explicit sheet open or save sets `?doc=` while you work.

## Editor behavior (maintainers)

- **Blank default:** [`components/docx-editor-workspace.tsx`](./components/docx-editor-workspace.tsx) mounts Eigenpal’s `createEmptyDocument()` when there is no loaded buffer. Do **not** pass `documentBuffer={null}` alone; that shows Eigenpal’s empty state, not an editable page.
- **New / remount:** [`components/helvety-docs-shell.tsx`](./components/helvety-docs-shell.tsx) bumps `editorSessionKey` on **New**, local open, and vault open so the editor remounts cleanly.
- **Public route:** [`app/page.tsx`](./app/page.tsx) stays public; vault is a sheet opened from the command bar when signed in. Auth does not gate the blank editor.
- **Comments:** Helvety hides Eigenpal comment UI (CSS Layer 6 plus `comments={[]}` in the workspace). Users cannot add, view, or edit comments in the app. Comment markup inside an imported `.docx` may still exist in file bytes; downloads reflect the editor’s export behavior and are not stripped automatically.

## Limits

- Maximum file size: **20MB** per `.docx` (local open and vault save); see `DOCS_FILE_SIZE_LIMIT_COPY` in `@helvety/shared/product-file-limit-copy`.
- Vault list capped at **500** documents per API list request (`MAX_DOC_ROWS`).

## Crawl and Indexing

- `apps/docs` is publicly indexable (main editor route at `/docs`).
- `/docs/robots.txt` allows crawl and advertises `/docs/sitemap.xml`; it disallows site-root `/api` and `/auth` paths (not `/docs/api`, which is auth-gated vault access).
- `/docs/sitemap.xml` contains canonical public URLs (app root and `llms.txt`).

## Security Model

- Local editing does not upload document bytes to Helvety for editing.
- Vault fields use client-side encryption with the same passkey-derived master key pattern as Tasks, Contacts, Notes, and Links; this is **not** a full-app E2EE product (local mode works without login).
- Vault Postgres access uses the **authenticated user** Supabase client in server actions and `/api/docs` routes (`getUser()` + forced RLS on `public.docs`). The app does **not** use `createAdminClient()` for vault CRUD. Database policies require `(select auth.uid()) = user_id`; table privileges are granted to `authenticated` only (not `anon`).
- `proxy.ts` uses the `public-tool` profile plus `googleFonts` CSP for Material Symbols (docx-editor toolbar). `config.matcher` matches `SECURITY_PROXY_MATCHER` in `@helvety/shared/proxy` (inlined as a static literal per Next.js).
- Auth checks run in server actions and `/api/docs` route handlers, not in `proxy.ts` as the authoritative boundary. Vault list/detail GET routes use `@helvety/shared/encrypted-prefetch-api` (`RATE_LIMITS.PREFETCH`, explicit column selects on `public.docs`).
- Shared site footer and Vercel Analytics mount via `HelvetyPublicShellRootLayout`; see [`docs/cookies-telemetry-and-footer.md`](../../docs/cookies-telemetry-and-footer.md) and [Privacy §9](https://helvety.com/privacy#cookies).

## Theme (light / dark)

- **Helvety chrome** (navbar, command bar, vault sheet, dialogs, toasts, loading states) uses `@helvety/ui` semantic tokens via `HelvetyPublicShellRootLayout` and the navbar **ThemeSwitcher** (`next-themes`, `html.dark`). No app-local `ThemeProvider`.
- **Eigenpal editor chrome** (title bar with **File**, **Format**, and **Insert** menus, formatting toolbar, dialogs, workspace gutter) is themed in [`styles/docx-editor-helvety-bridge.css`](./styles/docx-editor-helvety-bridge.css), imported from [`app/globals.css`](./app/globals.css) after vendor styles. The bridge sets HSL channel variables on `.ep-root` aligned with [`packages/ui/globals.css`](../../packages/ui/globals.css); title-bar and formatting toolbar rows use `--surface-toolbar` and matching left/right borders so they align flush with the Helvety command bar. Maintainer token reference (tests): [`lib/docx-editor-theme-tokens.ts`](./lib/docx-editor-theme-tokens.ts). The bridge hides Eigenpal’s default title-bar **doc icon** and **Help** menu only (vault save and My documents live in the pinned Helvety command bar), suppresses **comment** UI, and uses square corners. Dropdowns and tooltips use the same semantic popover/accent tokens in light and dark (Layer 8).
- **Document page** (`.layout-page`) stays **white paper with dark body text** in both themes so downloaded `.docx` files match print expectations. The workspace gutter (`--doc-bg`) follows the app background in light and dark; only the page surface stays white.

**When changing brand colors:** update `packages/ui/globals.css`, then `lib/docx-editor-theme-tokens.ts` and `styles/docx-editor-helvety-bridge.css`, and run `cd apps/docs && bun run test -- lib/docx-editor-theme.test.ts lib/docx-editor-theme-tokens.test.ts`.

### Eigenpal upgrade checklist

After bumping `@eigenpal/docx-editor-react`, verify visually (light + dark):

1. Toolbar and font/size/style dropdowns
2. Find/Replace and Page setup dialogs (if reachable)
3. Zoom control and ruler
4. Dark mode: warm dark gutter, **white page**, readable text on the page
5. Downloaded `.docx` still has a white page background
6. **Blank on load** and **New** show an editable empty page (toolbar + ruler), not a placeholder or empty buffer state
7. Eigenpal title bar: **File**, **Format**, and **Insert** visible; no default doc icon column, no **Help** menu, no **comment** UI (vault save and My documents in the Helvety command bar)
8. Command bar + Eigenpal toolbars: seamless stack (no color band or gap between rows; title-bar and formatting-toolbar rows show left/right borders like the command bar)
9. Menus, dropdowns, and tooltips: readable contrast in **light and dark** (no white panels with light-grey text; toolbar hovers readable)

Then run `cd apps/docs && bun run test` (theme bridge in `lib/docx-editor-theme.test.ts`, including every eigenpal `slate-*` dark remap; token parity in `lib/docx-editor-theme-tokens.test.ts`). If that test fails after a package bump, extend [`docx-editor-helvety-bridge.css`](./styles/docx-editor-helvety-bridge.css) (Layer 3 for `slate-*` utilities; Layers 4–8 for chrome surfaces, title-bar hides, comment suppression, seamless toolbar stack, and overlay parity for inline `white` panels, menus, and tooltips).

## Third-Party

- [@eigenpal/docx-editor-react](https://github.com/eigenpal/docx-editor) (Apache-2.0). Helvety app source remains AGPL-3.0-or-later.

## Environment Variables

Copy [`env.template`](./env.template) to `.env.local`.

This app uses the **user-scoped server** env tier (same as E2EE vault zones): Supabase publishable key, Upstash Redis, and cookie signing for CSRF in the proxy. Vault handlers use the user-scoped Supabase client + RLS; no `SUPABASE_SECRET_KEY` is required.

| Variable                               | Required | Server-only | Description                                                                                      |
| -------------------------------------- | -------- | ----------- | ------------------------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`             | Yes      | No          | Supabase project URL                                                                             |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes      | No          | Supabase publishable key (user-scoped vault client)                                              |
| `UPSTASH_REDIS_REST_URL`               | Yes      | Yes         | Rate limiting for server actions, API routes, and auth callbacks                                 |
| `UPSTASH_REDIS_REST_TOKEN`             | Yes      | Yes         | Upstash REST token                                                                               |
| `HELVETY_COOKIE_SIGNING_SECRET`        | Yes      | Yes         | Signs CSRF cookies in proxy; re-issues invalid cookies (min 32 chars; not `SUPABASE_SECRET_KEY`) |

## Vercel deployment

Separate project **`helvety-docs`** with Root Directory **`apps/docs`** (same pattern as PDF, Tasks, etc.). See [`docs/vercel-monorepo-apps.md`](../../docs/vercel-monorepo-apps.md). Production env from [`env.template`](./env.template); gateway needs `DOCS_URL` when `VERCEL=1`.

## Database

On the hosted **helvety** Supabase project, both docs vault migrations are applied (May 2026). For other environments, apply in order:

1. [`supabase/migrations/20260523120000_create_docs_table.sql`](../../supabase/migrations/20260523120000_create_docs_table.sql): table, forced RLS, grants to `authenticated`/`service_role`, policies on `authenticated`
2. [`supabase/migrations/20260524120000_harden_docs_and_revoke_anon_grants.sql`](../../supabase/migrations/20260524120000_harden_docs_and_revoke_anon_grants.sql): required if step 1 ran before grants existed; also revokes `anon` on legacy E2EE tables

Greenfield installs that only run step 1 get the hardened shape when using the current repo file. [`20260523230000_docs_rls_auth_uid_subselect.sql`](../../supabase/migrations/20260523230000_docs_rls_auth_uid_subselect.sql) is superseded (do not apply).

Then refresh local schema exports with `supabase/getSupabase.sql` (never commit `supabase.json`). CI checks types + migration SQL via `bun run consistency:supabase-schema`.
