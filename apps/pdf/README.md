# Helvety PDF

Browser-based PDF toolkit for merge, reorder, rotate, extract, and add-images workflows.

**App URL:** <https://helvety.com/pdf>  
**Monorepo path:** `apps/pdf`

## Key Features

- Root `app/layout.tsx` composes `@helvety/ui/helvety-public-shell-root-layout` (`overflow-main`; the shell injects `HelvetyThemeInitScript` in `<head>`) and `@helvety/shared/seo` (`createHelvetyProductMetadata`) for shared metadata and shell chrome; `bootstrapPublicLayoutUser()` supplies an optional SSR session snapshot to the navbar (login still not required for tools). `PdfCommandBar` is pinned as a flex sibling above the scrollable workspace (not inside page scroll).
- User-facing summaries: [`lib/product-copy.ts`](./lib/product-copy.ts) re-exports `PDF_APP_DESCRIPTION` and `PDF_PWA_MANIFEST_DESCRIPTION` from `@helvety/shared/app-product-descriptions` for metadata / JSON-LD and PWA [`public/manifest.json`](./public/manifest.json) (verified by root `bun run consistency:install-manifest-metadata`); crawler hints in [`public/llms.txt`](./public/llms.txt)
- Local browser processing for supported operations
- PDF and image input support
- Page thumbnail preview with drag-and-drop reordering; first render uses react-pdf canvas, then pages are stored in an ImageBitmap LRU cache for faster re-display
- Rotation, deletion, and extraction tools
- Multi-file merge workflows
- No login required

## Limits and Runtime Notes

- Maximum file size: `100MB` per file
- No app-enforced page-count cap
- Performance depends on device/browser memory
- Open PDF documents are LRU-cached in memory using shared `CACHE_LIMITS` caps (`getRecommendedCacheLimit` in [`hooks/use-pdf-files.ts`](./hooks/use-pdf-files.ts); desktop vs mobile limits in [`lib/constants.ts`](./lib/constants.ts))
- Capability-driven processing pipeline with fallback (`gpu-worker` -> `worker` -> `main-thread`)
- PDF.js SSR uses a Turbopack `resolveAlias` stub for Node `canvas` (see `next.config.ts` and `lib/empty-canvas-stub.mjs`); processing remains client-side

## PDF.js stack (maintainers)

