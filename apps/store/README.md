# Helvety Store

Official Helvety Store for product discovery, app listings, and package downloads.

Store URL: [https://helvety.com/store](https://helvety.com/store)

## Current scope

- Product catalog with detail pages under `/products`
- Public SPO Explorer package download (`.sppkg`) without account login
- Account page (`/account`) for profile management and data rights tooling
- Shared legal pages hosted on `helvety.com` (Privacy, Terms, Impressum)

## Service Availability

Helvety services are primarily intended for customers in Switzerland. New
account creation includes a Switzerland location confirmation step for
account-based services, but technical access from outside Switzerland may still
occur. Mandatory law in other jurisdictions may still apply in specific cases.

Helvety's legal baseline is Swiss data protection law (nDSG). Account-based
services ask new users to confirm Switzerland-based usage during account
creation on [helvety.com/auth](https://helvety.com/auth) before a new account
is created.

## Navigation

- `/store/products` - Browse all Helvety products
- `/store/products/helvety-spo-explorer` - SPO Explorer page with direct package download
- `/store/api/packages/spo-explorer/download` - Public download endpoint for SPO Explorer
- `/store/account` - Optional signed-in account management

The store root path (`/store`) redirects to `/store/products`. Browsing and SPO Explorer download do not require login.

## SPO Explorer download behavior

- Package files are read from Supabase Storage bucket `packages` under `spfx/helvety-spo-explorer`.
- The resolver selects the newest `.sppkg` using the latest of `created_at` and `updated_at`, then applies deterministic descending filename tie-break ordering.
- If only one file exists (recommended: `helvety-spo-explorer.sppkg`), that file is returned directly.

## Artwork assets

- Product card artwork lives in `apps/store/public` and is referenced with the store basePath (for example `/store/artwork_1.png`).
- `artwork_1.png` - Alexandre Calame - in use
- `artwork_2.png` - Alexandre Calame - in use
- `artwork_3.png` - Alexandre Calame - in use
- `artwork_4.png` - Ferdinand Hodler - in use
- `artwork_5.png` - Rudolf Koller - in use

## Environment variables

Copy `env.template` to `.env.local` and fill values:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

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

## License & usage

This app is open source under the [MIT License](./LICENSE).

You may use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of this software, provided the copyright and permission notice are
included in substantial portions of the software.

The software is provided "as is", without warranty of any kind. See
[LICENSE](./LICENSE) for full legal terms.
