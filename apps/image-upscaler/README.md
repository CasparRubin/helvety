# Helvety Image Upscaler

Browser-based image upscaler for PNG/JPEG/WebP. Runs the Real-ESRGAN General
x4v3 ONNX model locally via `onnxruntime-web` (WebGPU with WASM fallback) or a
high-quality canvas resample when WebAssembly is unavailable. No image data
ever leaves the client.

**App URL:** <https://helvety.com/image-upscaler>  
**Monorepo path:** `apps/image-upscaler`

## Key Features

- Root `app/layout.tsx` uses `@helvety/ui/helvety-public-shell-root-layout` (overflow-main) and `@helvety/shared/seo` (`createHelvetyProductMetadata`); shared layout-session bootstrap supplies an optional SSR session snapshot to the navbar (no login required for upscaling)
- Single user-facing AI engine (`realesr-general-x4v3`) with an automatic no-AI canvas fallback for browsers that cannot run WebAssembly
- AI inference runs entirely in a Web Worker via `onnxruntime-web` (`webgpu` -> `wasm` execution providers)
- Tiled inference with linear-blend stitching to keep memory usage bounded on large images; tile geometry adapts to fixed-shape ONNX inputs when required
- Lazy model download: weights fetch on first use and persist in the browser Cache API (`upscale-models-v1`)
- Per-image or batch flow (2x/4x or target width/height)
- Uses `canvas-size` to probe browser canvas limits and clamps export dimensions when necessary (avoids WebKit `InvalidStateError` on large outputs, e.g. iPhone Safari)
- Batch queue with per-item statuses
- Shared command bar UX (primary/secondary actions)
- No login required

## Engine

| Engine                 | User-facing | Size  | Best for                                                  |
| ---------------------- | ----------- | ----- | --------------------------------------------------------- |
| `realesr-general-x4v3` | yes         | ~5 MB | Photos, screenshots, mixed content                        |
| `canvas` (no AI)       | no          | 0     | Automatic fallback when WASM is unavailable (with notice) |

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
- Maximum **input** pixels per image (AI upscaling): `4,000,000` — bounds the
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
- `proxy.ts` handles request bootstrap and security headers; the strict CSP includes `'wasm-unsafe-eval'` for `onnxruntime-web` to compile WebAssembly, and `connect-src` is automatically extended to the configured Supabase origin so the worker can fetch weights.
- Input guards enforce file type, size, and pixel limits.
- E2EE is not used in this app (E2EE apps are `tasks`, `contacts`, `notes`).

## Environment Variables

Copy `env.template` to `.env.local`.

| Variable                               | Required | Server-only | Description                                         |
| -------------------------------------- | -------- | ----------- | --------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Yes      | No          | Supabase project URL                                |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes      | No          | Supabase publishable key                            |
| `HELVETY_COOKIE_SIGNING_SECRET`        | Yes      | Yes         | Signs CSRF/session cookies in proxy bootstrap flows |

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

Licensed under the [MIT License](../../LICENSE).