- **Library:** `react-pdf` owns `pdfjs-dist` (transitive). Do not pin `pdfjs-dist` directly in `apps/pdf` or root overrides; that skews the worker away from the runtime API.
- **Worker:** [`scripts/sync-pdf-worker.mjs`](./scripts/sync-pdf-worker.mjs) copies `pdfjs-dist/build/pdf.worker.min.mjs` from **react-pdf's resolved pdfjs-dist** into `public/pdf.worker.min.mjs` before dev/build (`bun run sync:pdf-worker`). Also writes `public/pdf.worker.meta.json` for CI alignment checks.
- **Runtime:** [`hooks/use-pdf-worker.ts`](./hooks/use-pdf-worker.ts) sets `pdfjs.GlobalWorkerOptions.workerSrc` to `/pdf/pdf.worker.min.mjs` (via `react-pdf`'s `pdfjs` export).
- **CI:** Root `bun run consistency:pdfjs-worker` (in `ci:check`) syncs the worker then fails if the result disagrees with react-pdf's resolved pdfjs-dist or if independent `pdfjs-dist` pins/overrides are reintroduced.
- **Tests:** [`scripts/resolve-pdfjs-for-react-pdf.test.ts`](./scripts/resolve-pdfjs-for-react-pdf.test.ts), [`scripts/sync-pdf-worker.test.ts`](./scripts/sync-pdf-worker.test.ts), [`scripts/pdfjs-worker-alignment.test.ts`](./scripts/pdfjs-worker-alignment.test.ts), [`hooks/use-pdf-worker.test.ts`](./hooks/use-pdf-worker.test.ts), [`hooks/use-pdf-worker-wiring.test.ts`](./hooks/use-pdf-worker-wiring.test.ts), [`hooks/use-pdf-page-state.test.ts`](./hooks/use-pdf-page-state.test.ts), [`components/pdf/pdf-page-thumbnail.render.test.tsx`](./components/pdf/pdf-page-thumbnail.render.test.tsx), [`lib/pdf-thumbnail-cache.test.ts`](./lib/pdf-thumbnail-cache.test.ts).

## Crawl and Indexing

- `apps/pdf` is publicly indexable.
- `/pdf/robots.txt` allows crawl and advertises `/pdf/sitemap.xml`.
- `/pdf/sitemap.xml` contains the canonical app root URL only (`llms.txt` is discoverable via robots and gateway links, not the sitemap).

## Security Model

- File conversion is client-side for supported operations.
- `proxy.ts` provides request bootstrap (CSP, CSRF cookie bootstrap/re-issue, optional session refresh) via the `public-tool` profile with **fail-closed** auth refresh when `sb-*` cookies are present; this app does not require login for PDF workflows. Its `config.matcher` matches `SECURITY_PROXY_MATCHER` in `@helvety/shared/proxy` (inlined as a static literal per Next.js). Static `public/` files (including `pdf.worker.min.mjs`, synced from react-pdf's resolved `pdfjs-dist` by `bun run sync:pdf-worker` before dev/build and loaded at `/pdf/pdf.worker.min.mjs`) therefore skip the proxy chain.
- Full-app E2EE is not used here (E2EE apps are `tasks`, `contacts`, `notes`, `links`).
- Shared site footer via `HelvetyPublicShellRootLayout`; see [`docs/cookies-telemetry-and-footer.md`](../../docs/cookies-telemetry-and-footer.md) and [Privacy §9](https://helvety.com/privacy#cookies).

## Environment Variables

Copy `env.template` to `.env.local`.

This app does not use `SUPABASE_SECRET_KEY` (no server admin client). Upstash is required for auth callback strict rate limiting and CSRF cookie signing in the proxy.

| Variable                               | Required | Server-only | Description                                                                                      |
| -------------------------------------- | -------- | ----------- | ------------------------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`             | Yes      | No          | Supabase project URL                                                                             |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes      | No          | Supabase publishable key                                                                         |
| `UPSTASH_REDIS_REST_URL`               | Yes      | Yes         | Upstash Redis REST URL for rate limiting                                                         |
| `UPSTASH_REDIS_REST_TOKEN`             | Yes      | Yes         | Upstash Redis REST token for rate limiting                                                       |
| `HELVETY_COOKIE_SIGNING_SECRET`        | Yes      | Yes         | Signs CSRF cookies in proxy; re-issues invalid cookies (min 32 chars; not `SUPABASE_SECRET_KEY`) |

Optional monorepo variables are documented as comments in [`env.template`](./env.template). Shared behavior is in the root [`README.md`](../../README.md) Environment Model; Vercel Production/Preview setup: [`docs/env-vercel-audit-checklist.md`](../../docs/env-vercel-audit-checklist.md). Run `bun run consistency:local-env` from the repo root to audit local `.env.local` files.

## Development and Testing

Run from `apps/pdf`:

```bash
bun run dev                  # syncs PDF.js worker, then starts Next.js
bun run sync:pdf-worker        # manual worker sync (also runs on dev/build)
bun run test
bun run test:watch
bun run test:coverage
```

From the repo root after dependency changes:

```bash
bun run consistency:pdfjs-worker   # sync + validate worker matches react-pdf's pdfjs-dist
```

For monorepo setup and `ci:check` / `ci:release` commands, use the root [`README.md`](../../README.md).

## Legal and Support

- Privacy: <https://helvety.com/privacy>
- Terms: <https://helvety.com/terms>
- Impressum and abuse reporting: <https://helvety.com/impressum#abuse>
- Contact: <mailto:contact@helvety.com>

## License

Licensed under the [GNU Affero General Public License v3.0 or later](../../LICENSE).
