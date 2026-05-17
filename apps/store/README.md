# Helvety Store

Product catalog and package-download app for Helvety products: specs and artifacts for helvety.com web apps **and** separately distributed software (extensions, SPFx, Windows tools, and more), including items whose primary source lives outside this monorepo.

**App URL:** <https://helvety.com/store>  
**Monorepo path:** `apps/store`

## Key Features

- Root `app/layout.tsx` uses `@helvety/ui/helvety-public-shell-root-layout` with `themeProviderScope: "navbar-only"` so `ThemeProvider` wraps only the navbar (catalog routes avoid a full-tree theme script); `scrollAreaMainPrefix` pins [`StoreNav`](components/store-nav.tsx) above the main `ScrollArea` (opaque `CommandBar` `variant="solid"`; section nav does not scroll away with the catalog); `wrapInsideTooltipProvider` wraps the shell in `CSRFProvider`; `bootstrapE2eeLayoutSession()` from `@helvety/shared/layout-session-bootstrap` feeds CSRF and navbar / `StoreNav`; metadata comes from `@helvety/shared/seo` (`createHelvetyProductMetadata`)
- Public product catalog at `/store/products`
- Public package download endpoints (no login required)
- Optional authenticated account page at `/store/account`
- Product-detail pages with statically imported artwork
- Product listing loads the grid client-only (`next/dynamic` with `ssr: false` on `/products`); detail SEO metadata and JSON-LD use `@helvety/shared/store-catalog` only (no server import of `products.ts`); sitemap still uses `lib/data/product-catalog-cache.ts` at build time

## Package Download Behavior

- Download files are served from Supabase Storage bucket `packages`.
- `spfx/helvety-spo-explorer`: newest `.sppkg` by timestamp/name.
- `browserExtensions/power-automate-editor-version-enforcer`: newest `.zip` by timestamp/name (Power Automate Editor Version Enforcer). Permanent redirects in [`next.config.ts`](next.config.ts) keep old bookmarks working (paths below are relative to the Store `basePath` `/store`):
  - `/products/helvety-power-automate-force-v3-false` and `/products/helvety-power-automate-editor-preference` → `/products/helvety-power-automate-editor-version-enforcer`
  - `/api/packages/power-automate-editor-preference/download` and `/api/packages/power-automate-force-v3-false/download` → `/api/packages/power-automate-editor-version-enforcer/download`
- If listing fails, resolver falls back to configured filename path.
- Download URL generation and public download endpoint throttling both use centralized helpers in `lib/download-security.ts` (`buildDownloadUrlRateLimitKey`, `buildPublicDownloadRateLimitKey`) to keep key naming and validation rules consistent.
- Public download redirects are allowlisted to the Supabase project origin from `NEXT_PUBLIC_SUPABASE_URL` (via `getSupabaseUrl()`); a separate `SUPABASE_URL` env var is not used for this check.
- Download URL generation is IP-rate-limited and fails closed when trusted client IP is unavailable in production.

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
     `artist` for the “Art by …” badge on cards and product heroes).
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
   - Run `bun run test --filter=@helvety/shared` (copy guardrails) and
     `bun run consistency:install-manifest-metadata`
4. **(Optional) Add a switcher entry** in
   [`packages/ui/src/app-switcher-sections.tsx`](../ui/src/app-switcher-sections.tsx) if the product should appear in the helvety.com app switcher (left sheet in the shared navbar). Keep `links[].icon` aligned with product identity (same Lucide icons as store product UI where applicable).
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

Optional CI/monorepo variables are documented as comments in [`env.template`](./env.template). Shared behavior is in the root [`README.md`](../../README.md) Environment Model.

## Security Model

- `proxy.ts` performs request bootstrap (CSP, CSRF cookie bootstrap/re-issue, Supabase session refresh via `store-gateway`), not full auth enforcement. `createAppProxy` also refreshes sessions on direct root hits (`/` → `/store`) when auth cookies are present. Its `config.matcher` string matches `SECURITY_PROXY_MATCHER` in `@helvety/shared/proxy` (Next.js requires that pattern as a **static literal** in `proxy.ts`, so CI guardrails keep the two in sync). Extensions such as `.mjs`, `.wasm`, and `.json` bypass the proxy chain.
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

Notable tests include layout shell providers without WebGL backdrop (`app/layout-shell-providers.test.ts`), solid section nav (`components/store-nav.test.tsx`), client-only catalog (`components/products/products-catalog.test.tsx`, `app/products/page.test.ts`), touch-visible card copy and no prefetch on cards (`components/products/product-card.test.tsx`), click-only package downloads (`app/products/[slug]/product-detail-client.test.tsx`), and opaque product-detail panels.

For monorepo setup and CI/release commands, use the root [`README.md`](../../README.md).

## Legal and Support

- Privacy: <https://helvety.com/privacy>
- Terms: <https://helvety.com/terms>
- Impressum and abuse reporting: <https://helvety.com/impressum#abuse>
- Contact: <mailto:contact@helvety.com>

## License

Licensed under the [GNU Affero General Public License v3.0 or later](../../LICENSE).
