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
- New and edit use the same wide right detail sheet (`E2eeEntityDetailSheet`; flex scroll chain via `@helvety/ui/sheet-scroll-layout`, body scrolls in `CommandBarPageLayout`) with the full `ItemEditor` (Tiptap, category, task/contact links). **New Note** creates a draft row and opens that sheet immediately; closing without edits removes the draft row.
- Shareable deep links open a note in the detail sheet via `?note=<uuid>`. URL↔sheet sync uses `useE2eeEntityPanelWithUrl` + `useSyncE2eeEntityPanelFromUrl` from `@helvety/ui`; `app/page.tsx` wraps the dashboard in `<Suspense>` (required for `useSearchParams`).
- Cross-app task and contact links via `EntityLinksPanel` + `createE2eeEntityLinksHook` (`useTaskLinks`, `useContactLinks`)
- List CRUD/reorder: `hooks/use-items.ts` wraps `@helvety/ui/hooks/use-encrypted-sortable-items` with note crypto and server actions; hook errors use `reportE2eeHookError` / `reportE2eeActionFailure` from `@helvety/ui/auth-navigation`
- Detail sheet CRUD: `useItem` wraps `@helvety/ui/hooks/use-encrypted-single-item` (same refresh-token and hard-logout semantics as the list hook)
- Client-side decrypted export via `@helvety/ui/hooks/use-e2ee-data-export` and `lib/data-export.ts` (JSON download plumbing in `@helvety/shared/e2ee-json-export`; server fetch stays encrypted via `fetchOwnedEncryptedExport`)

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
- Shared site footer via `E2eeAppRootLayout`; see [`docs/cookies-telemetry-and-footer.md`](../../docs/cookies-telemetry-and-footer.md) and [Privacy §9](https://helvety.com/privacy#cookies).
- Read paths use authenticated read model with rate limiting. List/detail prefetch GET routes use `@helvety/shared/encrypted-prefetch-api` (`RATE_LIMITS.PREFETCH`, `ENCRYPTED_PREFETCH_COLUMNS`). Cross-app link pickers (`getContacts`, `getTaskEntities`) cap at `ACTION_LIMITS.MAX_DASHBOARD_ROWS` (**2,000** rows per query). The contact link picker loads the full `ENCRYPTED_PREFETCH_COLUMNS.contacts` list (Tasks uses the slimmer `CONTACT_LINK_PICKER_COLUMNS` subset; see `encrypted-prefetch-api.ts`).
- Cross-app link mutations use `@helvety/shared/entity-link-action-primitives`; bulk export uses `fetchOwnedEncryptedExport` + `logEncryptedExportRequested` with `RATE_LIMITS.EXPORT`.
- Valid `helvety_device_trust` cookie (weekly email proof) required for E2EE pages and API routes; missing/expired trust forces global logout. Vault keys in IndexedDB: **24h sliding idle / 7d max** (`auth-session-policy.ts`).

## Crawl and Indexing

- `apps/notes` is intentionally non-indexable.
- `/notes/robots.txt` disallows crawling.
- `/notes/sitemap.xml` is not published (404). Private zones omit sitemap routes; `llms.txt` remains discoverable via robots and gateway links.

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
