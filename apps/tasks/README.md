# Helvety Tasks

End-to-end encrypted task management app.

**App URL:** <https://helvety.com/tasks>  
**Monorepo path:** `apps/tasks`

## Key Features

- Root `app/layout.tsx` uses `@helvety/ui/e2ee-app-root-layout` (per-request CSRF token + `getCachedUser`, encryption gate, JSON-LD) and `@helvety/shared/seo` (`createHelvetyProductMetadata`); `renderNavbar` receives the server user snapshot; product routes are not indexable
- Client-side encryption for sensitive task fields
- Fixed stage-based main list with drag-and-drop reorder
- Client-side search on decrypted title/description; while search is active, reorder/drag is disabled and an empty-search message is shown when nothing matches
- Rich task editor with metadata panel
- Cross-app linking with contacts and notes
- Client-side decrypted export (server-side encrypted fetch)

## E2EE Data Model

Encrypted task fields:

- `title`
- `description`
- `start_date`
- `end_date`

Plaintext structural fields:

- `id`, `user_id`
- `created_at`, `updated_at`
- `sort_order`
- `priority`, `stage_id`, `label_id`, relation IDs

## Security Model

- Auth is centralized at `helvety.com/auth` (email OTP + passkey).
- Protected routes use `requireE2eeAppPageAuth("/tasks")`.
- `proxy.ts` handles request bootstrap; authz enforcement lives in pages/actions/route handlers.
- State-changing actions require CSRF.
- Read paths use authenticated read model with rate limiting.
- Bulk export uses tighter export rate limits.

## Crawl and Indexing

- `apps/tasks` is intentionally non-indexable.
- `/tasks/robots.txt` disallows crawling.
- `/tasks/sitemap.xml` is intentionally empty.

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

Run from `apps/tasks`:

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

Licensed under the [MIT License](../../LICENSE).
