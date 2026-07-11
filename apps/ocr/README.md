# Helvety OCR

Browser-local text extraction for PDFs and images: scanned or photographed pages run through on-device OCR (Tesseract.js in a Web Worker), and born-digital PDFs reuse their existing text layer before falling back to OCR. Read, copy, or download the extracted plain text. Shopper-facing summaries are canonical in [`@helvety/shared/app-product-descriptions`](../../packages/shared/src/app-product-descriptions.ts); [`lib/product-copy.ts`](./lib/product-copy.ts) re-exports those constants for layouts and tests. Store catalog cards live in `@helvety/shared/store-catalog`. This README documents implementation details.

All text extraction runs in the browser; no file data leaves the client in the normal flow.

**App URL:** <https://helvety.com/ocr>  
**Monorepo path:** `apps/ocr`

## URLs

- Production: `https://helvety.com/ocr`
- Dev (zone): `http://localhost:3011/ocr`
- Dev (gateway): `http://localhost:3001/ocr`

## Key Features

- Root `app/layout.tsx` composes `@helvety/ui/helvety-public-shell-root-layout` (`overflow-main`; the shell injects `HelvetyThemeInitScript` in `<head>`) and `@helvety/shared/seo` (`createHelvetyProductMetadata`); `bootstrapPublicLayoutUser()` supplies an optional SSR session snapshot to the navbar (no login required for text extraction). The OCR command bar is pinned above the scrollable workspace (not inside page scroll).
- User-facing summaries: [`lib/product-copy.ts`](./lib/product-copy.ts) re-exports shared `OCR_*` strings for metadata / JSON-LD and PWA [`public/manifest.json`](./public/manifest.json) (verified by root `bun run consistency:install-manifest-metadata`); crawler hints in [`public/llms.txt`](./public/llms.txt)
- Inputs: `PNG`, `JPG/JPEG`, `WebP` images and `PDF` documents (scanned/image-only and born-digital)
- Born-digital PDFs: the text layer is extracted first; pages with little or no embedded text fall back to on-device OCR
- OCR runs in a dedicated Web Worker (Tesseract.js) with per-job timeouts, worker termination/recreation on failure, and abort on unmount or new file; progress events drive the UI
- PDF pages are rendered to canvas via react-pdf's `pdfjs` at a sensible DPI, then handed to the OCR worker as PNG image blobs
- Languages: English (`eng`) and German (`deu`), served from self-hosted `public/tessdata/`
- Outputs: on-screen selectable text, copy to clipboard, and download as a `.txt` file (multi-page PDFs concatenated with clear page separators)
- No login required

## PDF.js stack (maintainers)

- **Library:** `react-pdf` owns `pdfjs-dist` (transitive). Do not pin `pdfjs-dist` directly in `apps/ocr` or root overrides; that skews the worker away from the runtime API.
- **Worker:** [`scripts/sync-pdf-worker.mjs`](./scripts/sync-pdf-worker.mjs) copies `pdfjs-dist/build/pdf.worker.min.mjs` from **react-pdf's resolved pdfjs-dist** into `public/pdf.worker.min.mjs` before dev/build (`bun run sync:pdf-worker`). Also writes `public/pdf.worker.meta.json` for CI alignment checks.
- **CI:** Root `bun run consistency:pdfjs-worker` (in `ci:check`) syncs the worker then fails if the result disagrees with react-pdf's resolved pdfjs-dist or if independent `pdfjs-dist` pins/overrides are reintroduced.
- **Tests:** [`scripts/resolve-pdfjs-for-react-pdf.test.ts`](./scripts/resolve-pdfjs-for-react-pdf.test.ts) and [`scripts/sync-pdf-worker.test.ts`](./scripts/sync-pdf-worker.test.ts).

## Tesseract assets and language data (maintainers)

All Tesseract.js assets are self-hosted under `public/` so nothing is fetched from a third-party CDN at runtime (privacy and CSP friendly).

