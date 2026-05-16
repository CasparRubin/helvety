# Helvety Links

End-to-end encrypted bookmarks with nested folders.

**App URL:** <https://helvety.com/links>  
**Monorepo path:** `apps/links`

## Key Features

- Root `app/layout.tsx` uses `@helvety/ui/e2ee-app-root-layout` (shared CSRF/user bootstrap, encryption gate, JSON-LD) and `@helvety/shared/seo` (`createHelvetyProductMetadata`); `renderNavbar` receives the server user snapshot; product routes are not indexable. The dashboard pins the links command bar with `@helvety/ui/command-bar-page-layout` (body scrolls in shadcn `ScrollArea`).
- Client-side encryption for folder names and link names/URLs
- Virtual **All** folder as the only top-level tree row (cannot be deleted or renamed); user folders and unfiled links live inside All (`parent_folder_id` / `folder_id` `null` in the database)
- Finder-style nested folder tree on one page (expand/collapse; no URL-based folder navigation)
- Row interactions: link row opens the URL in a new tab; folder row toggles expansion; pencil opens link/folder editors
- Folder actions: open links in a folder, or in a folder and all nested subfolders (on **All**, open every bookmark in the library)
- Drag-and-drop reorder and reparenting (disabled while search is active)
- Command bar: primary “New link”, secondary “New folder” (inline on `md+`, overflow menu on small screens)
- New and edit use the same wide right detail sheet (`E2eeEntityDetailSheet`) with `LinkEditor` / `FolderEditor` and `LinksEditorCommandBar` (wraps shared `EditorCommandBar`: save, refresh, unsaved-change detection, delete in overflow). **New link** / **New folder** persist a draft row immediately, then open the full editor in that sheet; closing without edits removes the draft row.
- Client-side search on decrypted names and URLs; while search is active, the tree flattens to a matching list and drag-and-drop is disabled
- Client-side decrypted export (server-side encrypted fetch)

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
- `proxy.ts` handles request bootstrap; authz enforcement lives in pages/actions/route handlers. Its `config.matcher` string matches `SECURITY_PROXY_MATCHER` in `@helvety/shared/proxy` (Next.js requires that pattern as a **static literal** in `proxy.ts`, so CI guardrails keep the two in sync). Extensions such as `.mjs`, `.wasm`, and `.json` bypass the proxy chain.
- State-changing actions require CSRF.
- Read paths use authenticated read model with rate limiting.
- Bulk export uses tighter export rate limits.

## Crawl and Indexing

- `apps/links` is intentionally non-indexable.
- `/links/robots.txt` disallows crawling.
- `/links/sitemap.xml` is intentionally empty.

## Supabase schema

Tables `link_folders` and `links` are defined in the shared generated types (`packages/shared/src/types/database.types.ts`). After schema changes in Supabase, regenerate types from the repo root:

```bash
bun run db:gen-types
```

New environments must provision both tables with row-level security and `GRANT` to the `authenticated` role (match your production project or a fresh export from `supabase/getSupabase.sql`).

## Environment Variables

Copy `env.template` to `.env.local`.

| Variable                               | Required | Server-only | Description                                |
| -------------------------------------- | -------- | ----------- | ------------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`             | Yes      | No          | Supabase project URL                       |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes      | No          | Supabase publishable key                   |
| `SUPABASE_SECRET_KEY`                  | Yes      | Yes         | Trusted server-side Supabase key           |
| `UPSTASH_REDIS_REST_URL`               | Yes      | Yes         | Upstash Redis REST URL for rate limiting   |
| `UPSTASH_REDIS_REST_TOKEN`             | Yes      | Yes         | Upstash Redis REST token for rate limiting |

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
