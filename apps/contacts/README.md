# Helvety Contacts

End-to-end encrypted contact management app.

**App URL:** <https://helvety.com/contacts>  
**Monorepo path:** `apps/contacts`

## Key Features

- Root `app/layout.tsx` uses `@helvety/ui/e2ee-app-root-layout` (shared CSRF/user bootstrap, encryption gate, JSON-LD) and `@helvety/shared/seo` (`createHelvetyProductMetadata`); `renderNavbar` receives the server user snapshot; product routes are not indexable
- Client-side encryption for sensitive contact fields
- Fixed-category main list (`Personal`, `Work`, `Other`) with drag-and-drop reorder
- Client-side search on decrypted fields (name/email/description/notes); while search is active, reorder/drag is disabled and an empty-search message is shown when nothing matches
- Rich contact editor with linked tasks/notes
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
- `proxy.ts` handles request bootstrap; authz enforcement lives in pages/actions/route handlers.
- State-changing actions require CSRF.
- Read paths use authenticated read model with rate limiting.
- Bulk export uses tighter export rate limits.

## Crawl and Indexing

- `apps/contacts` is intentionally non-indexable.
- `/contacts/robots.txt` disallows crawling.
- `/contacts/sitemap.xml` is intentionally empty.

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

Licensed under the [MIT License](../../LICENSE).