- **Engine assets (generated, gitignored):** [`scripts/sync-tesseract-assets.mjs`](./scripts/sync-tesseract-assets.mjs) (`bun run sync:tesseract`) copies the Tesseract.js worker and core WebAssembly from the installed `tesseract.js` / `tesseract.js-core` packages into `public/tesseract/`. This runs automatically as part of `bun run sync:assets` before dev and build (alongside the PDF.js worker sync), the same way `image-upscaler` regenerates its `public/ort/` runtime.
- **Language data (vendored, committed):** `public/tessdata/` holds uncompressed `eng.traineddata` and `deu.traineddata` (from `tessdata_fast`, Apache-2.0). These are committed so production builds need no network fetch. [`scripts/download-tessdata.mjs`](./scripts/download-tessdata.mjs) (`bun run download:tessdata`) (re)downloads them when adding or refreshing a language; it is not part of the dev/build sync.
- **Loading:** [`lib/ocr-worker-client.ts`](./lib/ocr-worker-client.ts) points Tesseract.js at these same-origin paths (`/ocr/tesseract` and `/ocr/tessdata`) with `workerBlobURL: false` and `gzip: false` to stay within the zone CSP and use the uncompressed traineddata.

## Limits

- Supported input formats: `PNG`, `JPG/JPEG`, `WebP`, `PDF`
- Maximum file size: `100MB`, single file
- Maximum pages per PDF: `50`
- Languages: English and German

## Crawl and Indexing

- `apps/ocr` is publicly indexable.
- `/ocr/robots.txt` allows crawl and advertises `/ocr/sitemap.xml`.
- `/ocr/sitemap.xml` contains the canonical app root URL only (`llms.txt` is discoverable via robots and gateway links, not the sitemap).

## Security Model

- Text extraction runs entirely client-side; file bytes never leave the client in the normal flow.
- Under the current architecture, user files are not used by Helvety for server-side processing, model training, or fine-tuning.
- `proxy.ts` handles request bootstrap (CSP, CSRF cookie bootstrap/re-issue, optional session refresh) via the `public-tool` profile with **fail-closed** auth refresh when `sb-*` cookies are present. Its `config.matcher` matches `SECURITY_PROXY_MATCHER` in `@helvety/shared/proxy` (inlined static literal per Next.js). The CSP allows `wasm-unsafe-eval` and worker scripts required by Tesseract.js. Static `public/` files (including `pdf.worker.min.mjs`, synced from react-pdf's resolved `pdfjs-dist` and loaded at `/ocr/pdf.worker.min.mjs`) skip the proxy chain.
- Input guards enforce file type, size, and page count.
- Full-app E2EE is not used here (E2EE apps are `tasks`, `contacts`, `notes`, `links`).
- Shared site footer via `HelvetyPublicShellRootLayout`; see [`docs/cookies-telemetry-and-footer.md`](../../docs/cookies-telemetry-and-footer.md) and [Privacy §9](https://helvety.com/privacy#cookies).

## Regional Positioning

- Switzerland-first service posture.
- Publicly accessible without login.
- Not actively targeted to EU/EEA markets at this time.

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

## Stack

- Next.js public-tool zone (`createPublicToolNextConfig`), Tesseract.js for OCR, react-pdf for PDF rendering and text-layer extraction.
- All text extraction runs in the browser; no Helvety server upload for file bytes.

## Development and Testing

Run from `apps/ocr`:

```bash
bun run download:tessdata      # refresh eng/deu language data (committed; only when adding a language)
bun run dev                    # syncs PDF.js worker + Tesseract assets, then starts Next.js
bun run sync:assets            # manual PDF.js worker + Tesseract sync (also runs on dev/build)
bun run sync:pdf-worker        # manual PDF.js worker sync only
bun run sync:tesseract         # manual Tesseract worker + core WASM sync only
bun run test
bun run test:watch
bun run test:coverage
```

For monorepo setup and `ci:check` / `ci:release` commands, use the root [`README.md`](../../README.md).

## Vercel

- Project: `helvety-ocr`
- Root Directory: `apps/ocr`

## Third-party libraries

- [Tesseract.js](https://github.com/naptha/tesseract.js) (Apache-2.0) powers on-device OCR.
- [pdf.js](https://mozilla.github.io/pdf.js/) via [react-pdf](https://github.com/wojtekmaj/react-pdf) (both MIT) render PDF pages and extract text layers.

## Legal and Support

- Privacy: <https://helvety.com/privacy>
- Terms: <https://helvety.com/terms>
- Impressum and abuse reporting: <https://helvety.com/impressum#abuse>
- Contact: <mailto:contact@helvety.com>

## License

Licensed under the [GNU Affero General Public License v3.0 or later](../../LICENSE).
