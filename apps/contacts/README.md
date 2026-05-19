# Helvety Contacts

End-to-end encrypted contact management app.

**App URL:** <https://helvety.com/contacts>  
**Monorepo path:** `apps/contacts`

## Key Features

- Root `app/layout.tsx` uses `@helvety/ui/e2ee-app-root-layout` (`bootstrapE2eeLayoutSession` for CSRF/user, encryption gate, JSON-LD) and `@helvety/shared/seo` (`createHelvetyProductMetadata`); `renderNavbar` receives the server user snapshot; product routes are not indexable. The dashboard pins shared `@helvety/ui/entity-command-bar` via `@helvety/ui/command-bar-page-layout` (body scrolls in shadcn `ScrollArea`); editors inside the detail sheet pin `ContactEditorCommandBar` (wraps `EditorCommandBar`) the same way.
- Client-side encryption for sensitive contact fields
- Fixed-category main list (`Personal`, `Work`, `Other`) with drag-and-drop reorder
- Client-side search on decrypted fields (name/email/description/notes); while search is active, reorder/drag is disabled and an empty-search message is shown when nothing matches
- New and edit use the same wide right detail sheet (`E2eeEntityDetailSheet`) with the full `ContactEditor` (all fields, Tiptap notes, task/note links). **New Contact** creates a draft row and opens that sheet immediately; closing without edits removes the draft row.
- Shareable deep links open a contact in the detail sheet via `?contact=<uuid>` (for example from Tasks or Notes cross-links). URL↔sheet sync uses `useE2eeEntityPanelWithUrl` + `useSyncE2eeEntityPanelFromUrl` from `@helvety/ui`; `app/page.tsx` wraps the dashboard in `<Suspense>` (required for `useSearchParams`).
- Rich contact editor with linked tasks/notes
- Contact list hooks report auth and action failures via `reportE2eeHookError` / `reportE2eeActionFailure` from `@helvety/ui/auth-navigation`
- Client-side decrypted export (server-side encrypted fetch)

## E2EE Data Model

Encrypted contact fields:

- `first_name`
- `last_name`
- `description`
- `email`
- `phone`
- `birthday`
- `notes`

Plaintext structural fields:

- `id`, `user_id`
- `created_at`, `updated_at`
- `sort_order`
- `category_id`

## Security Model

- Auth is centralized at `helvety.com/auth` (email OTP + passkey; trusted devices may start at passkey sign-in without re-entering email).
- Protected routes use `requireE2eeAppPageAuth("/contacts")`.
- `proxy.ts` handles request bootstrap; authz enforcement lives in pages/actions/route handlers. Its `config.matcher` string matches `SECURITY_PROXY_MATCHER` in `@helvety/shared/proxy` (Next.js requires that pattern as a **static literal** in `proxy.ts`, so CI guardrails keep the two in sync). Extensions such as `.mjs`, `.wasm`, and `.json` bypass the proxy chain.
- State-changing actions require CSRF; the proxy re-issues invalid `csrf_token` cookies.
- Read paths use authenticated read model with rate limiting.
- Bulk export uses tighter export rate limits.

## Crawl and Indexing

- `apps/contacts` is intentionally non-indexable.
- `/contacts/robots.txt` disallows crawling.
- `/contacts/sitemap.xml` is intentionally empty.

## Environment Variables

Copy `env.template` to `.env.local`.

| Variable                               | Required | Server-only | Description                                                                                      |
| -------------------------------------- | -------- | ----------- | ------------------------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`             | Yes      | No          | Supabase project URL                                                                             |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes      | No          | Supabase publishable key                                                                         |
| `SUPABASE_SECRET_KEY`                  | Yes      | Yes         | Trusted server-side Supabase key                                                                 |
| `UPSTASH_REDIS_REST_URL`               | Yes      | Yes         | Upstash Redis REST URL for rate limiting                                                         |
| `UPSTASH_REDIS_REST_TOKEN`             | Yes      | Yes         | Upstash Redis REST token for rate limiting                                                       |
| `HELVETY_COOKIE_SIGNING_SECRET`        | Yes      | Yes         | Signs CSRF cookies in proxy; re-issues invalid cookies (min 32 chars; not `SUPABASE_SECRET_KEY`) |

Optional CI/monorepo variables are documented as comments in [`env.template`](./env.template). Shared behavior is in the root [`README.md`](../../README.md) Environment Model.

## Development and Testing

Run from `apps/contacts`:

```bash
bun run dev
bun run test
bun run test:watch
bun run test:coverage
```

For monorepo setup and CI/release commands, use the root [`README.md`](../../README.md).

## Legal and Support

- Privacy: <https://helvety.com/privacy>
- Terms: <https://helvety.com/terms>
- Impressum and abuse reporting: <https://helvety.com/impressum#abuse>
- Contact: <mailto:contact@helvety.com>

## License

Licensed under the [GNU Affero General Public License v3.0 or later](../../LICENSE).
