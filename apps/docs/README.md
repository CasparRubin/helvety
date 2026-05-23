# Helvety Docs

Browser-based `.docx` editor with optional encrypted vault save.

**App URL:** <https://helvety.com/docs>  
**Monorepo path:** `apps/docs`  
**Local dev port:** `3010` (via gateway: <http://localhost:3001/docs>)

## Key Features

- Root `app/layout.tsx` uses `@helvety/ui/helvety-public-shell-root-layout` (`overflow-main`) with `bootstrapE2eeLayoutSession()`, `CSRFProvider`, and `EncryptionProvider` so vault save can use the same passkey-derived keys as Tasks/Notes, while the main editor stays public.
- User-facing summaries: [`lib/product-copy.ts`](./lib/product-copy.ts) feeds metadata / JSON-LD (`DOCS_APP_DESCRIPTION`) and PWA [`public/manifest.json`](./public/manifest.json) (`DOCS_PWA_MANIFEST_DESCRIPTION`; verified by root `bun run consistency:install-manifest-metadata`); crawler hints in [`public/llms.txt`](./public/llms.txt).
- `@eigenpal/docx-editor-react` loads via `dynamic(..., { ssr: false })` per vendor Next.js guidance.
- **Local editing:** open, create, upload, and download `.docx` files without signing in; bytes stay in the browser for editing.
- **Vault save (optional):** when signed in and vault-unlocked, encrypted display title + encrypted `.docx` bytes in Postgres (`docs` table). `EncryptionGateApp` is scoped to the vault sidebar only, not the whole app.

## Limits

- Maximum file size: **20MB** per `.docx` (local open and vault save); see `DOCS_FILE_SIZE_LIMIT_COPY` in `@helvety/shared/product-file-limit-copy`.
- Vault list capped at **500** documents per API list request (`MAX_DOC_ROWS`).

## Crawl and Indexing

- `apps/docs` is publicly indexable (main editor route).
- `/docs/robots.txt` allows crawl and advertises `/docs/sitemap.xml`.
- `/docs/sitemap.xml` contains canonical public URLs (app root and `llms.txt`).

## Security Model

- Local editing does not upload document bytes to Helvety for editing.
- Vault fields use client-side encryption with the same passkey-derived master key pattern as Tasks, Contacts, Notes, and Links; this is **not** a full-app E2EE product (local mode works without login).
- `proxy.ts` uses the `public-tool` profile plus `googleFonts` CSP for Material Symbols (docx-editor toolbar). `config.matcher` matches `SECURITY_PROXY_MATCHER` in `@helvety/shared/proxy` (inlined as a static literal per Next.js).
- Auth checks run in server actions and `/api/docs` route handlers, not in `proxy.ts` as the authoritative boundary.
- Shared site footer and Vercel Analytics mount via `HelvetyPublicShellRootLayout`; see [`docs/cookies-telemetry-and-footer.md`](../../docs/cookies-telemetry-and-footer.md) and [Privacy §9](https://helvety.com/privacy#cookies).

## Third-Party

- [@eigenpal/docx-editor-react](https://github.com/eigenpal/docx-editor) (Apache-2.0). Helvety app source remains AGPL-3.0-or-later.

## Environment Variables

Copy [`env.template`](./env.template) to `.env.local`.

This app uses the **full stack** tier (same as Store): Supabase publishable + secret, Upstash Redis, and cookie signing for CSRF in the proxy.

| Variable                               | Required | Server-only | Description                                                                                      |
| -------------------------------------- | -------- | ----------- | ------------------------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`             | Yes      | No          | Supabase project URL                                                                             |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes      | No          | Supabase publishable key                                                                         |
| `SUPABASE_SECRET_KEY`                  | Yes      | Yes         | Server-only admin client for vault API routes                                                    |
| `UPSTASH_REDIS_REST_URL`               | Yes      | Yes         | Rate limiting for server actions and API routes                                                  |
| `UPSTASH_REDIS_REST_TOKEN`             | Yes      | Yes         | Upstash REST token                                                                               |
| `HELVETY_COOKIE_SIGNING_SECRET`        | Yes      | Yes         | Signs CSRF cookies in proxy; re-issues invalid cookies (min 32 chars; not `SUPABASE_SECRET_KEY`) |

## Vercel deployment (`helvety-docs`)

This app is a **separate Vercel project** from the gateway (`helvety-web`). In the project settings:

| Setting | Value |
| ------- | ----- |
| **Root Directory** | `apps/docs` |
| **Framework Preset** | Next.js |
| **Install Command** | (default, or `cd ../.. && bun install` via [`vercel.json`](./vercel.json)) |
| **Build Command** | (default `bun run build` / `next build` — do **not** use repo-root `turbo run build` alone) |
| **Output Directory** | (leave empty — Next.js preset uses `.next`) |

If the build log shows `Running build in 0 packages` and `No Output Directory named "public"`, the Root Directory is still the repo root. Set it to `apps/docs` and redeploy.

Enable **Web Analytics** on this project (see [`docs/cookies-telemetry-and-footer.md`](../../docs/cookies-telemetry-and-footer.md)). Set production env vars from [`env.template`](./env.template). The gateway (`apps/web`) needs `DOCS_URL` pointing at this deployment when `VERCEL=1`.

## Database

Apply [`supabase/migrations/20260523120000_create_docs_table.sql`](../../supabase/migrations/20260523120000_create_docs_table.sql) to your Supabase project, then refresh local schema exports if you use `supabase/getSupabase.sql` (never commit `supabase.json`).
