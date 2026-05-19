# Helvety Web

Gateway app for `helvety.com` and public legal/SEO surfaces.

**App URL:** <https://helvety.com>  
**Monorepo path:** `apps/web`

## Key Features

- **Home (`/`):** [`HeroSection`](components/hero-section.tsx) from [`app/page.tsx`](app/page.tsx): Store CTA and WebGL [**Hyperspeed**](components/vendor/Hyperspeed.tsx) via [`HeroHyperspeedBackdrop`](components/hero-hyperspeed-backdrop.tsx) (`createHelvetyWebglDynamic` from [`@helvety/light-pillar/webgl-dynamic`](../../packages/light-pillar/README.md); `ssr: false`). **Light and dark:** the bleed host mounts when motion is allowed (all viewport widths); **`prefers-reduced-motion: reduce`** uses plain **`bg-background`**. Brand pair **dark = white + red**, **light = black + red** ([`getHeroHyperspeedEffectOptions`](components/hero-hyperspeed-options.ts), [`@helvety/brand`](../../packages/brand/src/react-bits-palette.ts)); light mode uses a darker asphalt road tint and lower bloom threshold so the street and motion glow read like dark mode. When Hyperspeed runs: the backdrop stays hidden until the first composited frame with a matching `html.dark`, then **fades in** over **700ms**; theme toggle hides the layer, remounts Hyperspeed, and fades in again; cross-zone navigation, `pagehide`, and `visibilitychange` hide the layer before unload. `HelvetyThemeInitScript` in `<head>` avoids theme FOUC on `bg-background`. Copy uses theme-aware text shadow over the road; tagline [Shiny Text](https://reactbits.dev/text-animations/shiny-text) uses white or black shine per theme ([`hero-text.tsx`](components/hero-text.tsx)). Hero text: React Bits [Shuffle](https://reactbits.dev/text-animations/shuffle) eyebrow (5s loop), static red **Switzerland**; **`useReducedMotion`** / Shuffle **`respectReducedMotion`** use static tagline copy when motion is reduced. Framer **`MotionConfig reducedMotion="user"`** on the copy column. **`cursor-grab` / `active:cursor-grabbing`** on the road. Distortion: per-session variation, coarse-pointer scaling, finer mesh, frame-time dampening. CTA keeps **intrinsic width** on all breakpoints. Tunables: [`hyperspeed-default-preset.ts`](components/hyperspeed-default-preset.ts), [`hero-hyperspeed-options.ts`](components/hero-hyperspeed-options.ts), [`hero-hyperspeed-bleed.css`](components/hero-hyperspeed-bleed.css).
- **Public shell:** [`app/layout.tsx`](app/layout.tsx) uses `HelvetyPublicShellRootLayout` (`mainVariant: "scroll-area"`, Speed Insights) with blocking `HelvetyThemeInitScript` in `<head>`. Optional `shellColumnClassName`, `scrollAreaRootClassName`, `scrollAreaViewportClassName`, and `bodyClassName` let the hero’s full-bleed WebGL host span the viewport horizontally without Radix clipping; documented on [`packages/ui/README.md`](../../packages/ui/README.md). The gateway passes `scrollAreaViewportClassName` with `bg-background` so the scroll column matches the resolved theme; root [`loading.tsx`](app/loading.tsx) uses shared `HelvetyShellRouteLoading` (`@helvety/ui/helvety-shell-route-loading`). Hyperspeed WebGL utilities live in [`packages/light-pillar/README.md`](../../packages/light-pillar/README.md).
- Multi-zone gateway rewrites for `/auth`, `/store`, `/pdf`, `/image-upscaler`, `/tasks`, `/contacts`, `/notes`, `/links`
- Vercel Analytics script forwarding for sub-app routes (requires Web Analytics enabled on each zone’s Vercel project)
- Shared navigation across helvety.com web zones via `@helvety/ui/helvety-shell-navbar` (`app/layout.tsx` seeds `initialUser` through `bootstrapPublicLayoutUser()` so the bar does not flash loading when a session exists). The shell’s **AppSwitcher** uses absolute `urls.*` hrefs so it works from every zone’s Next **`basePath`**; marketing components on `/` may still use **`getLocalAppHref`** for path-shaped same-origin links (see [`packages/shared/README.md`](../../packages/shared/README.md) and [`packages/ui/README.md`](../../packages/ui/README.md)).
- `@helvety/shared/seo` (`createHelvetyProductMetadata`) plus `WEB_SITE_DESCRIPTION` / `HELVETY_WEB_DEFAULT_TITLE` from `@helvety/shared` for gateway metadata, Open Graph, Twitter, and JSON-LD (company positioning: private · simple · clean; Swiss origin; no license terms in SEO)
- Public legal pages, cookie notice, and abuse-reporting entry points
- Canonical metadata and sitemap/robots endpoints for indexable content

## Routing and SEO

- Default title and description come from `HELVETY_WEB_DEFAULT_TITLE` and `WEB_SITE_DESCRIPTION` in [`app/layout.tsx`](app/layout.tsx); [`public/manifest.json`](public/manifest.json) and [`public/llms.txt`](public/llms.txt) stay aligned (tagline is company/product copy; AGPL details live under `## Licensing` in `llms.txt` only).
- Sub-app forwarding is defined in `next.config.ts`.
- Vercel Analytics `/<id>/script.js` requests are forwarded by referer path to the correct zone origin ([`lib/zone-analytics-referer.ts`](lib/zone-analytics-referer.ts); pattern allows `?query` and `#hash` after the zone path so deep links like `/links?link=` still load analytics). **Ops:** enable Web Analytics on **every** zone Vercel project (`web`, `auth`, `store`, `pdf`, `image-upscaler`, `tasks`, `contacts`, `notes`, `links`) and redeploy each. Set `NEXT_PUBLIC_HELVETY_VERCEL_ANALYTICS=false` locally to skip `HelvetyVercelAnalytics` in shared layouts.
- All Helvety Next apps use `experimental.cssChunking: "strict"` via `@helvety/config/next`, which may reduce (not eliminate) unused CSS preload console warnings while `app/loading.tsx` or encryption gates are active.
- Direct-domain sub-app roots are expected to redirect to their base path.
- `apps/web` is indexable and serves:
  - `/robots.txt`
  - `/sitemap.xml` (web-owned pages)
  - `/sitemap-index.xml` (public sitemap index for `web`, `store`, `pdf`, and `image-upscaler`)

## Security Model

- `proxy.ts` handles lightweight request setup (CSP headers + Supabase cookie refresh), not full auth enforcement. The gateway uses a **custom** `config.matcher` (it must skip whole sub-apps like `/pdf`), but the static-file extension suffix is kept aligned with zone apps (`SECURITY_PROXY_MATCHER` in `@helvety/shared/proxy`): paths ending in extensions such as `mjs`, `wasm`, and `json` bypass the proxy.
- CSRF cookie bootstrap is intentionally disabled in the web gateway by using the `public-marketing` security proxy profile (equivalent to `includeCsrf: false`) because state-changing auth/data actions execute in app-specific zones. The gateway therefore does **not** require `HELVETY_COOKIE_SIGNING_SECRET`.
- Redirect target validation is enforced in shared auth callback/action flows via shared redirect-validation utilities.
- Sensitive auth/data enforcement remains in app-specific zones (`auth`, `store`, `tasks`, `contacts`, `notes`, `links`).

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
| `LINKS_URL`                            | Vercel production (`VERCEL=1`) | Yes         | Internal Vercel URL for links zone rewrites     |

Local development falls back to localhost targets; production uses trusted internal hosts.

Optional CI/monorepo variables are documented as comments in [`env.template`](./env.template). Shared behavior is in the root [`README.md`](../../README.md) Environment Model.

## Development and Testing

Run from `apps/web`:

```bash
bun run dev
bun run test
bun run test:watch
bun run test:coverage
```

### React Bits (hero)

React Bits motion sources live under [`components/vendor/`](components/vendor/) (`Hyperspeed.tsx`, `Shuffle.tsx`, `ShinyText.tsx`). Hero presets and composition stay in [`hero-text.tsx`](components/hero-text.tsx) (tests in [`hero-text.test.tsx`](components/hero-text.test.tsx)). Vendored motion components import **`framer-motion`** (not `motion/react`); Vitest mocks `framer-motion` in hero tests. ESLint relaxes style rules for `components/vendor/**` in `@helvety/config` (no per-file `eslint-disable`).

Refresh text components from `apps/web` (CLI may write to `components/` first; move reconciled files into `components/vendor/` and keep imports aligned):

```bash
bunx shadcn add @react-bits/ShinyText-TS-TW @react-bits/Shuffle-TS-TW
```

Reconcile Helvety tweaks in [`hero-text.tsx`](components/hero-text.tsx) after refresh. [**Hyperspeed**](components/vendor/Hyperspeed.tsx) is maintained manually in `components/vendor/` (not the shadcn text registry).

For monorepo setup and CI/release commands, use the root [`README.md`](../../README.md).

## Legal and Support

- Privacy: <https://helvety.com/privacy>
- Terms: <https://helvety.com/terms>
- Impressum and abuse reporting: <https://helvety.com/impressum#abuse>
- Contact: <mailto:contact@helvety.com>

## License

Licensed under the [GNU Affero General Public License v3.0 or later](../../LICENSE).
