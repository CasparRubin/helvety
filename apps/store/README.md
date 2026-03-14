# Helvety Store

Official Helvety Store for product discovery, app listings, and package downloads.

Store URL: [https://helvety.com/store](https://helvety.com/store)

## Current scope

- Product catalog with detail pages under `/products`
- Public SPO Explorer package download (`.sppkg`) without account login
- Account page (`/account`) for profile management and data rights tooling
- Shared legal pages hosted on `helvety.com` (Privacy, Terms, Impressum)

## Navigation

- `/products` - Browse all Helvety products
- `/products/helvety-spo-explorer` - SPO Explorer page with direct package download
- `/account` - Optional signed-in account management

The root path redirects to `/products`. Browsing and SPO Explorer download do not require login.

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

## License & usage

This repository is source-visible but not open source. See `apps/store/LICENSE`.
