# Helvety Notes

End-to-end encrypted notes app with category-based organization.

**App URL:** <https://helvety.com/notes>  
**Monorepo path:** `apps/notes`

## Key Features

- Root `app/layout.tsx` composes `@helvety/ui/e2ee-app-root-layout` (that shell injects `HelvetyThemeInitScript` in `<head>`, calls `bootstrapE2eeLayoutSession()`, mounts the encryption gate, and emits JSON-LD) and `@helvety/shared/seo` (`createHelvetyProductMetadata`); `renderNavbar` receives the server user snapshot; product routes are not indexable. The dashboard pins shared `@helvety/ui/entity-command-bar` via `@helvety/ui/command-bar-page-layout` (body scrolls in shadcn `ScrollArea`); editors inside the detail sheet pin `@helvety/ui/item-command-bar` the same way.
- Client-side encryption for note title and description
- Fixed categories (Personal, Work, Other)
- Client-side search on decrypted title/description
- Drag-and-drop reorder (disabled while search is active)
- New and edit use the same wide right detail sheet (`E2eeEntityDetailSheet`) with the full `ItemEditor` (Tiptap, category, task/contact links). **New Note** creates a draft row and opens that sheet immediately; closing without edits removes the draft row.
- Shareable deep links open a note in the detail sheet via `?note=<uuid>`. URL↔sheet sync uses `useE2eeEntityPanelWithUrl` + `useSyncE2eeEntityPanelFromUrl` from `@helvety/ui`; `app/page.tsx` wraps the dashboard in `<Suspense>` (required for `useSearchParams`).
- Cross-app task and contact links via `EntityLinksPanel` + `createE2eeEntityLinksHook` (`useTaskLinks`, `useContactLinks`)
- List CRUD/reorder: `hooks/use-items.ts` wraps `@helvety/ui/hooks/use-encrypted-sortable-items` with note crypto and server actions; hook errors use `reportE2eeHookError` / `reportE2eeActionFailure` from `@helvety/ui/auth-navigation`
- Client-side decrypted export (server-side encrypted fetch)

## E2EE Data Model

Encrypted note fields:

- `title`
- `description`

Plaintext structural fields:

- `id`, `user_id`
- `category_id`, `sort_order`
- `created_at`, `updated_at`

## Security Model

- Auth is centralized at `helvety.com/auth` (email OTP + passkey; trusted devices may start at passkey sign-in without re-entering email).
- Protected routes use `requireE2eeAppPageAuth("/notes")`.
- `proxy.ts` handles request bootstrap with **fail-closed** auth refresh (clears stale `sb-*` cookies when Supabase session refresh fails); authz enforcement lives in pages/actions/route handlers. Its `config.matcher` string matches `SECURITY_PROXY_MATCHER` in `@helvety/shared/proxy` (Next.js requires that pattern as a **static literal** in `proxy.ts`, so `ci:check` guardrails keep the two in sync). Extensions such as `.mjs`, `.wasm`, and `.json` bypass the proxy chain.
- State-changing actions require CSRF; the proxy re-issues invalid `csrf_token` cookies.
- Shared site footer and Vercel Analytics mount via `E2eeAppRootLayout`; see [`docs/cookies-telemetry-and-footer.md`](../../docs/cookies-telemetry-and-footer.md) and [Privacy §9](https://helvety.com/privacy#cookies).
- Read paths use authenticated read model with rate limiting. List/detail prefetch GET routes and `getContacts` in contact-link actions use `@helvety/shared/encrypted-prefetch-api` (`RATE_LIMITS.PREFETCH`, `ENCRYPTED_PREFETCH_COLUMNS`).
- Bulk export uses tighter export rate limits.

## Crawl and Indexing

- `apps/notes` is intentionally non-indexable.
- `/notes/robots.txt` disallows crawling.
- `/notes/sitemap.xml` is intentionally empty.

## Environment Variables

Copy `env.template` to `.env.local`.

Vault CRUD uses the user-scoped Supabase client + RLS; no `SUPABASE_SECRET_KEY` is required.

| Variable                               | Required | Server-only | Description                                                                                      |
| -------------------------------------- | -------- | ----------- | ------------------------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`             | Yes      | No          | Supabase project URL                                                                             |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes      | No          | Supabase publishable key                                                                         |
| `UPSTASH_REDIS_REST_URL`               | Yes      | Yes         | Upstash Redis REST URL for rate limiting                                                         |
| `UPSTASH_REDIS_REST_TOKEN`             | Yes      | Yes         | Upstash Redis REST token for rate limiting                                                       |
| `HELVETY_COOKIE_SIGNING_SECRET`        | Yes      | Yes         | Signs CSRF cookies in proxy; re-issues invalid cookies (min 32 chars; not `SUPABASE_SECRET_KEY`) |

Optional monorepo variables are documented as comments in [`env.template`](./env.template). Shared behavior is in the root [`README.md`](../../README.md) Environment Model; Vercel Production/Preview setup: [`docs/env-vercel-audit-checklist.md`](../../docs/env-vercel-audit-checklist.md). Run `bun run consistency:local-env` from the repo root to audit local `.env.local` files.

## Development and Testing

Run from `apps/notes`:

```bash
bun run dev
bun run test
bun run test:watch
bun run test:coverage
```

For monorepo setup and `ci:check` / `ci:release` commands, use the root [`README.md`](../../README.md).

## Legal and Support

- Privacy: <https://helvety.com/privacy>
- Terms: <https://helvety.com/terms>
- Impressum and abuse reporting: <https://helvety.com/impressum#abuse>
- Contact: <mailto:contact@helvety.com>

## License

Licensed under the [GNU Affero General Public License v3.0 or later](../../LICENSE).
