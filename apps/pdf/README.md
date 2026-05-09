# Helvety PDF

Browser-based PDF toolkit for merge/reorder/rotate/extract workflows.

**App URL:** <https://helvety.com/pdf>  
**Monorepo path:** `apps/pdf`

## Key Features

- Root `app/layout.tsx` uses `@helvety/ui/helvety-public-shell-root-layout` (overflow-main) and `@helvety/shared/seo` (`createHelvetyProductMetadata`) for shared metadata and shell chrome; shared layout-session bootstrap supplies an optional SSR session snapshot to the navbar (login still not required for tools)
- User-facing summaries: [`lib/product-copy.ts`](./lib/product-copy.ts) feeds metadata / JSON-LD (`PDF_APP_DESCRIPTION`) and PWA [`public/manifest.json`](./public/manifest.json) (`PDF_PWA_MANIFEST_DESCRIPTION`; verified by root `bun run consistency:install-manifest-metadata`); crawler hints in [`public/llms.txt`](./public/llms.txt)
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

## Crawl and Indexing

- `apps/pdf` is publicly indexable.
- `/pdf/robots.txt` allows crawl and advertises `/pdf/sitemap.xml`.
- `/pdf/sitemap.xml` contains canonical public URLs.

## Security Model

- File conversion is client-side for supported operations.
- `proxy.ts` provides request bootstrap and headers; this app does not require login.
- E2EE is not used in this app (E2EE apps are `tasks`, `contacts`, `notes`).

## Environment Variables

Copy `env.template` to `.env.local`.

| Variable                               | Required | Server-only | Description              |
| -------------------------------------- | -------- | ----------- | ------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`             | Yes      | No          | Supabase project URL     |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes      | No          | Supabase publishable key |

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

Licensed under the [MIT License](../../LICENSE).
