# Helvety Image Upscaler

Browser-based image upscaler for PNG/JPG/WebP files.

**App URL:** <https://helvety.com/image-upscaler>  
**Monorepo path:** `apps/image-upscaler`

## Key Features

- WebGPU-first processing with compatibility fallback
- Upscale by fixed factors (`2x`, `4x`) or target dimensions
- Batch queue with per-item statuses
- Shared command bar UX (primary/secondary actions)
- No login required

## Limits

- Maximum files per batch: `5`
- Supported formats: `PNG`, `JPG/JPEG`, `WebP`
- Maximum file size: `25MB` per image
- Maximum pixels: `32,000,000` per image

## Crawl and Indexing

- `apps/image-upscaler` is publicly indexable.
- `/image-upscaler/robots.txt` allows crawl and advertises `/image-upscaler/sitemap.xml`.
- `/image-upscaler/sitemap.xml` lists canonical public URLs.

## Security Model

- Image processing runs client-side for supported operations.
- `proxy.ts` handles request bootstrap and security headers.
- Input guards enforce file type, size, and pixel limits.
- E2EE is not used in this app (E2EE apps are `tasks`, `contacts`, `notes`).

## Environment Variables

Copy `env.template` to `.env.local`.

| Variable                               | Required | Server-only | Description              |
| -------------------------------------- | -------- | ----------- | ------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`             | Yes      | No          | Supabase project URL     |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes      | No          | Supabase publishable key |

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
