# Helvety Store

Product catalog and package-download app for Helvety products: specs and artifacts for helvety.com web apps **and** separately distributed software (extensions, SPFx, Windows tools, and more), including items whose primary source lives outside this monorepo.

**App URL:** <https://helvety.com/store>  
**Monorepo path:** `apps/store`

## Key Features

- Root `app/layout.tsx` uses `@helvety/ui/helvety-public-shell-root-layout` with `themeProviderScope: "navbar-only"` so `ThemeProvider` wraps only the navbar (catalog routes avoid a full-tree theme script); `wrapInsideTooltipProvider` wraps the shell column in `@helvety/ui/csrf-provider` (`CSRFProvider`); shared session bootstrap helpers feed CSRF and navbar / `StoreNav`; metadata comes from `@helvety/shared/seo` (`createHelvetyProductMetadata`)
- Public product catalog at `/store/products`
- Public package download endpoints (no login required)
- Optional authenticated account page at `/store/account`
- Product-detail pages with statically imported artwork

## Package Download Behavior

- Download files are served from Supabase Storage bucket `packages`.
- `spfx/helvety-spo-explorer`: newest `.sppkg` by timestamp/name.
- `browserExtensions/power-automate-editor-preference`: newest `.zip` by timestamp/name. Legacy package id `power-automate-force-v3-false` resolves to the same folder.
- If listing fails, resolver falls back to configured filename path.
- Download URL generation and public download endpoint throttling both use centralized helpers in `lib/download-security.ts` (`buildDownloadUrlRateLimitKey`, `buildPublicDownloadRateLimitKey`) to keep key naming and validation rules consistent.
- Download URL generation is IP-rate-limited and fails closed when trusted client IP is unavailable in production.

## Adding a New Product

Card-level fields (name, blurb, release date, type, category, runs-on, free /
open-source flags) live in `@helvety/shared/store-catalog` so the Store catalog
and the `@helvety/web` landing showcase render the exact same copy and order.

1. **Add the card entry** in `packages/shared/src/store-catalog.ts`:
   - Append to `STORE_PRODUCT_CARDS` (preserves source order; sorting is done at
     read time via `getStoreCatalogNewestFirst()` / `compareStoreCatalogEntriesNewestFirst`).
   - If the new product shares a `releaseDate` with an existing card, add a
     priority value to `PRODUCT_RELEASE_TIE_PRIORITY` (higher = newer).
   - Run `bun run test --filter=@helvety/shared` (from repo root; same `--filter=` style as the root [`README.md`](../../README.md)) to confirm catalog tests still pass: id uniqueness, `PRODUCT_RELEASE_TIE_PRIORITY` parity with every card id, runs-on labels, free/open-source flags, and default sort endpoints.
2. **Add the full Store product** in `apps/store/lib/data/products.ts`:
   - Call `cardCore("<id>", "<saas|software|physical>")` — TS narrows `type`
     to the literal you pass, and the helper throws at startup if the catalog
     declares a different `type` for that id (no `as` casts needed).
   - Spread the `c<Name>` object into the `Product` literal and fill in the
     long-copy fields (`description`, `features`, `pricing`, `links`,
     `metadata.releaseDate: c<Name>.releaseDate`, `image: productArtwork.*`).
   - Add the new product to the `products` array near the bottom of the file.
3. **Add a Lucide icon** in [`apps/web/components/store-apps-showcase.tsx`](../web/components/store-apps-showcase.tsx):
   **`STORE_PRODUCT_ICONS`** must stay `Record<StoreProductId, LucideIcon>` (the file is optional on `/` until the gateway mounts the showcase again, but builds still type-check once you edit it).
4. **(Optional) Add a switcher entry** in
   [`packages/ui/src/app-switcher-sections.tsx`](../ui/src/app-switcher-sections.tsx) if the product should appear in the helvety.com app switcher (left sheet in the shared navbar).
5. **Run pre-deployment validations** from the repo root:
   `bun run lint && bun run format:check && bun run test && bun run build`.

When mounted on the gateway, the showcase renders one `.showcase-band` per catalog entry and cycles decorative variants (see `apps/web/app/globals.css`). **`apps/web/app/page.tsx` does not import it yet** — only the hero is shown on `/`.

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

Licensed under the [MIT License](../../LICENSE).
