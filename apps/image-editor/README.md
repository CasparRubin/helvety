# Helvety Image Editor

Browser-local image annotation editor: text, arrows, borders, spotlight highlights, blur regions, and crop, with a layers panel for reordering, a tool properties command bar for colors and sizes, and zoom for detail work. Shopper-facing summaries are canonical in [`@helvety/shared/app-product-descriptions`](../../packages/shared/src/app-product-descriptions.ts); [`lib/product-copy.ts`](./lib/product-copy.ts) re-exports those constants for layouts and tests. Store catalog cards live in `@helvety/shared/store-catalog`. This README documents implementation details.

All image processing runs in the browser; no image data leaves the client in the normal flow.

**App URL:** <https://helvety.com/image-editor>  
**Monorepo path:** `apps/image-editor`

## URLs

- Production: `https://helvety.com/image-editor`
- Dev (zone): `http://localhost:3010/image-editor`
- Dev (gateway): `http://localhost:3001/image-editor`

## Key Features

- Root `app/layout.tsx` composes `@helvety/ui/helvety-public-shell-root-layout` (`overflow-main`; the shell injects `HelvetyThemeInitScript` in `<head>`) and `@helvety/shared/seo` (`createHelvetyProductMetadata`); `bootstrapPublicLayoutUser()` supplies an optional SSR session snapshot to the navbar (no login required for editing). `ImageEditorCommandBar` and `ImageEditorToolPropertiesBar` are pinned as flex siblings above the scrollable workspace (not inside page scroll).
- User-facing summaries: [`lib/product-copy.ts`](./lib/product-copy.ts) re-exports shared `IMAGE_EDITOR_*` strings for metadata / JSON-LD and PWA [`public/manifest.json`](./public/manifest.json) (verified by root `bun run consistency:install-manifest-metadata`); crawler hints in [`public/llms.txt`](./public/llms.txt)
- Annotation tools: Select, Text, Arrow, Border, Highlight (spotlight dim), Blur region, and Crop
- Canvas rendered with Konva + react-konva (loaded via `next/dynamic({ ssr: false })`); `elements[]` index is the z-order and interactive elements use a Konva `Transformer` in Select mode
- Pure `useReducer` editor state in [`lib/editor-reducer.ts`](./lib/editor-reducer.ts) (no global store), consistent with the PDF and Image Upscaler zones
- Workspace layout: canvas on the left and layers panel on the right on desktop (`lg+`); the layers panel is always visible (empty state when no image), matching the PDF app; mobile uses a right-side layers sheet
- Fit-to-view on load for large images (`useStageFit` × `userZoom`); main command bar zoom controls, Fit button, and Ctrl/Cmd + wheel (25%–400%); canvas display uses CSS `transform: scale()` (Konva stage stays at logical image size)
- Second command bar (`ImageEditorToolPropertiesBar`): tool color and stroke width for text, arrows, and borders; per-selection property edits; blur and highlight show default radius/opacity hints without color pickers; layers panel is list-only (reorder, select, delete)
- Image-scaled default font size and stroke width via [`lib/default-tool-sizes.ts`](lib/default-tool-sizes.ts); text annotations include a simple shadow for readability
- Tapered arrows (wider toward the arrowhead) in canvas and export
- Crop is handled in the main command bar (Apply / Reset)
- Full-resolution PNG and JPEG export via an offscreen Konva stage; `canvas-size` probes browser canvas limits and export dimensions are clamped when necessary (avoids WebKit `InvalidStateError` on large outputs, e.g. iPhone Safari)
- Keyboard shortcuts: Delete/Backspace removes the selection; Escape deselects or cancels crop (ignored while editing text)
- No login required

## Limits

- Supported input formats: `PNG`, `JPG/JPEG`, `WebP`
- Maximum file size: `25MB`, single image
- Output dimensions may be reduced when the browser canvas cap requires clamping (mostly a Mobile Safari concern)

## Crawl and Indexing

- `apps/image-editor` is publicly indexable.
- `/image-editor/robots.txt` allows crawl and advertises `/image-editor/sitemap.xml`.
- `/image-editor/sitemap.xml` contains the canonical app root URL only (`llms.txt` is discoverable via robots and gateway links, not the sitemap).

## Security Model

- Image processing runs entirely client-side; image pixels never leave the client in the normal flow.
- Under the current architecture, user image pixels are not used by Helvety for server-side processing, model training, or fine-tuning.
- `proxy.ts` handles request bootstrap (CSP, CSRF cookie bootstrap/re-issue, optional session refresh) via the `public-tool` profile with **fail-closed** auth refresh when `sb-*` cookies are present. Its `config.matcher` matches `SECURITY_PROXY_MATCHER` in `@helvety/shared/proxy` (inlined static literal per Next.js).
- Input guards enforce file type and size.
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

- Next.js public-tool zone (`createPublicToolNextConfig`), Konva + react-konva for canvas editing.
- All image processing runs in the browser; no Helvety server upload for pixels.

## Development and Testing

Run from `apps/image-editor`:

```bash
bun run dev
bun run test
bun run test:watch
bun run test:coverage
```

For monorepo setup and `ci:check` / `ci:release` commands, use the root [`README.md`](../../README.md).

## Vercel

- Project: `helvety-image-editor`
- Root Directory: `apps/image-editor`

## Third-party libraries

- [Konva](https://konvajs.org/) (MIT) powers the canvas editor.

## Legal and Support

- Privacy: <https://helvety.com/privacy>
- Terms: <https://helvety.com/terms>
- Impressum and abuse reporting: <https://helvety.com/impressum#abuse>
- Contact: <mailto:contact@helvety.com>

## License

Licensed under the [GNU Affero General Public License v3.0 or later](../../LICENSE).
