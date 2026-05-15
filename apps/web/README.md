# Helvety Web

Gateway app for `helvety.com` and public legal/SEO surfaces.

**App URL:** <https://helvety.com>  
**Monorepo path:** `apps/web`

## Key Features

- **Home (`/`):** [`HeroSection`](components/hero-section.tsx) from [`app/page.tsx`](app/page.tsx): Store CTA and WebGL [**Hyperspeed**](components/Hyperspeed.tsx) loaded via [`HeroHyperspeedBackdrop`](components/hero-hyperspeed-backdrop.tsx) with `next/dynamic` (`ssr: false` so the chunk never runs on the server). **Black base + black veil** that **fades out** after the first composited WebGL frame (WebGL stays opaque underneath; renderer uses opaque **`setClearColor`** + solid **`scene.background`** so alpha canvas never flashes the page; chunk `loading` uses the same black fill). The **full-bleed host** is always in the SSR tree for stable hydration; **`motion-reduce:hidden`** hides the backdrop and **`motion-reduce:bg-background`** tints the section when `prefers-reduced-motion: reduce`, and Hyperspeed **bails out before WebGL** under the same media query. Copy uses **`motion-safe:`** text shadow. Hero text ([`hero-text.tsx`](components/hero-text.tsx)): React Bits [Shuffle](https://reactbits.dev/text-animations/shuffle) eyebrow, [Gradient Text](https://reactbits.dev/text-animations/gradient-text) on Switzerland, [Shiny Text](https://reactbits.dev/text-animations/shiny-text) tagline; **`useReducedMotion`** and Shuffle **`respectReducedMotion`** swap to static/muted copy when **`prefers-reduced-motion: reduce`**. The copy block fade-in uses Framer **`MotionConfig reducedMotion="user"`**. Backdrop uses **`cursor-grab` / `active:cursor-grabbing`** (press or hold to boost speed; no zoom-lens cursor). Distortion includes **subtle per-session variation** (capped reseeding + smoothing, **gentle turbulent defaults** for long straights) with **mobile/coarse-pointer scaling**, **finer road mesh**, and frame-time dampening for stable performance. CTA keeps **intrinsic width** on all breakpoints (no mobile `w-full`). For a **static** turbulent curve (no runtime uniform reseeding), pass **`variation: { enabled: false }`** in Hyperspeed `effectOptions`. Tunables: [`hyperspeed-default-preset.ts`](components/hyperspeed-default-preset.ts), [`hero-hyperspeed-options.ts`](components/hero-hyperspeed-options.ts), lateral mask [`hero-hyperspeed-bleed.css`](components/hero-hyperspeed-bleed.css).
- **Public shell:** [`app/layout.tsx`](app/layout.tsx) uses `HelvetyPublicShellRootLayout` (`mainVariant: "scroll-area"`, Speed Insights). Optional `shellColumnClassName`, `scrollAreaRootClassName`, `scrollAreaViewportClassName`, and `bodyClassName` let the hero’s full-bleed WebGL host span the viewport horizontally without Radix clipping; documented on [`packages/ui/README.md`](../../packages/ui/README.md). The gateway passes `scrollAreaViewportClassName` with `bg-background` so the scroll column paints like the theme during transitions; root [`loading.tsx`](app/loading.tsx) wraps the route fallback in `min-h-svh bg-background`. `HelvetyPublicShellRootLayout` merges `bg-background text-foreground` on `<body>` so the document canvas matches the active theme.
- Multi-zone gateway rewrites for `/auth`, `/store`, `/pdf`, `/image-upscaler`, `/tasks`, `/contacts`, `/notes`
- Vercel Analytics script forwarding for sub-app routes so analytics works across all zones
- Shared navigation across helvety.com web zones via `@helvety/ui/helvety-shell-navbar` (`app/layout.tsx` seeds `initialUser` through `bootstrapPublicLayoutUser()` so the bar does not flash loading when a session exists). The shell’s **AppSwitcher** uses absolute `urls.*` hrefs so it works from every zone’s Next **`basePath`**; marketing components on `/` may still use **`getLocalAppHref`** for path-shaped same-origin links (see [`packages/shared/README.md`](../../packages/shared/README.md) and [`packages/ui/README.md`](../../packages/ui/README.md)).
- `@helvety/shared/seo` (`createHelvetyProductMetadata`) plus `WEB_SITE_DESCRIPTION` / `HELVETY_WEB_DEFAULT_TITLE` from `@helvety/shared` for gateway metadata, Open Graph, Twitter, and JSON-LD (company positioning: private · simple · clean; Swiss origin; no license terms in SEO)
- Public legal pages, cookie notice, and abuse-reporting entry points
- Canonical metadata and sitemap/robots endpoints for indexable content

## Routing and SEO

- Default title and description come from `HELVETY_WEB_DEFAULT_TITLE` and `WEB_SITE_DESCRIPTION` in [`app/layout.tsx`](app/layout.tsx); [`public/manifest.json`](public/manifest.json) and [`public/llms.txt`](public/llms.txt) stay aligned (tagline is company/product copy; AGPL details live under `## Licensing` in `llms.txt` only).
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

### React Bits (hero)

Text animations and Hyperspeed are vendored under [`components/`](components/) via the `@react-bits` registry in [`components.json`](components.json). Presets live in [`hero-text.tsx`](components/hero-text.tsx); tests in [`hero-text.test.tsx`](components/hero-text.test.tsx).

Refresh text components from `apps/web`:

```bash
bunx shadcn add @react-bits/ShinyText-TS-TW @react-bits/GradientText-TS-TW @react-bits/Shuffle-TS-TW
```

Reconcile Helvety tweaks in [`hero-text.tsx`](components/hero-text.tsx) after refresh. [**Hyperspeed**](components/Hyperspeed.tsx) is maintained manually (not the shadcn text registry).

For monorepo setup and CI/release commands, use the root [`README.md`](../../README.md).

## Legal and Support

- Privacy: <https://helvety.com/privacy>
- Terms: <https://helvety.com/terms>
- Impressum and abuse reporting: <https://helvety.com/impressum#abuse>
- Contact: <mailto:contact@helvety.com>

## License

Licensed under the [GNU Affero General Public License v3.0 or later](../../LICENSE).
