# Helvety Store

Product catalog app for Helvety products: specs, Store-hosted downloads (for example SPFx), and install links (for example the Chrome Web Store for browser extensions) for helvety.com web apps **and** separately distributed software, including items whose primary source lives outside this monorepo.

**App URL:** <https://helvety.com/store>  
**Monorepo path:** `apps/store`

## Key Features

- Root `app/layout.tsx` composes `@helvety/ui/helvety-public-shell-root-layout` (injects `HelvetyThemeInitScript` in `<head>`) with `themeProviderScope: "navbar-only"` so `ThemeProvider` wraps only the navbar; `scrollAreaMainPrefix` pins [`StoreNav`](components/store-nav.tsx) above the main `ScrollArea` (opaque `CommandBar` `variant="solid"`; section nav does not scroll away with the catalog); `wrapInsideTooltipProvider` wraps the shell in `CSRFProvider`; `bootstrapE2eeLayoutSession()` from `@helvety/shared/layout-session-bootstrap` feeds CSRF and navbar / `StoreNav`; metadata comes from `@helvety/shared/seo` (`createHelvetyProductMetadata`)
- Public product catalog at `/store/products` with product cards that overlay badges on artwork: per-type tinted labels (sky / violet / amber) and a frosted “Art by …” artist credit ([`components/products/product-badge.tsx`](components/products/product-badge.tsx))
- Public SPFx package download endpoints (no login required); browser extensions link to vendor stores (for example Chrome Web Store) from product pages
- Optional authenticated account page at `/store/account`
- Product-detail pages with statically imported artwork; unknown catalog slugs return HTTP 404 via `notFound()` on the server (`app/products/[slug]/page.tsx`) with `app/products/[slug]/not-found.tsx`; `generateMetadata` emits noindex “Product Not Found” metadata when the slug is absent from `@helvety/shared/store-catalog` (without calling `notFound()` in metadata)
- Product listing loads the grid client-only (`next/dynamic` with `ssr: false` on `/products`); detail SEO metadata and JSON-LD use `@helvety/shared/store-catalog` only (no server import of `products.ts`); sitemap still uses `lib/data/product-catalog-cache.ts` at build time

## Package Download Behavior

