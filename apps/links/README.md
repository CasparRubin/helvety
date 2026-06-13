# Helvety Links

End-to-end encrypted bookmarks with nested folders.

**App URL:** <https://helvety.com/links>  
**Monorepo path:** `apps/links`

## Key Features

- Root `app/layout.tsx` composes `@helvety/ui/e2ee-app-root-layout` (that shell injects `HelvetyThemeInitScript` in `<head>`, calls `bootstrapE2eeLayoutSession()`, mounts the encryption gate, and emits JSON-LD) and `@helvety/shared/seo` (`createHelvetyProductMetadata`); `renderNavbar` receives the server user snapshot; product routes are not indexable. The dashboard pins [`LinksCommandBar`](components/links-command-bar.tsx) (wraps `@helvety/ui/entity-command-bar` for New link / New folder) via `@helvety/ui/command-bar-page-layout` (body scrolls in shadcn `ScrollArea`).
- Client-side encryption for folder names and link names/URLs
- Virtual **All** folder as the only top-level tree row (cannot be deleted or renamed); user folders and unfiled links live inside All (`parent_folder_id` / `folder_id` `null` in the database)
- Finder-style nested folder tree on one page (expand/collapse state is client-side; tree rows are not routed by URL)
- Shareable deep links open the detail sheet via `?link=<uuid>` or `?folder=<uuid>` (`useLinksPanelUrlSync` with guarded `panelRef` URL sync in the dashboard); they do not drive tree expand/collapse. `app/page.tsx` wraps the dashboard in `<Suspense>` (required for `useSearchParams`).
- Row interactions: link row opens the URL in a new tab; folder row toggles expansion; pencil opens link/folder editors
- Folder actions: open links in a folder, or in a folder and all nested subfolders (on **All**, open every bookmark in the library)
- Drag-and-drop reorder and reparenting (disabled while search is active)
- List toolbar: primary “New link”, secondary “New folder” (inline on `md+`, overflow menu on small screens) via `LinksCommandBar`
- New and edit use the same wide right detail sheet (`E2eeEntityDetailSheet`; flex scroll chain via `@helvety/ui/sheet-scroll-layout`, body scrolls in `CommandBarPageLayout`) with `LinkEditor` / `FolderEditor` (`dynamic(..., { ssr: false })`) and `LinksEditorCommandBar` (wraps shared `EditorCommandBar`: save, refresh, unsaved-change detection, delete in overflow). **New link** / **New folder** persist a draft row immediately, then open the full editor in that sheet; closing without edits removes the draft row. The link editor includes cross-app panels to tasks, contacts, and notes (`EntityLinksPanel` + `createE2eeEntityLinksHook`).
- Client-side search on decrypted names and URLs; while search is active, the tree flattens to a matching list and drag-and-drop is disabled
- Client-side decrypted export via `@helvety/ui/hooks/use-e2ee-data-export` and `lib/data-export.ts` (JSON download plumbing in `@helvety/shared/e2ee-json-export`; server fetch stays encrypted via `fetchOwnedEncryptedExport`)
- Library/folder hooks report auth and action failures via `reportE2eeHookError` / `reportE2eeActionFailure` from `@helvety/ui/auth-navigation`. `use-link-library` uses explicit `triggerHardLogoutOnce` on mutating paths (folder tree model, not `useEncryptedSortableItems`).

## E2EE Data Model

Encrypted fields:

- Folder: `encrypted_name` (display name)
- Link: `encrypted_name`, `encrypted_url`

Plaintext structural fields:

- `id`, `user_id`
- `parent_folder_id`, `folder_id`, `sort_order`
- `created_at`, `updated_at`

`parent_folder_id` / `folder_id` of `null` means “inside **All**” in the UI (not a separate database row). Per-account caps use `ACTION_LIMITS.MAX_DASHBOARD_ROWS` (2,000 folders and 2,000 links; see `@helvety/shared/constants`).

## Security Model

