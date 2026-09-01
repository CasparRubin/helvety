# Helvety Store

Product catalog app for Helvety products: specs, Store-hosted download redirects (SPFx via GitHub Releases, desktop ZIPs via Supabase Storage), and install links (for example the Chrome Web Store) for helvety.com web apps **and** separately distributed software.

**App URL:** <https://helvety.com/store> (catalog landing: <https://helvety.com/store/products>)  
**Monorepo path:** `apps/store`

## Key Features

- Root `app/layout.tsx` composes `@helvety/ui/helvety-public-shell-root-layout` (injects `HelvetyThemeInitScript` in `<head>`) with `themeProviderScope: "navbar-only"` so `ThemeProvider` wraps only the navbar; `scrollAreaMainPrefix` pins [`StoreNav`](components/store-nav.tsx) above the main `ScrollArea` (opaque `CommandBar` `variant="solid"`; section nav does not scroll away with the catalog); metadata comes from `@helvety/shared/seo` (`createHelvetyProductMetadata`)
- Public product catalog at `/store/products` with product cards that overlay frosted ecosystem category badges and an “Art by …” artist credit on artwork ([`components/products/product-badge.tsx`](components/products/product-badge.tsx))
- Public package download endpoints (no login required) for SPFx and desktop ZIPs; browser extensions link to vendor stores (for example Chrome Web Store) from product pages
- Product-detail pages with statically imported artwork; unknown catalog slugs return HTTP 404 via `notFound()` on the server (`app/products/[slug]/page.tsx`) with `app/products/[slug]/not-found.tsx`; `generateMetadata` emits noindex “Product Not Found” metadata when the slug is absent from `@helvety/shared/store-catalog` (without calling `notFound()` in metadata)
- Product listing server-renders a text-only grid from `@helvety/shared/store-catalog` via `getCachedStoreCatalogCards()` (`unstable_cache`, `store-catalog` tag); the client keeps text cards until a dynamic `import()` of `lib/data/products` resolves, then swaps in artwork cards. Gateway/App Switcher “Store” links use `urls.storeProducts` (`/store/products`). Product detail server-renders hero title/description (`ProductDetailServerHero`); downloads and CTAs stay client-side. SEO metadata and JSON-LD use `@helvety/shared/store-catalog` only; sitemap uses `lib/data/product-catalog-cache.ts`

## Package Download Behavior

