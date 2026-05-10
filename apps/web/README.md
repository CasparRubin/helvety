# Helvety Web

Gateway app for `helvety.com` and public legal/SEO surfaces.

**App URL:** <https://helvety.com>  
**Monorepo path:** `apps/web`

## Key Features

- Marketing home page (`/`): [`components/hero-section.tsx`](components/hero-section.tsx) centers copy and CTA in the first main viewport band; [`app/globals.css`](app/globals.css) (`.hero-bg-pattern`) applies a viewport-centered radial mask over an animated dot grid; from `md` up a second column shows the animated Helvety identifier (hidden on smaller breakpoints)
- Product showcase below the hero: [`components/store-apps-showcase.tsx`](components/store-apps-showcase.tsx) renders one full-viewport scroll-snap band per product (alternating left/right media + copy, four `.showcase-band-vN` background variants in [`app/globals.css`](app/globals.css), uniform 25 % edge feather on all four sides). Card-level copy (name, blurb, type, category, runs-on, free / open-source flags, release date) is sourced from `@helvety/shared/store-catalog` so the home page and the Store stay in sync from one place. The icon registry is typed `Record<StoreProductId, LucideIcon>` so adding a product to the catalog without an icon entry is a build-time error — see `apps/store/README.md` › "Adding a New Product" for the end-to-end flow
- Scroll-snap viewport: `helvety-web-scroll-snap-viewport` on the Radix `ScrollArea` viewport plus a small client `ScrollViewportMetricsBridge` that publishes the live viewport height as `--helvety-scroll-port-px`, so each `.helvety-main-band` sizes to the actual scrollable area (navbar + footer excluded). Disabled under `prefers-reduced-motion`
- Multi-zone gateway rewrites for `/auth`, `/store`, `/pdf`, `/image-upscaler`, `/tasks`, `/contacts`, `/notes`
- Vercel Analytics script forwarding for sub-app routes so analytics works across all zones
- Shared ecosystem navigation via `@helvety/ui/helvety-shell-navbar` (grouped app/tool switcher and auth-aware menu; `app/layout.tsx` seeds `initialUser` via `@helvety/shared/layout-session-bootstrap` so the bar does not flash through a loading-only state when a session exists)
- Root `app/layout.tsx` uses `@helvety/ui/helvety-public-shell-root-layout` (scroll-area main, Speed Insights) and `@helvety/shared/seo` (`createHelvetyProductMetadata`) for gateway metadata
- Public legal pages, cookie notice, and abuse-reporting entry points
- Canonical metadata and sitemap/robots endpoints for indexable content

## Routing and SEO

- Sub-app forwarding is defined in `next.config.ts`.
- Vercel Analytics `/<id>/script.js` requests are forwarded by referer path to the correct zone origin.
- Direct-domain sub-app roots are expected to redirect to their base path.
- `apps/web` is indexable and serves:
  - `/robots.txt`
  - `/sitemap.xml` (web-owned pages)
  - `/sitemap-index.xml` (public sitemap index for `web`, `store`, `pdf`, and `image-upscaler`)

## Security Model

- `proxy.ts` handles lightweight request setup (CSP headers + Supabase cookie refresh), not full auth enforcement. The gateway uses a **custom** `config.matcher` (it must skip whole sub-apps like `/pdf`), but the static-file extension suffix is kept aligned with zone apps (`SECURITY_PROXY_MATCHER` in `@helvety/shared/proxy`): paths ending in extensions such as `mjs`, `wasm`, and `json` bypass the proxy.
- CSRF cookie bootstrap is intentionally disabled in the web gateway by using the `public-marketing` security proxy profile (equivalent to `includeCsrf: false`) because state-changing auth/data actions execute in app-specific zones.
- Redirect target validation is enforced in shared auth callback/action flows via shared redirect-validation utilities.
- Sensitive auth/data enforcement remains in app-specific zones (`auth`, `store`, `tasks`, `contacts`, `notes`).

## Environment Variables

Copy `env.template` to `.env.local`.

| Variable                               | Required                       | Server-only | Description                                     |
| -------------------------------------- | ------------------------------ | ----------- | ----------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Yes                            | No          | Supabase project URL                            |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes                            | No          | Supabase publishable key                        |
| `AUTH_URL`                             | Vercel production (`VERCEL=1`) | Yes         | Internal Vercel URL for auth zone rewrites      |
| `STORE_URL`                            | Vercel production (`VERCEL=1`) | Yes         | Internal Vercel URL for store zone rewrites     |
| `PDF_URL`                              | Vercel production (`VERCEL=1`) | Yes         | Internal Vercel URL for PDF zone rewrites       |
| `IMAGE_UPSCALER_URL`                   | Vercel production (`VERCEL=1`) | Yes         | Internal Vercel URL for image-upscaler rewrites |
| `TASKS_URL`                            | Vercel production (`VERCEL=1`) | Yes         | Internal Vercel URL for tasks zone rewrites     |
| `CONTACTS_URL`                         | Vercel production (`VERCEL=1`) | Yes         | Internal Vercel URL for contacts zone rewrites  |
| `NOTES_URL`                            | Vercel production (`VERCEL=1`) | Yes         | Internal Vercel URL for notes zone rewrites     |

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

Licensed under the [MIT License](../../LICENSE).
