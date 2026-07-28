# Helvety Image Editor

Browser-local image annotation editor: text, arrows, borders, spotlight highlights, blur regions, and crop, with a layers panel for reordering, a tool properties command bar (color pickers, sliders, and number inputs for stroke, blur, dim, and corner radius), and zoom for detail work. Shopper-facing summaries are canonical in [`@helvety/shared/app-product-descriptions`](../../packages/shared/src/app-product-descriptions.ts); [`lib/product-copy.ts`](./lib/product-copy.ts) re-exports those constants for layouts and tests. Store catalog cards live in `@helvety/shared/store-catalog`. This README documents implementation details.

All image processing runs in the browser; no image data leaves the client in the normal flow.

**App URL:** <https://helvety.com/image-editor>  
**Monorepo path:** `apps/image-editor`

## URLs

- Production: `https://helvety.com/image-editor`
- Dev (zone): `http://localhost:3004/image-editor`
- Dev (gateway): `http://localhost:3001/image-editor`

## Key Features

- Root `app/layout.tsx` composes `@helvety/ui/helvety-public-shell-root-layout` (`overflow-main`; the shell injects `HelvetyThemeInitScript` in `<head>`) and `@helvety/shared/seo` (`createHelvetyProductMetadata`); `ImageEditorCommandBar` and `ImageEditorToolPropertiesBar` are pinned as flex siblings above the scrollable workspace (not inside page scroll).
- User-facing summaries: [`lib/product-copy.ts`](./lib/product-copy.ts) re-exports shared `IMAGE_EDITOR_*` strings for metadata / JSON-LD and PWA [`public/manifest.json`](./public/manifest.json) (verified by root `bun run consistency:install-manifest-metadata`); crawler hints in [`public/llms.txt`](./public/llms.txt)
- Annotation tools: Select, Text, Arrow, Border, Highlight (spotlight dim), Blur region, and Crop
- Canvas rendered with Konva + react-konva (loaded via `next/dynamic({ ssr: false })`); `elements[]` index is the z-order; text, border, highlight, and blur use a Konva `Transformer` in Select mode and can be dragged on-canvas; arrows use draggable tail/tip endpoint handles (not the box transformer)
- Border and blur regions support straight or rounded corners (`cornerRadius`, default `8`)
- Highlight tool: one shared spotlight dim layer ([`HighlightDimOverlay`](components/editor/element-nodes.tsx)) sits above the base image; [`lib/spotlight-cutout.ts`](lib/spotlight-cutout.ts) (`drawSpotlightCutouts`) fills the stage once, then punches out every highlight hole with `destination-out` so dim never stacks when multiple highlights are added. Each highlight element is an interactive hole (selection, drag, transform only). `dimOpacity` stays in sync across all highlights when any is edited, when a new highlight is added, or when the tool Dim slider changes while the highlight tool is active
- Crop overlay uses dim strip geometry from [`lib/spotlight-rects.ts`](lib/spotlight-rects.ts) (not used for highlights)
- Default arrow/border stroke `#ff0066` (`DEFAULT_STROKE`); text defaults to white (`DEFAULT_TEXT_FILL`)
- Pure `useReducer` editor state in [`lib/editor-reducer.ts`](./lib/editor-reducer.ts) (no global store), consistent with the PDF zone
- Workspace layout: canvas on the left and layers panel on the right on desktop (`lg+`); the layers panel is always visible (empty state when no image), matching the PDF app; mobile uses a right-side layers sheet
- Fit-to-view on load for large images (`useStageFit` × `userZoom`); main command bar zoom controls, Fit button, and Ctrl/Cmd + wheel (25%–400%); canvas display uses CSS `transform: scale()` (Konva stage stays at logical image size)
- Second command bar (`ImageEditorToolPropertiesBar`, `variant="translucent"`): color pickers and `@helvety/ui/slider` controls with companion number inputs for tool defaults (stroke, blur radius, dim opacity, corner radius) and per-selection edits (font size, stroke, blur, dim, corner radius); sliders cap at 100px for stroke/blur/radius while number inputs accept higher values; W/H number inputs for rectangular elements; horizontal scroll on narrow viewports; layers panel is list-only (reorder, select, delete)
- Image-scaled default font size and stroke width via [`lib/default-tool-sizes.ts`](lib/default-tool-sizes.ts); text annotations include a simple shadow for readability
- Live drag previews while drawing borders, highlights, blur regions, arrows, and crop rectangles
- Tapered arrows: shaft widens toward the neck but stays narrower than the distinct pointy head; same geometry in canvas ([`lib/tapered-arrow.ts`](lib/tapered-arrow.ts)) and export
- Main command bar per [`docs/ui-action-button-contract.md`](../../docs/ui-action-button-contract.md) (Canvas tools): **Add Image** / **Add More** (primary), **Export** (secondary), **Clear Annotations** (destructive, right; keeps the loaded image), zoom and crop **Apply** / **Reset** when the crop tool is active
- Full-resolution PNG and JPEG export via an offscreen Konva stage; `canvas-size` probes browser canvas limits and export dimensions are clamped when necessary (avoids WebKit `InvalidStateError` on large outputs, e.g. iPhone Safari)
- Keyboard shortcuts: Delete/Backspace removes the selection; Escape deselects or cancels crop (ignored while editing text)
- No login required

## Limits

- Supported input formats: `PNG`, `JPG/JPEG`, `WebP`
- Maximum file size: `25MB`, single image
- Output dimensions may be reduced when the browser canvas cap requires clamping (mostly a Mobile Safari concern)

## Crawl and Indexing

- `apps/image-editor` is publicly indexable.
- `/image-editor/robots.txt` allows crawl, disallows `/image-editor/api`, and advertises `/image-editor/sitemap.xml` (zone mirror; canonical crawl policy is gateway `/robots.txt`).
- `/image-editor/sitemap.xml` contains the canonical app root URL only (`llms.txt` is discoverable via robots and gateway links, not the sitemap).

## Security Model

- Image processing runs entirely client-side; image pixels never leave the client in the normal flow.
- Under the current architecture, user image pixels are not used by Helvety for server-side processing, model training, or fine-tuning.
- `proxy.ts` provides request bootstrap (CSP headers) via the `public-tool` profile. Its `config.matcher` matches `SECURITY_PROXY_MATCHER` in `@helvety/shared/proxy` (inlined static literal per Next.js).
- Input guards enforce file type and size.
- Shared site footer via `HelvetyPublicShellRootLayout`; see [`docs/cookies-telemetry-and-footer.md`](../../docs/cookies-telemetry-and-footer.md) and [Privacy §8](https://helvety.com/privacy#cookies).

## Regional Positioning

- Switzerland-first service posture.
- Publicly accessible without login.
- Not offered in the EU/EEA.

## Environment Variables

Copy `env.template` to `.env.local`.

This public tool has **no required server secrets** (client-side processing). Optional monorepo variables are documented as comments in [`env.template`](./env.template). Shared behavior is in the root [`README.md`](../../README.md) Environment Model; Vercel Production/Preview setup: [`docs/env-vercel-audit-checklist.md`](../../docs/env-vercel-audit-checklist.md). Run `bun run consistency:local-env` from the repo root to audit local `.env.local` files.

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
