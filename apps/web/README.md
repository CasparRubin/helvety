# Helvety Web

Gateway app for `helvety.com` and public legal/SEO surfaces.

**App URL:** <https://helvety.com>  
**Monorepo path:** `apps/web`

## Key Features

- Multi-zone gateway rewrites for `/auth`, `/store`, `/pdf`, `/image-upscaler`, `/tasks`, `/contacts`, `/notes`
- Shared ecosystem navigation (grouped app/tool switcher and auth-aware menu)
- Public legal pages, cookie notice, and abuse-reporting entry points
- Canonical metadata and sitemap/robots endpoints for indexable content

## Routing and SEO

- Sub-app forwarding is defined in `next.config.ts`.
- Direct-domain sub-app roots are expected to redirect to their base path.
- `apps/web` is indexable and serves:
  - `/robots.txt`
  - `/sitemap.xml` (web-owned pages)
  - `/sitemap-index.xml` (cross-app public sitemap index)

## Security Model

- `proxy.ts` handles lightweight request setup (CSP/CSRF bootstrap and Supabase cookie refresh), not full auth enforcement.
- Redirect targets are validated by shared auth redirect-validation utilities.
- Sensitive auth/data enforcement remains in app-specific zones (`auth`, `store`, `tasks`, `contacts`, `notes`).

## Environment Variables

Copy `env.template` to `.env.local`.

| Variable                               | Required   | Server-only | Description                                     |
| -------------------------------------- | ---------- | ----------- | ----------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Yes        | No          | Supabase project URL                            |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes        | No          | Supabase publishable key                        |
| `AUTH_URL`                             | Production | Yes         | Internal Vercel URL for auth zone rewrites      |
| `STORE_URL`                            | Production | Yes         | Internal Vercel URL for store zone rewrites     |
| `PDF_URL`                              | Production | Yes         | Internal Vercel URL for PDF zone rewrites       |
| `IMAGE_UPSCALER_URL`                   | Production | Yes         | Internal Vercel URL for image-upscaler rewrites |
| `TASKS_URL`                            | Production | Yes         | Internal Vercel URL for tasks zone rewrites     |
| `CONTACTS_URL`                         | Production | Yes         | Internal Vercel URL for contacts zone rewrites  |
| `NOTES_URL`                            | Production | Yes         | Internal Vercel URL for notes zone rewrites     |

Local development falls back to localhost targets; production uses trusted internal hosts.

## Development and Testing

Run from `apps/web`:

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

Licensed under the [MIT License](./LICENSE).
