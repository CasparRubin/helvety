# Helvety Web

Gateway app for `helvety.com` and public legal/SEO surfaces.

**App URL:** <https://helvety.com>  
**Monorepo path:** `apps/web`

## Key Features

- **Home (`/`):** [`HeroMarketingShell`](components/hero-marketing-shell.tsx) from [`app/page.tsx`](app/page.tsx) server-renders a brand-first hero: large **Helvety** wordmark, Swiss-origin headline accent, company-values tagline (`private · simple · clean` from `HELVETY_COMPANY_VALUES_TAGLINE`) via [`HeroCompanyValuesTagline`](components/hero-company-values-tagline.tsx), soft radial atmosphere over `bg-background`, light CSS enter motion, and a responsive two-CTA row: primary **Helvety Cloud** (`urls.cloud` → `https://helvety.cloud`; flagship E2EE SaaS blurb) plus outline **Browse other products** deep-linked to `urls.storeProducts` (`/store/products`; open-source tools blurb, no Microsoft 365 mention). The page also mounts [`StoreProductsSpeculation`](components/store-products-speculation.tsx). React Bits **Shuffle / ShinyText** presets live in [`hero-text.tsx`](components/hero-text.tsx) for vendor refresh and tests; production `/` does **not** mount them.
- **Public shell:** [`app/layout.tsx`](app/layout.tsx) composes `HelvetyPublicShellRootLayout` (`mainVariant: "scroll-area"`; the shell injects `HelvetyThemeInitScript` in `<head>`). The gateway uses the shared shell defaults plus `bodyClassName="overflow-x-clip"` so theme background paint stays stable without hero-specific overflow escapes. See [`packages/ui/README.md`](../../packages/ui/README.md). Root [`loading.tsx`](app/loading.tsx) uses shared `HelvetyShellRouteLoading` (`@helvety/ui/helvety-shell-route-loading`).
- **Legal pages (`/privacy`, `/terms`, `/impressum`):** shared shell via [`LegalPageShell`](components/legal-document.tsx) and [`legal.css`](app/legal.css). Privacy tables use `LegalTableWrap` + shadcn [`@helvety/ui/table`](../../packages/ui/src/table.tsx) (`layout="scroll"` for processors, `layout="cards"` with `data-label` for the cookies/localStorage table on small screens).
- Multi-zone gateway rewrites for `/store`, `/pdf`, `/image-editor`, `/ocr`
- **Cross-zone nav performance:** Switching apps is always a full document load (separate Next deployments). Store CTAs deep-link to `urls.storeProducts` (`/store/products`) to skip the `/store` → `/store/products` redirect; the homepage mounts [`StoreProductsSpeculation`](components/store-products-speculation.tsx) (Speculation Rules prefetch for that path only, with the request CSP nonce so `script-src` allows it). Do not expect SPA-soft navigation across zones.
- Shared navigation across helvety.com web zones via `@helvety/ui/helvety-shell-navbar`. The shell’s **AppSwitcher** uses absolute `urls.*` hrefs so it works from every zone’s Next **`basePath`**; marketing components on `/` may still use **`getLocalAppHref`** for path-shaped same-origin links (see [`packages/shared/README.md`](../../packages/shared/README.md) and [`packages/ui/README.md`](../../packages/ui/README.md)).
- `@helvety/shared/seo` (`createHelvetyProductMetadata`) plus `WEB_SITE_DESCRIPTION` / `HELVETY_WEB_DEFAULT_TITLE` from `@helvety/shared` for gateway metadata, Open Graph, Twitter, and JSON-LD (company positioning: Private, simple, clean; Swiss origin; no license terms in SEO)
- Public legal pages, shared footer legal nav (see Privacy for storage), and abuse-reporting entry points
- Canonical metadata and sitemap/robots endpoints for indexable content

## Routing and SEO

- Default title and description come from `HELVETY_WEB_DEFAULT_TITLE` and `WEB_SITE_DESCRIPTION` in [`app/layout.tsx`](app/layout.tsx); [`public/manifest.json`](public/manifest.json) and [`public/llms.txt`](public/llms.txt) stay aligned (tagline is company/product copy; AGPL details live under `## Licensing` in `llms.txt` only).
- Sub-app forwarding is defined in `next.config.ts`.
- All Helvety Next apps use `experimental.cssChunking: "strict"` via `@helvety/config/next`, which may reduce (not eliminate) unused CSS preload console warnings while `app/loading.tsx` is active.
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

### React Bits (hero)

React Bits text animation sources live under [`components/vendor/`](components/vendor/) (`Shuffle.tsx`, `ShinyText.tsx`). Production `/` uses **server-rendered** copy in [`hero-marketing-shell.tsx`](components/hero-marketing-shell.tsx) (including the simple middle-dot company-values tagline in [`HeroCompanyValuesTagline`](components/hero-company-values-tagline.tsx) from `HELVETY_COMPANY_VALUES_TAGLINE`) on a plain `bg-background`. [`hero-text.tsx`](components/hero-text.tsx) holds **Shuffle / ShinyText presets** for vendor refresh and unit tests ([`hero-text.test.tsx`](components/hero-text.test.tsx)); it is **not** imported by the production shell. Shell tests live in [`hero-marketing-shell.test.tsx`](components/hero-marketing-shell.test.tsx). **`Shuffle.tsx`** uses GSAP; **`ShinyText.tsx`** imports **`framer-motion`** (not `motion/react`). Vitest mocks `framer-motion` in hero tests and stubs or tests Shuffle separately. ESLint relaxes style rules for `components/vendor/**` in `@helvety/config` (no per-file `eslint-disable`).

Refresh text components from `apps/web` (CLI may write to `components/` first; move reconciled files into `components/vendor/` and keep imports aligned):

```bash
bunx shadcn add @react-bits/ShinyText-TS-TW @react-bits/Shuffle-TS-TW
```

Reconcile Helvety tweaks in [`hero-text.tsx`](components/hero-text.tsx) after refresh.

For monorepo setup and `ci:check` / `ci:release` commands, use the root [`README.md`](../../README.md).

## Legal and Support

- Privacy: <https://helvety.com/privacy>
- Terms: <https://helvety.com/terms>
- Impressum and abuse reporting: <https://helvety.com/impressum#abuse>
- Contact: <mailto:contact@helvety.com>

## License

Licensed under the [GNU Affero General Public License v3.0 or later](../../LICENSE).
