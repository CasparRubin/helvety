# Helvety PDF

Browser-based PDF toolkit for merge, reorder, rotate, extract, and add-images workflows.

**App URL:** <https://helvety.com/pdf>  
**Monorepo path:** `apps/pdf`

## Key Features

- Root `app/layout.tsx` composes `@helvety/ui/helvety-public-shell-root-layout` (`overflow-main`; the shell injects `HelvetyThemeInitScript` in `<head>`) and `@helvety/shared/seo` (`createHelvetyProductMetadata`) for shared metadata and shell chrome; `bootstrapPublicLayoutUser()` supplies an optional SSR session snapshot to the navbar (login still not required for tools). `PdfCommandBar` is pinned as a flex sibling above the scrollable workspace (not inside page scroll).
- User-facing summaries: [`lib/product-copy.ts`](./lib/product-copy.ts) re-exports `PDF_APP_DESCRIPTION` and `PDF_PWA_MANIFEST_DESCRIPTION` from `@helvety/shared/app-product-descriptions` for metadata / JSON-LD and PWA [`public/manifest.json`](./public/manifest.json) (verified by root `bun run consistency:install-manifest-metadata`); crawler hints in [`public/llms.txt`](./public/llms.txt)
- Local browser processing for supported operations
- PDF and image input support
- Page thumbnail preview with drag-and-drop reordering
- Rotation, deletion, and extraction tools
- Multi-file merge workflows
- No login required

## Limits and Runtime Notes

- Maximum file size: `100MB` per file
- No app-enforced page-count cap
- Performance depends on device/browser memory
- Capability-driven processing pipeline with fallback (`gpu-worker` -> `worker` -> `main-thread`)
- PDF.js SSR uses a Turbopack `resolveAlias` stub for Node `canvas` (see `next.config.ts` and `lib/empty-canvas-stub.mjs`); processing remains client-side

## Crawl and Indexing

- `apps/pdf` is publicly indexable.
- `/pdf/robots.txt` allows crawl and advertises `/pdf/sitemap.xml`.
- `/pdf/sitemap.xml` contains canonical public URLs.

## Security Model

- File conversion is client-side for supported operations.
- `proxy.ts` provides request bootstrap and headers; this app does not require login. Its `config.matcher` matches `SECURITY_PROXY_MATCHER` in `@helvety/shared/proxy` (inlined as a static literal per Next.js). Static `public/` files (including `pdf.worker.min.mjs`, copied from `pdfjs-dist` by `bun run sync:pdf-worker` before dev/build, which PDF.js loads from `/pdf/pdf.worker.min.mjs`) therefore skip the proxy chain.
- Full-app E2EE is not used here (E2EE apps are `tasks`, `contacts`, `notes`, `links`). Helvety Docs offers optional encrypted vault save only.
- Shared site footer and Vercel Analytics mount via `HelvetyPublicShellRootLayout`; see [`docs/cookies-telemetry-and-footer.md`](../../docs/cookies-telemetry-and-footer.md) and [Privacy §9](https://helvety.com/privacy#cookies).

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

Optional CI/monorepo variables are documented as comments in [`env.template`](./env.template). Shared behavior is in the root [`README.md`](../../README.md) Environment Model.

## Development and Testing

Run from `apps/pdf`:

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
