# Helvety Store

Product catalog and package-download app for the Helvety ecosystem.

**App URL:** <https://helvety.com/store>  
**Monorepo path:** `apps/store`

## Key Features

- Root `app/layout.tsx` uses `@helvety/ui/helvety-public-shell-root-layout` with `themeProviderScope: "navbar-only"` so `ThemeProvider` wraps only the navbar (catalog routes avoid a full-tree theme script); `wrapInsideTooltipProvider` wraps the shell column in `@helvety/ui/csrf-provider` (`CSRFProvider`); shared session bootstrap helpers feed CSRF and navbar / `StoreNav`; metadata comes from `@helvety/shared/seo` (`createHelvetyProductMetadata`)
- Public product catalog at `/store/products`
- Public package download endpoints (no login required)
- Optional authenticated account page at `/store/account`
- Product-detail pages with statically imported artwork

## Package Download Behavior

- Download files are served from Supabase Storage bucket `packages`.
- `spfx/helvety-spo-explorer`: newest `.sppkg` by timestamp/name.
- `browserExtensions/power-automate-force-v3-false`: newest `.zip` by timestamp/name.
- If listing fails, resolver falls back to configured filename path.
- Download URL generation and public download endpoint throttling both use centralized helpers in `lib/download-security.ts` (`buildDownloadUrlRateLimitKey`, `buildPublicDownloadRateLimitKey`) to keep key naming and validation rules consistent.
- Download URL generation is IP-rate-limited and fails closed when trusted client IP is unavailable in production.

## Crawl and Indexing

- Public/indexable: `/store`, `/store/products`, `/store/products/[slug]`
- Non-indexable: `/store/account`
- `/store/robots.txt` allows public crawl and disallows `/account`, `/api`, `/auth`
- `/store/sitemap.xml` includes listing and product detail pages only

## Environment Variables

Copy `env.template` to `.env.local`.

| Variable                               | Required | Server-only | Description                      |
| -------------------------------------- | -------- | ----------- | -------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Yes      | No          | Supabase project URL             |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes      | No          | Supabase publishable key         |
| `SUPABASE_SECRET_KEY`                  | Yes      | Yes         | Trusted server-side Supabase key |
| `UPSTASH_REDIS_REST_URL`               | Yes      | Yes         | Upstash Redis REST URL           |
| `UPSTASH_REDIS_REST_TOKEN`             | Yes      | Yes         | Upstash Redis REST token         |

## Security Model

- `proxy.ts` performs request bootstrap (CSP/CSRF/session refresh), not full auth enforcement. Its `config.matcher` string matches `SECURITY_PROXY_MATCHER` in `@helvety/shared/proxy` (Next.js requires that pattern as a **static literal** in `proxy.ts`, so CI guardrails keep the two in sync). Extensions such as `.mjs`, `.wasm`, and `.json` bypass the proxy chain.
- Account actions enforce authz in pages/server actions/route handlers.
- Public download endpoints use explicit abuse protections and rate limiting.

## Development and Testing

Run from `apps/store`:

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