- Download files are served from Supabase Storage bucket `packages`.
- `spfx/helvety-spo-explorer`: newest `.sppkg` by timestamp/name.
- **Power Platform Configurator** installs from the [Chrome Web Store](https://chromewebstore.google.com/detail/power-platform-configurat/mdneakhceachnimmejciaehnfjfabang) only (no public ZIP in bucket `packages`). Retired `power-automate-*` and `power-platform-configurator` package ids are not served (`lib/packages/create-package-download.ts` and the public download route return not-found).
- If storage listing fails, the download route returns not-found (no silent filename fallback).
- Public package downloads use `lib/download-security.ts` (`buildPublicDownloadRateLimitKey`, `packageIdSchema`, `isAllowedDownloadUrl`) and `lib/packages/create-package-download.ts` for signing.
- The public download route responds with an HTTP redirect to a signed Supabase Storage URL. Redirect targets must be `https:` on the Supabase project origin from `NEXT_PUBLIC_SUPABASE_URL` (via `getSupabaseUrl()`); `SUPABASE_URL` alone is not used for this check. Paths must stay under `/storage/v1/object/sign/packages/` with at least folder + file segments, no `..` or `%2e%2e` traversal (normalized paths that escape the `packages` prefix are rejected). If the public Supabase URL is unset or invalid, `isAllowedDownloadUrl` rejects all redirect targets (fail-closed; no open redirect). Storage listing ignores object names containing `/`, `\`, or `..`. Retired **package/download** ids return not-found; that is separate from **product page** 404s for unknown `helvety-*` catalog slugs (see Key Features above).
- Downloads are IP-rate-limited (2/min per IP on the route) and fail closed when trusted client IP is unavailable in production.

## Adding a New Product

Card-level fields (name, blurb, release date, type, category, runs-on, free /
open-source flags) live in `@helvety/shared/store-catalog` as the single source
of truth for Store product cards (listing grid, detail metadata, and related surfaces).

1. **Add the card entry** in `packages/shared/src/store-catalog.ts`:
   - Append to `STORE_PRODUCT_CARDS` (preserves source order; sorting is done at
     read time via `getStoreCatalogNewestFirst()` / `compareStoreCatalogEntriesNewestFirst`).
   - If the new product shares a `releaseDate` with an existing card, add a
     priority value to `PRODUCT_RELEASE_TIE_PRIORITY` (higher = newer).
   - Run `bun run test --filter=@helvety/shared` (from repo root; same `--filter=` style as the root [`README.md`](../../README.md)) to confirm catalog tests still pass: id uniqueness, `PRODUCT_RELEASE_TIE_PRIORITY` parity with every card id, runs-on labels, free/open-source flags, and default sort endpoints.
2. **Add the full Store product** in `apps/store/lib/data/products.ts`:
   - Call `cardCore("<id>", "<saas|software|physical>")`: TS narrows `type`
     to the literal you pass, and the helper throws at startup if the catalog
     declares a different `type` for that id (no `as` casts needed).
   - Spread the `c<Name>` object into the `Product` literal and fill in the
     long-copy fields (`description`, `features`, `pricing` (tier metadata and
     free-tier flags only; the Store does not render price amounts in the UI),
     `links`,
     `metadata.releaseDate: c<Name>.releaseDate`, `image: productArtwork.*`,
     `artist` for the “Art by …” badge on cards and product heroes; badge
     styling lives in [`components/products/product-badge.tsx`](components/products/product-badge.tsx)
     (tinted type labels, frosted artist surface for readability over artwork).
   - For new hero art: add `public/artwork_<n>.webp`, register it in
     `lib/data/product-artwork.ts`, and pick an unused `productArtwork.artwork<n>`
     (each asset should map to one product; tests enforce registry parity and
     unique assignments).
   - Write `description.intro` and sections in plain language; it must **not**
     repeat the catalog `shortDescription` opening (see
     [`docs/naming-conventions.md`](../../docs/naming-conventions.md) › Customer-facing product copy).
   - Add the new product to the `products` array near the bottom of the file.
3. **Sync other surfaces** for the same product (when applicable):
   - App `layout.tsx` / `lib/product-copy.ts` metadata and `public/manifest.json` (SEO describes the product; do not add AGPL to metadata or manifest `description`)
   - `public/llms.txt` for that app or Store/web crawler files (`>` tagline = product/company summary; license text under `## Licensing` only)
   - Legal bullets in `apps/web/app/privacy/page.tsx` / `impressum/page.tsx` if claims change
   - For **Power Platform Configurator**, keep [`packages/shared/src/power-platform-configurator-copy.ts`](../../packages/shared/src/power-platform-configurator-copy.ts) aligned with the extension manifest `description` and Chrome Web Store listing URL; run `bun run consistency:project-naming` (retired `power-automate-*` slugs must not appear outside the allowlisted negative-test paths; see [`docs/naming-conventions.md`](../../docs/naming-conventions.md))
   - Run `bun run test --filter=@helvety/shared` (copy guardrails) and
     `bun run consistency:install-manifest-metadata`
4. **(Optional) Add a switcher entry** in
   [`packages/ui/src/app-switcher-sections.tsx`](../../packages/ui/src/app-switcher-sections.tsx) if the product should appear in the helvety.com app switcher (left sheet in the shared navbar). Keep `links[].icon` aligned with product identity (same Lucide icons as store product UI where applicable).
5. **Run pre-deployment validations** from the repo root:
   `bun run ci:release` (full guardrails, Knip, format, lint, type-check, test, and build).

## Crawl and Indexing

- Public/indexable: `/store`, `/store/products`, `/store/products/[slug]`
- Non-indexable: `/store/account`
- `/store/robots.txt` allows public crawl and disallows `/account`, `/api`, `/auth`
- `/store/sitemap.xml` includes listing and product detail pages only

## Environment Variables

Copy `env.template` to `.env.local`.

| Variable                               | Required | Server-only | Description                                                                                      |
| -------------------------------------- | -------- | ----------- | ------------------------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`             | Yes      | No          | Supabase project URL                                                                             |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes      | No          | Supabase publishable key                                                                         |
| `SUPABASE_SECRET_KEY`                  | Yes      | Yes         | Trusted server-side Supabase key                                                                 |
| `UPSTASH_REDIS_REST_URL`               | Yes      | Yes         | Upstash Redis REST URL                                                                           |
| `UPSTASH_REDIS_REST_TOKEN`             | Yes      | Yes         | Upstash Redis REST token                                                                         |
| `HELVETY_COOKIE_SIGNING_SECRET`        | Yes      | Yes         | Signs CSRF cookies in proxy; re-issues invalid cookies (min 32 chars; not `SUPABASE_SECRET_KEY`) |

`NEXT_PUBLIC_SUPABASE_URL` is also required on Vercel production builds so Next.js image `remotePatterns` can target your Supabase host.

Optional monorepo variables are documented as comments in [`env.template`](./env.template). Shared behavior is in the root [`README.md`](../../README.md) Environment Model; Vercel Production/Preview setup: [`docs/env-vercel-audit-checklist.md`](../../docs/env-vercel-audit-checklist.md). Run `bun run consistency:local-env` from the repo root to audit local `.env.local` files.

## Security Model

- `proxy.ts` performs request bootstrap (CSP, CSRF cookie bootstrap/re-issue, Supabase session refresh via `store-gateway`), not full auth enforcement. The `store-gateway` profile uses **fail-closed** auth refresh (clears stale `sb-*` cookies when Supabase session refresh fails). `createAppProxy` also refreshes sessions on direct root hits (`/` → `/store`) when auth cookies are present. Its `config.matcher` string matches `SECURITY_PROXY_MATCHER` in `@helvety/shared/proxy` (Next.js requires that pattern as a **static literal** in `proxy.ts`, so `ci:check` guardrails keep the two in sync). Extensions such as `.mjs`, `.wasm`, and `.json` bypass the proxy chain.
- Account actions enforce authz in pages/server actions/route handlers.
- Public download endpoints use explicit abuse protections and rate limiting.
- Shared site footer via `HelvetyPublicShellRootLayout`; see [`docs/cookies-telemetry-and-footer.md`](../../docs/cookies-telemetry-and-footer.md) and [Privacy §9](https://helvety.com/privacy#cookies).

## Development and Testing

Run from `apps/store`:

```bash
bun run dev
bun run test
bun run test:watch
bun run test:coverage
```

Notable tests include layout shell providers without WebGL backdrop (`app/layout-shell-providers.test.ts`), solid section nav (`components/store-nav.test.tsx`), client-only catalog (`components/products/products-catalog.test.tsx`, `app/products/page.test.ts`), catalog badge surfaces (`components/products/product-badge.test.tsx`), touch-visible card copy, badge overlays, and no prefetch on cards (`components/products/product-card.test.tsx`), click-only package downloads (`app/products/[slug]/product-detail-client.test.tsx`), public download signing and retired package ids (`lib/packages/create-package-download.test.ts`, `app/api/packages/[packageId]/download/route.test.ts`), product detail SEO and unknown-slug `notFound()` (`app/products/[slug]/page.seo.test.tsx`), and opaque product-detail panels.

For monorepo setup and `ci:check` / `ci:release` commands, use the root [`README.md`](../../README.md).

## Legal and Support

- Privacy: <https://helvety.com/privacy>
- Terms: <https://helvety.com/terms>
- Impressum and abuse reporting: <https://helvety.com/impressum#abuse>
- Contact: <mailto:contact@helvety.com>

## License

Licensed under the [GNU Affero General Public License v3.0 or later](../../LICENSE).
