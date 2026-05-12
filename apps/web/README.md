# Helvety Web

Gateway app for `helvety.com` and public legal/SEO surfaces.

**App URL:** <https://helvety.com>  
**Monorepo path:** `apps/web`

## Key Features

- **Home (`/`):** [`HeroSection`](components/hero-section.tsx) from [`app/page.tsx`](app/page.tsx) — Store CTA and WebGL [**Hyperspeed**](components/Hyperspeed.tsx) loaded with `next/dynamic` (`ssr: false` so the chunk never runs on the server). The **full-bleed host** is always in the SSR tree for stable hydration; **`motion-reduce:hidden`** hides the backdrop and **`motion-reduce:bg-background`** tints the section when `prefers-reduced-motion: reduce`, and Hyperspeed **bails out before WebGL** under the same media query. Copy uses **`motion-safe:`** text shadow; hero motion uses **`MotionConfig reducedMotion="user"`** with Framer so entrance animation respects system preference without branching markup. Backdrop uses **`cursor-grab` / `active:cursor-grabbing`** (press or hold to boost speed — no zoom-lens cursor). Tagline (`private · simple · clean`) uses **`hero-tagline-glow`** (CSS shimmer + `@media (prefers-reduced-motion: reduce)` fallback in [`hero-hyperspeed-bleed.css`](components/hero-hyperspeed-bleed.css)). CTA keeps **intrinsic width** on all breakpoints (no mobile `w-full`). Tunables: [`hyperspeed-default-preset.ts`](components/hyperspeed-default-preset.ts), [`hero-hyperspeed-options.ts`](components/hero-hyperspeed-options.ts), lateral mask [`hero-hyperspeed-bleed.css`](components/hero-hyperspeed-bleed.css).
- **Public shell:** [`app/layout.tsx`](app/layout.tsx) uses `HelvetyPublicShellRootLayout` (`mainVariant: "scroll-area"`, Speed Insights). Optional `shellColumnClassName`, `scrollAreaRootClassName`, `scrollAreaViewportClassName`, and `bodyClassName` let the hero’s full-bleed WebGL host span the viewport horizontally without Radix clipping; documented on [`packages/ui/README.md`](../../packages/ui/README.md).
- **`store-apps-showcase`:** [`store-apps-showcase.tsx`](components/store-apps-showcase.tsx) is **not imported** on `/` today — add it back when you ship marketing bands below the hero.
- Multi-zone gateway rewrites for `/auth`, `/store`, `/pdf`, `/image-upscaler`, `/tasks`, `/contacts`, `/notes`
- Vercel Analytics script forwarding for sub-app routes so analytics works across all zones
- Shared navigation across helvety.com web zones via `@helvety/ui/helvety-shell-navbar` (`app/layout.tsx` seeds `initialUser` through `bootstrapPublicLayoutUser()` so the bar does not flash loading when a session exists)
- `@helvety/shared/seo` (`createHelvetyProductMetadata`) for gateway-level metadata / OG defaults
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
