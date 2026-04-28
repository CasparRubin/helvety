# Helvety Store

Official Helvety Store for product discovery, app listings, and package downloads.

Store URL: [https://helvety.com/store](https://helvety.com/store)

> **Part of the [Helvety monorepo](https://github.com/CasparRubin/helvety).** This app lives in `apps/store/`. See the root README for monorepo setup instructions.

## Current scope

- Product catalog (SaaS apps and downloadable packages) with detail pages under `/store/products`
- Public package downloads (SPO Explorer `.sppkg`, Power Automate extension `.zip`) without account login
- Account page (`/store/account`) for profile management and data rights tooling
- Shared legal pages hosted on `helvety.com` (Privacy, Terms, Impressum)

## Service Availability

Helvety services are primarily intended for customers in Switzerland. Sign-in
for account-based services includes a confirmation that the user is not located
in the EU/EEA before verification-code delivery, but technical access from
outside Switzerland may still occur. Mandatory law in other jurisdictions may
still apply in specific cases.

Helvety's legal baseline is Swiss data protection law (nDSG). Account-based
services collect this non-EU/EEA location-attestation signal during sign-in on
[helvety.com/auth](https://helvety.com/auth).

## Navigation

- `/store/products` - Browse all Helvety products
- `/store/products/helvety-spo-explorer` - SPO Explorer page with direct package download
- `/store/products/helvety-power-automate-force-v3-false` - Power Automate Browser Extension (ZIP) with install guide
- `/store/api/packages/spo-explorer/download` - Public download endpoint for SPO Explorer
- `/store/api/packages/power-automate-force-v3-false/download` - Public download endpoint for the Power Automate extension ZIP
- `/store/account` - Optional signed-in account management

Public store root (`/store`) redirects to `/store/products` (implemented internally as `/products` with `basePath: "/store"`). Browsing the catalog and public package downloads (for example SPO Explorer `.sppkg` and the Power Automate extension `.zip`) do not require login.

## Crawl & Indexing Policy

- Public indexable surfaces: `/store`, `/store/products`, and `/store/products/[slug]`.
- Non-indexable authenticated surface: `/store/account` (`robots: noindex, nofollow`).
- `/store/robots.txt` allows crawl for public pages, disallows `/account`, `/api`, and `/auth`, and advertises `/store/sitemap.xml`.
- `/store/sitemap.xml` contains canonical absolute URLs for listing and product detail pages only.
- Unknown product slugs return explicit noindex metadata to avoid accidental indexing of fallback pages.

## Package download behavior

- Package files are read from Supabase Storage bucket `packages` (see `lib/packages/config.ts` for folder paths).
- **SPO Explorer:** `spfx/helvety-spo-explorer` - the resolver selects the newest `.sppkg` by timestamp (then name).
- **Power Automate extension:** `browserExtensions/power-automate-force-v3-false` - the resolver selects the newest `.zip` the same way.
- If listing fails or is empty, the download action falls back to the configured `filename` under `storageFolderPath`.

## Artwork assets

- Product card artwork lives in `apps/store/public` and is referenced with the store basePath (for example `/store/artwork_1.png`).
- `artwork_1.png` - Alexandre Calame - in use
- `artwork_2.png` - Alexandre Calame - in use
- `artwork_3.png` - Alexandre Calame - in use
- `artwork_4.png` - Ferdinand Hodler - in use
- `artwork_5.png` - Rudolf Koller - in use
- `artwork_6.png` - Rudolf Koller - in use (Power Automate extension product)

## Environment variables

Copy `env.template` to `.env.local` and fill values:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

`SUPABASE_SECRET_KEY`, `UPSTASH_REDIS_REST_URL`, and `UPSTASH_REDIS_REST_TOKEN` are server-side values. Keep them only in server environments and never expose them to client bundles.

> **Monorepo CI (`ci:release`):** From the repository root, `bun run ci:release` sets `SKIP_ENV_VALIDATION=1` for the production `build` step so Next.js can compile without a complete local `.env`. `@helvety/shared/env-validation` uses schema-valid placeholders only for missing values and still validates credentials that are present; production Vercel builds set `VERCEL=1` so placeholder mode is off. See the repository root **README** (Automation).

## Security & session setup

- **Request setup** - `proxy.ts` (via `@helvety/shared/proxy`) sets CSP headers, CSRF cookie bootstrap, and Supabase session cookie refresh when auth cookies are present. Session and authorization checks for account flows run in pages, Server Actions, and route handlers, not in the proxy alone.
- **Download rate limiting** - Public package download URL generation is IP-rate-limited to prevent abuse. The action fails closed when the client IP cannot be resolved in production.

## Tech stack

- Next.js 16 (App Router)
- React 19 + TypeScript
- Supabase
- Tailwind CSS 4
- shadcn/ui + Radix UI

## Legal pages

Privacy Policy, Terms of Service, and Impressum are hosted centrally on
[helvety.com](https://helvety.com) and linked in the site footer.

## Abuse reporting

Abuse reports can be submitted to
[contact@helvety.com](mailto:contact@helvety.com). The Impressum includes an
abuse-reporting section at
[helvety.com/impressum#abuse](https://helvety.com/impressum#abuse).

## Testing

Unit tests use [Vitest](https://vitest.dev/) in a jsdom environment via `@helvety/config/vitest`; TypeScript is checked with `bun run type-check`, not inside Vitest. Run from `apps/store`:

| Script                  | Description                       |
| ----------------------- | --------------------------------- |
| `bun run test`          | Run all tests once (`vitest run`) |
| `bun run test:watch`    | Run tests in watch mode           |
| `bun run test:coverage` | Run tests with v8 coverage report |

From the monorepo root, `bun run test` runs Turbo across workspaces.

Post-delete **account verification** (residual row counts per table) is implemented in `lib/account-deletion-verification.ts` and covered by unit tests alongside existing store tests (downloads, pricing, compliance helpers).

## License & usage

This app is open source under the [MIT License](./LICENSE).

You may use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of this software, provided the copyright and permission notice are
included in substantial portions of the software.

The software is provided "as is", without warranty of any kind. See
[LICENSE](./LICENSE) for full legal terms.