- Downloadable packages are configured in [`lib/packages/config.ts`](lib/packages/config.ts) with absolute HTTPS URLs. Helvety SPO Explorer uses a **GitHub Releases** `.sppkg`. Helvety Power Platform Tools uses public **Supabase Storage** objects in the `packages` bucket (core ZIP and module ZIPs).
- The public download route responds with an HTTP redirect to that URL. Redirect targets must be `https:` on trusted GitHub hosts (`github.com`, `objects.githubusercontent.com`, `release-assets.githubusercontent.com`) or public `{ref}.supabase.co/storage/v1/object/public/packages/...` URLs via `isAllowedDownloadUrl` (fail-closed for anything else).
- **Power Platform Configurator** installs from the [Chrome Web Store](https://chromewebstore.google.com/detail/power-platform-configurat/mdneakhceachnimmejciaehnfjfabang) only (no Store-hosted ZIP). Retired `power-automate-*` and `power-platform-configurator` package ids are not served.
- Public package downloads use `lib/download-security.ts` (`buildPublicDownloadRateLimitKey`, `packageIdSchema`, `isAllowedDownloadUrl`) and `lib/packages/create-package-download.ts` for resolution.
- Retired **package/download** ids return not-found; that is separate from **product page** 404s for unknown `helvety-*` catalog slugs.
- Downloads are IP-rate-limited (2/min per IP on the route) and fail closed when trusted client IP is unavailable in production.

## Adding a New Product

Card-level fields (name, blurb, release date, type, runs-on, free / open-source
flags) live in `@helvety/shared/store-catalog`. **Ecosystem category** (File
Tools, Browser Extensions, SharePoint Apps, Desktop Apps) is derived from
`@helvety/shared/helvety-ecosystem-sections` and drives store filters,
category pills, and the app switcher product sections.

1. **Register the product in the ecosystem** in
   `packages/shared/src/helvety-ecosystem-sections.ts`:
   - Add an item under the correct section (`displayName`, `storeProductSlug`,
     optional `webAppUrlKey` for monorepo web zones).
   - Add an icon in `packages/ui/src/app-switcher-sections.tsx`
     (`ecosystemItemIcons`) unless the item is omitted from the switcher.
2. **Add the card entry** in `packages/shared/src/store-catalog.ts`:
   - Append to `STORE_PRODUCT_CARDS_BASE` (category is derived from the ecosystem
     registry via `storeProductSlug`; do not set `category` manually).
   - Card `type` uses the shared `StoreProductType` union (`"saas" | "software" | "physical"`).
   - If the new product shares a `releaseDate` with an existing card, add a
     priority value to `PRODUCT_RELEASE_TIE_PRIORITY` (higher = newer).
   - Run `bun run test --filter=@helvety/shared` (from repo root) to confirm catalog and ecosystem wiring tests still pass.
3. **Add the full Store product** in `apps/store/lib/data/products.ts`:
   - Call `cardCore("<id>", "<saas|software|physical>")`.
   - Spread the `c<Name>` object into the `Product` literal and fill in the
     long-copy fields (`description`, `features`, `pricing`, `links`,
     `metadata.releaseDate`, `image`, `artist`).
   - For new hero art: add `public/artwork_<n>.webp`, register it in
     `lib/data/product-artwork.ts`, assign it in `products.ts`, and update the
     canonical slug → artwork/artist map in `lib/data/products.test.ts`.
   - Write `description.intro` and sections in plain language; it must **not**
     repeat the catalog `shortDescription` opening (see
     [`docs/naming-conventions.md`](../../docs/naming-conventions.md) › Customer-facing product copy).
   - Add the new product to the `products` array near the bottom of the file.
4. **Sync other surfaces** for the same product (when applicable):
   - App `layout.tsx` / `lib/product-copy.ts` metadata and `public/manifest.json`
   - `public/llms.txt` for that app or Store/web crawler files
   - Legal bullets in `apps/web/app/privacy/page.tsx` / `impressum/page.tsx` if claims change
   - For **Power Platform Configurator**, keep [`packages/shared/src/power-platform-configurator-copy.ts`](../../packages/shared/src/power-platform-configurator-copy.ts) aligned with the extension manifest `description` and Chrome Web Store listing URL; run `bun run consistency:project-naming`
   - For **SPO Explorer** SPFx downloads, add/update the GitHub Releases URL in `lib/packages/config.ts`
   - For **Helvety Power Platform Tools**, add/update public Supabase Storage object URLs in `lib/packages/config.ts` (core ZIP plus each module ZIP)
   - Run `bun run test --filter=@helvety/shared` and
     `bun run consistency:install-manifest-metadata`
5. **Run pre-deployment validations** from the repo root:
   `bun run ci:release`.

## Crawl and Indexing

- Public/indexable: `/store`, `/store/products`, `/store/products/[slug]`
- `/store/robots.txt` allows public crawl and disallows `/store/api` (host-absolute mirror; canonical policy is gateway `/robots.txt`)
- `/store/sitemap.xml` includes the store home, product listing, and product detail pages only (excludes `llms.txt` and API paths).

## Environment Variables

Copy `env.template` to `.env.local`.

| Variable                   | Required | Server-only | Description                            |
| -------------------------- | -------- | ----------- | -------------------------------------- |
| `UPSTASH_REDIS_REST_URL`   | Yes      | Yes         | Upstash Redis REST URL for rate limits |
| `UPSTASH_REDIS_REST_TOKEN` | Yes      | Yes         | Upstash Redis REST token               |

Optional monorepo variables are documented as comments in [`env.template`](./env.template). Shared behavior is in the root [`README.md`](../../README.md) Environment Model; Vercel Production/Preview setup: [`docs/env-vercel-audit-checklist.md`](../../docs/env-vercel-audit-checklist.md). Run `bun run consistency:local-env` from the repo root to audit local `.env.local` files.

## Security Model

- `proxy.ts` performs request bootstrap (CSP via `store-gateway`). `createAppProxy` still applies the shared security proxy matcher. Its `config.matcher` string matches `SECURITY_PROXY_MATCHER` in `@helvety/shared/proxy` (Next.js requires that pattern as a **static literal** in `proxy.ts`, so `ci:check` guardrails keep the two in sync). Extensions such as `.mjs`, `.wasm`, and `.json` bypass the proxy chain.
- Public download endpoints use explicit abuse protections and rate limiting.
- Shared site footer via `HelvetyPublicShellRootLayout`; see [`docs/cookies-telemetry-and-footer.md`](../../docs/cookies-telemetry-and-footer.md) and [Privacy §8](https://helvety.com/privacy#cookies).

## Development and Testing

Run from `apps/store`:

```bash
bun run dev
bun run test
bun run test:watch
bun run test:coverage
```

Notable tests include layout shell provider wiring (`app/layout-shell-providers.test.ts`), solid section nav (`components/store-nav.test.tsx`), SSR catalog shell + dynamic artwork import, ecosystem category wiring, catalog badge surfaces, public download redirects and retired package ids (`lib/packages/create-package-download.test.ts`, `app/api/packages/[packageId]/download/route.test.ts`), product detail SEO and unknown-slug `notFound()`, and canonical per-product artwork/artist assignments.

For monorepo setup and `ci:check` / `ci:release` commands, use the root [`README.md`](../../README.md).

## Legal and Support

- Privacy: <https://helvety.com/privacy>
- Terms: <https://helvety.com/terms>
- Impressum and abuse reporting: <https://helvety.com/impressum#abuse>
- Contact: <mailto:contact@helvety.com>

## License

Licensed under the [GNU Affero General Public License v3.0 or later](../../LICENSE).