- Auth is centralized at `helvety.com/auth` (email OTP + passkey; trusted devices may start at passkey sign-in without re-entering email).
- Protected routes use `requireE2eeAppPageAuth("/links")`.
- `proxy.ts` handles request bootstrap with **fail-closed** auth refresh (clears stale `sb-*` cookies when Supabase session refresh fails); authz enforcement lives in pages/actions/route handlers. Its `config.matcher` string matches `SECURITY_PROXY_MATCHER` in `@helvety/shared/proxy` (Next.js requires that pattern as a **static literal** in `proxy.ts`, so `ci:check` guardrails keep the two in sync). Extensions such as `.mjs`, `.wasm`, and `.json` bypass the proxy chain.
- State-changing actions require CSRF; the proxy re-issues invalid `csrf_token` cookies.
- Shared site footer via `E2eeAppRootLayout`; see [`docs/cookies-telemetry-and-footer.md`](../../docs/cookies-telemetry-and-footer.md) and [Privacy §9](https://helvety.com/privacy#cookies).
- Read paths use authenticated read model with rate limiting. Library prefetch GET routes use `@helvety/shared/encrypted-prefetch-api` (`RATE_LIMITS.PREFETCH`, `ENCRYPTED_PREFETCH_COLUMNS` for `links` and `link_folders`). Cross-app link pickers for tasks, contacts, and notes cap at `ACTION_LIMITS.MAX_DASHBOARD_ROWS` (**2,000** rows per query).
- Cross-app link mutations use `@helvety/shared/entity-link-action-primitives`; bulk export uses `fetchOwnedEncryptedExport` + `logEncryptedExportRequested` with `RATE_LIMITS.EXPORT`.
- Valid `helvety_device_trust` cookie (weekly email proof) required for E2EE pages and API routes; missing/expired trust forces global logout. Vault keys in IndexedDB: **24h sliding idle / 7d max** (`auth-session-policy.ts`).

## Crawl and Indexing

- `apps/links` is intentionally non-indexable.
- `/links/robots.txt` disallows crawling.
- `/links/sitemap.xml` is not published (404). Private zones omit sitemap routes; `llms.txt` remains discoverable via robots and gateway links.

## Supabase schema

Tables `link_folders` and `links` are defined in the shared generated types (`packages/shared/src/types/database.types.ts`). After schema changes in Supabase, regenerate types from the repo root:

```bash
bun run db:gen-types
```

New environments must provision both tables with row-level security and `GRANT` to the `authenticated` role (match your production project or a fresh export from `supabase/getSupabase.sql`).

## Environment Variables

Copy `env.template` to `.env.local`.

Vault CRUD uses the user-scoped Supabase client + RLS; no `SUPABASE_SECRET_KEY` is required. `DEVICE_TRUST_COOKIE_SECRET` must match `helvety-auth` (weekly email-proof gate).

| Variable                               | Required | Server-only | Description                                                                                         |
| -------------------------------------- | -------- | ----------- | --------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Yes      | No          | Supabase project URL                                                                                |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes      | No          | Supabase publishable key                                                                            |
| `UPSTASH_REDIS_REST_URL`               | Yes      | Yes         | Upstash Redis REST URL for rate limiting                                                            |
| `UPSTASH_REDIS_REST_TOKEN`             | Yes      | Yes         | Upstash Redis REST token for rate limiting                                                          |
| `HELVETY_COOKIE_SIGNING_SECRET`        | Yes      | Yes         | Signs CSRF cookies in proxy; re-issues invalid cookies (min 32 chars; not `SUPABASE_SECRET_KEY`)    |
| `DEVICE_TRUST_COOKIE_SECRET`           | Yes      | Yes         | Verifies weekly email-proof cookie (same value as `auth`; min 32 chars; separate from CSRF signing) |

Optional monorepo variables are documented as comments in [`env.template`](./env.template). Shared behavior is in the root [`README.md`](../../README.md) Environment Model; Vercel Production/Preview setup: [`docs/env-vercel-audit-checklist.md`](../../docs/env-vercel-audit-checklist.md). Run `bun run consistency:local-env` from the repo root to audit local `.env.local` files.

## Development and Testing

Run from `apps/links` (dev server on port **3009**):

```bash
bun run dev
bun run test
bun run test:watch
bun run test:coverage
```

Through the monorepo gateway: <http://localhost:3001/links> (see root [`README.md`](../../README.md)).

## Legal and Support

- Privacy: <https://helvety.com/privacy>
- Terms: <https://helvety.com/terms>
- Impressum and abuse reporting: <https://helvety.com/impressum#abuse>
- Contact: <mailto:contact@helvety.com>

## License

Licensed under the [GNU Affero General Public License v3.0 or later](../../LICENSE).
