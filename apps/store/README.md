# Helvety Store

Product catalog and package-download app for Helvety products: specs and artifacts for helvety.com web apps **and** separately distributed software (extensions, SPFx, Windows tools, and more), including items whose primary source lives outside this monorepo.

**App URL:** <https://helvety.com/store>  
**Monorepo path:** `apps/store`

## Key Features

- Root `app/layout.tsx` uses `@helvety/ui/helvety-public-shell-root-layout` with `themeProviderScope: "navbar-only"` so `ThemeProvider` wraps only the navbar (catalog routes avoid a full-tree theme script); `scrollAreaMainPrefix` pins [`StoreNav`](components/store-nav.tsx) above the main `ScrollArea` (frosted `CommandBar` `variant="translucent"` over the shell backdrop; section nav does not scroll away with the catalog); `wrapInsideTooltipProvider` wraps the shell in `CSRFProvider` then [`HelvetyShellWithLightPillarBackdrop`](../../packages/light-pillar) from `@helvety/light-pillar` (content paints first; Helvety red/white Light Pillar on **md+**; below **md** or `prefers-reduced-motion: reduce` uses static `bg-background` only); shared session bootstrap helpers feed CSRF and navbar / `StoreNav`; metadata comes from `@helvety/shared/seo` (`createHelvetyProductMetadata`)
- Public product catalog at `/store/products`
- Public package download endpoints (no login required)
- Optional authenticated account page at `/store/account`
- Product-detail pages with statically imported artwork

## Package Download Behavior

- Download files are served from Supabase Storage bucket `packages`.
- `spfx/helvety-spo-explorer`: newest `.sppkg` by timestamp/name.
- `browserExtensions/power-automate-editor-version-enforcer`: newest `.zip` by timestamp/name (Power Automate Editor Version Enforcer). Permanent redirects in [`next.config.ts`](next.config.ts) keep old bookmarks working (paths below are relative to the Store `basePath` `/store`):
  - `/products/helvety-power-automate-force-v3-false` and `/products/helvety-power-automate-editor-preference` → `/products/helvety-power-automate-editor-version-enforcer`
  - `/api/packages/power-automate-editor-preference/download` and `/api/packages/power-automate-force-v3-false/download` → `/api/packages/power-automate-editor-version-enforcer/download`
- If listing fails, resolver falls back to configured filename path.
- Download URL generation and public download endpoint throttling both use centralized helpers in `lib/download-security.ts` (`buildDownloadUrlRateLimitKey`, `buildPublicDownloadRateLimitKey`) to keep key naming and validation rules consistent.
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
     long-copy fields (`description`, `features`, `pricing`, `links`,
     `metadata.releaseDate: c<Name>.releaseDate`, `image: productArtwork.*`).
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
   `bun run lint && bun run format:check && bun run test && bun run build`.

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

## Shell backdrop (Light Pillar)

Shared package [`@helvety/light-pillar`](../../packages/light-pillar/README.md) (also used by Auth). Store wires `HelvetyShellWithLightPillarBackdrop` in `app/layout.tsx`.

- **Reveal (md+):** Shell content paints on `bg-background` first; on viewports **≥768px**, WebGL loads after two animation frames and the pillar fades in over **700ms** `ease-out` (no full-screen black flash over the UI).
- **Route loading:** Root [`app/loading.tsx`](app/loading.tsx) re-exports `HelvetyShellRouteLoading` so transitions keep the themed shell (nested segment loaders still use `LoadingSpinner` only).
- **Preset:** `HELVETY_LIGHT_PILLAR_OPTIONS` (Helvety red/white via `HELVETY_ACCENT_RED` from `@helvety/brand`; React Bits template tuning otherwise). Refresh vendored shader via `@react-bits` in [`components.json`](components.json); copy into `packages/light-pillar`.
- **Compact viewport:** Below **768px** (`md` / `useIsMobile`), WebGL is not mounted; static `bg-background` only (stacked/mobile layouts).
- **Reduced motion:** WebGL not mounted at any width; `bg-background` fallback only.
- **Section nav:** [`store-nav.tsx`](components/store-nav.tsx) uses `CommandBar` `variant="translucent"` over the shell backdrop (frosted bar over the WebGL pillar on md+, static background below md).
- Catalog cards stay opaque (`bg-card/95`); tune `intensity` in the preset if needed.

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

Licensed under the [GNU Affero General Public License v3.0 or later](../../LICENSE).
