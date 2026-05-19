# Helvety Image Upscaler

Browser-based image upscaler for PNG/JPEG/WebP. Shopper-facing summaries live in
[`lib/product-copy.ts`](./lib/product-copy.ts) and the Helvety Store catalog;
this README documents implementation details.

Runs the Real-ESRGAN General x4v3 ONNX model locally via `onnxruntime-web`
(WebGPU with WASM fallback) or a high-quality canvas resample when WebAssembly is
unavailable. No image data ever leaves the client.

**App URL:** <https://helvety.com/image-upscaler>  
**Monorepo path:** `apps/image-upscaler`

## Key Features

- Root `app/layout.tsx` uses `@helvety/ui/helvety-public-shell-root-layout` (`overflow-main`, blocking `HelvetyThemeInitScript` in `<head>`) and `@helvety/shared/seo` (`createHelvetyProductMetadata`); `getCachedUser()` supplies an optional SSR session snapshot to the navbar (same pattern as `bootstrapPublicLayoutUser()` on the gateway; no login required for upscaling). `ImageUpscalerCommandBar` is pinned as a flex sibling above the scrollable workspace (not inside page scroll).
- User-facing summaries: [`lib/product-copy.ts`](./lib/product-copy.ts) feeds metadata / JSON-LD (`IMAGE_UPSCALER_APP_DESCRIPTION`) and PWA [`public/manifest.json`](./public/manifest.json) (`IMAGE_UPSCALER_PWA_MANIFEST_DESCRIPTION`; verified by root `bun run consistency:install-manifest-metadata`); crawler hints in [`public/llms.txt`](./public/llms.txt)
- Single user-facing AI engine (`realesr-general-x4v3`) with an automatic no-AI canvas fallback for browsers that cannot run WebAssembly
- AI inference runs entirely in a Web Worker via `onnxruntime-web` (`webgpu` -> `wasm` execution providers)
- Tiled inference with linear-blend stitching to keep memory usage bounded on large images; tile geometry adapts to fixed-shape ONNX inputs when required
- Lazy model download: weights fetch on first use and persist in the browser Cache API (`upscale-models-v1`)
- Per-image or batch flow (2x/4x or target width/height). Runtime uses a
  single native 4x AI model; 2x outputs are produced by final resampling.
- Uses `canvas-size` to probe browser canvas limits and clamps export dimensions when necessary (avoids WebKit `InvalidStateError` on large outputs, e.g. iPhone Safari)
- Batch queue with per-item statuses and an animated "Processing" indicator
- Shared pinned command bar UX (primary/secondary actions; stays visible while the canvas scrolls)
- No login required

## Engine

| Engine                 | User-facing | Size                                         | Best for                                                  |
| ---------------------- | ----------- | -------------------------------------------- | --------------------------------------------------------- |
| `realesr-general-x4v3` | yes         | ~4.8 MB weights + ~43 KB graph (~5 MB total) | Photos, screenshots, mixed content                        |
| `canvas` (no AI)       | no          | 0                                            | Automatic fallback when WASM is unavailable (with notice) |

The user never chooses an engine. The app uses Real-ESRGAN by default; if the
browser does not expose WebAssembly, the app shows a notice and silently uses
the canvas fallback instead.

## Hosting model weights

The ONNX graph and its external-data sidecar are hosted in a public Supabase Storage bucket
(`image-upscaler-models`) and typically downloaded once per browser, then cached locally
via the Cache API. They can re-download after cache eviction/integrity mismatch or when the
Cache API is unavailable. URLs are derived from `NEXT_PUBLIC_SUPABASE_URL` at build
time so each environment uses its own Supabase project. See the
[hosting runbook](./public/models/README.md) for the upload procedure, exact
filenames, cache headers, and how to verify integrity.

The `onnxruntime-web` runtime files (the wasm/JSEP runtime) are copied into
`public/ort/` by
[`scripts/copy-ort-runtime.mjs`](../../scripts/copy-ort-runtime.mjs), wired
into `predev` and `prebuild`.

## Attribution

Real-ESRGAN by xinntao (BSD-3-Clause).
<https://github.com/xinntao/Real-ESRGAN>

## Limits

- Maximum files per batch: `5`
- Supported formats: `PNG`, `JPG/JPEG`, `WebP`
- Maximum file size: `25MB` per image
- Maximum **input** pixels per image (canvas engine): `32,000,000`
- Maximum **input** pixels per image (AI upscaling): `4,000,000` - bounds the
  Float32 stitching buffers so a 4× upscale fits comfortably in a worker;
  declared per-engine via `UpscaleModel.maxInputPixels` in
  [`lib/models.ts`](./lib/models.ts)
- Output dimensions may still be reduced when the browser canvas cap requires
  clamping (mostly a Mobile Safari concern)

## Crawl and Indexing

- `apps/image-upscaler` is publicly indexable.
- `/image-upscaler/robots.txt` allows crawl and advertises `/image-upscaler/sitemap.xml`.
- `/image-upscaler/sitemap.xml` lists canonical public URLs.

## Security Model

- Image processing runs client-side for supported operations.
- AI inference runs entirely in the browser; image data never leaves the client.
- The first AI run fetches the Real-ESRGAN weights from the public Supabase Storage bucket configured for the active environment, then caches them locally.
- Under the current architecture, user image pixels are not used by Helvety for server-side AI model training or fine-tuning.
- `proxy.ts` handles request bootstrap and security headers; the strict CSP includes `'wasm-unsafe-eval'` for `onnxruntime-web` to compile WebAssembly, and `connect-src` is extended to the configured Supabase origin when `NEXT_PUBLIC_SUPABASE_URL` is a valid HTTPS URL (plus matching `wss://`). Like other basePath zones, its `config.matcher` matches `SECURITY_PROXY_MATCHER` in `@helvety/shared/proxy` (inlined static literal per Next.js), so self-hosted ONNX assets under `public/ort/` (`.mjs`, `.wasm`, `.json` from `copy-ort-runtime`) skip the proxy chain.
- Input guards enforce file type, size, and pixel limits.
- E2EE is not used in this app (E2EE apps are `tasks`, `contacts`, `notes`, `links`).

## Regional Positioning

- Switzerland-first service posture.
- Publicly accessible without login for standard upscaling flow.
- Not actively targeted to EU/EEA markets at this time.

## Environment Variables

Copy `env.template` to `.env.local`.

This app does not use `SUPABASE_SECRET_KEY` or Upstash (no server admin client or distributed rate limiting).

| Variable                               | Required | Server-only | Description                                                                                      |
| -------------------------------------- | -------- | ----------- | ------------------------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`             | Yes      | No          | Supabase project URL                                                                             |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes      | No          | Supabase publishable key                                                                         |
| `HELVETY_COOKIE_SIGNING_SECRET`        | Yes      | Yes         | Signs CSRF cookies in proxy; re-issues invalid cookies (min 32 chars; not `SUPABASE_SECRET_KEY`) |

Optional CI/monorepo variables are documented as comments in [`env.template`](./env.template). Shared behavior is in the root [`README.md`](../../README.md) Environment Model.

## Development and Testing

Run from `apps/image-upscaler`:

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
