# Helvety Web

Gateway app for `helvety.com` and public legal/SEO surfaces.

**App URL:** <https://helvety.com>  
**Monorepo path:** `apps/web`

## Key Features

- **Home (`/`):** [`HeroMarketingShell`](components/hero-marketing-shell.tsx) from [`app/page.tsx`](app/page.tsx) server-renders a brand-first hero: **Open-source Software** title, static **Made in Switzerland** (Switzerland in brand red), company-values tagline (`private · simple · clean` from `HELVETY_COMPANY_VALUES_TAGLINE`) via [`HeroCompanyValuesTagline`](components/hero-company-values-tagline.tsx), plain themed `bg-background`, light CSS enter motion, and a single primary **Browse products** CTA deep-linked to `urls.storeProducts` (`/store/products`; one-line verify-claims blurb, no Microsoft 365 mention). The page also mounts [`StoreProductsSpeculation`](components/store-products-speculation.tsx).
- **Public shell:** [`app/layout.tsx`](app/layout.tsx) composes `HelvetyPublicShellRootLayout` (`mainVariant: "scroll-area"`; the shell injects `HelvetyThemeInitScript` in `<head>`). The gateway uses the shared shell defaults plus `bodyClassName="overflow-x-clip"` so theme background paint stays stable without hero-specific overflow escapes. See [`packages/ui/README.md`](../../packages/ui/README.md). Root [`loading.tsx`](app/loading.tsx) uses shared `HelvetyShellRouteLoading` (`@helvety/ui/helvety-shell-route-loading`).
- **Legal pages (`/privacy`, `/terms`, `/impressum`):** shared shell via [`LegalPageShell`](components/legal-document.tsx) and [`legal.css`](app/legal.css). Privacy tables use `LegalTableWrap` + shadcn [`@helvety/ui/table`](../../packages/ui/src/table.tsx) (`layout="scroll"` for processors, `layout="cards"` with `data-label` for the cookies/localStorage table on small screens).
- Multi-zone gateway rewrites for `/store`, `/pdf`, `/image-editor`, `/ocr`
- **Cross-zone nav performance:** Switching apps is always a full document load (separate Next deployments). Store CTAs deep-link to `urls.storeProducts` (`/store/products`) to skip the `/store` → `/store/products` redirect; the homepage mounts [`StoreProductsSpeculation`](components/store-products-speculation.tsx) (DOM-injected Speculation Rules prefetch for that path only, with the request CSP nonce so `script-src` allows it). Do not expect SPA-soft navigation across zones.
- Shared navigation across helvety.com web zones via `@helvety/ui/helvety-shell-navbar`. The shell’s **AppSwitcher** uses absolute `urls.*` hrefs so it works from every zone’s Next **`basePath`**; marketing components on `/` may still use **`getLocalAppHref`** for path-shaped same-origin links (see [`packages/shared/README.md`](../../packages/shared/README.md) and [`packages/ui/README.md`](../../packages/ui/README.md)).
- `@helvety/shared/seo` (`createHelvetyProductMetadata`) plus `WEB_SITE_DESCRIPTION` / `HELVETY_WEB_DEFAULT_TITLE` from `@helvety/shared` for gateway metadata, Open Graph, Twitter, and JSON-LD (company positioning: Private, simple, clean; Swiss origin; no license terms in SEO)
- Public legal pages, shared footer legal nav (see Privacy for storage), and abuse-reporting entry points
- Canonical metadata and sitemap/robots endpoints for indexable content

## Routing and SEO

- Default title and description come from `HELVETY_WEB_DEFAULT_TITLE` and `WEB_SITE_DESCRIPTION` in [`app/layout.tsx`](app/layout.tsx); [`public/manifest.json`](public/manifest.json) and [`public/llms.txt`](public/llms.txt) stay aligned (tagline is company/product copy; AGPL details live under `## Licensing` in `llms.txt` only).
- Sub-app forwarding is defined in `next.config.ts`.
- Helvety Next apps share Turbopack + security headers via `@helvety/config/next`. Unused CSS preload console warnings may still appear while `app/loading.tsx` is active.
- Direct-domain sub-app roots are expected to redirect to their base path.
- `apps/web` is indexable and serves:
  - `/robots.txt` (RFC 9309 source of truth: allow public crawl, disallow non-indexable API paths via `GATEWAY_DISALLOWED_PATHS`, advertise `/sitemap-index.xml`)
  - `/sitemap.xml` (home, impressum, privacy, terms; no `llms.txt`)
  - `/sitemap-index.xml` (index of public zone sitemaps: `web`, `store`, `pdf`, `image-editor`, `ocr`)

## Security Model

- `proxy.ts` handles lightweight request setup (CSP headers), not full application enforcement. The gateway uses the **`public-marketing`** profile. The gateway uses a **custom** `config.matcher` (it must skip whole sub-apps like `/pdf`, `/image-editor`, and `/ocr`), but the static-file extension suffix is kept aligned with zone apps (`SECURITY_PROXY_MATCHER` in `@helvety/shared/proxy`): paths ending in extensions such as `mjs`, `wasm`, and `json` bypass the proxy.

## Environment Variables

Copy `env.template` to `.env.local`.

| Variable           | Required                       | Server-only | Description                                   |
| ------------------ | ------------------------------ | ----------- | --------------------------------------------- |
| `STORE_URL`        | Vercel production (`VERCEL=1`) | Yes         | Internal Vercel URL for store zone rewrites   |
| `PDF_URL`          | Vercel production (`VERCEL=1`) | Yes         | Internal Vercel URL for PDF zone rewrites     |
| `IMAGE_EDITOR_URL` | Vercel production (`VERCEL=1`) | Yes         | Internal Vercel URL for image-editor rewrites |
| `OCR_URL`          | Vercel production (`VERCEL=1`) | Yes         | Internal Vercel URL for OCR zone rewrites     |

Local development falls back to localhost targets; production uses trusted internal hosts.

Optional monorepo variables are documented as comments in [`env.template`](./env.template). Shared behavior is in the root [`README.md`](../../README.md) Environment Model; Vercel Production/Preview setup: [`docs/env-vercel-audit-checklist.md`](../../docs/env-vercel-audit-checklist.md). Run `bun run consistency:local-env` from the repo root to audit local `.env.local` files.

## Development and Testing

Run from `apps/web`:

```bash
bun run dev
bun run test
bun run test:watch
bun run test:coverage
```

Hero coverage lives in [`hero-marketing-shell.test.tsx`](components/hero-marketing-shell.test.tsx) (copy/CTA wiring; mocks `next/link` only). Homepage composition is asserted in [`app/home-page-wiring.test.ts`](app/home-page-wiring.test.ts).

For monorepo setup and `ci:check` / `ci:release` commands, use the root [`README.md`](../../README.md).

## Legal and Support

- Privacy: <https://helvety.com/privacy>
- Terms: <https://helvety.com/terms>
- Impressum and abuse reporting: <https://helvety.com/impressum#abuse>
- Contact: <mailto:contact@helvety.com>

## License

Licensed under the [GNU Affero General Public License v3.0 or later](../../LICENSE).
