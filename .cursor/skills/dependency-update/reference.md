# Dependency update — command reference

## Snapshot and gates

```bash
bun run deps:inventory
bun run deps:outdated
bun run deps:drift
bun run deps:security
bun run ci:check
```

## Toolchain order

1. Edit `packages/dev-deps/package.json`
2. `bun install`
3. Update `scripts/workspace-version-drift.config.json` if shared specifiers changed
4. `bun run deps:drift`

## Bun update (monorepo)

Never run bare `bun update -r` at the repo root — Bun may add packages to root `dependencies`. Prefer workspace filters:

```bash
bun update <packages...> --filter='@helvety/*'
```

After any root-level update, confirm root `package.json` has **no** `dependencies` block (only `devDependencies`).

## Zone scripts

```bash
# image-upscaler — ORT WASM into public/ort/
node scripts/copy-ort-runtime.mjs

# pdf — PDF.js worker (from react-pdf's resolved pdfjs-dist)
cd apps/pdf && bun run sync:pdf-worker   # dev/build also run this automatically
# Root command syncs first, then validates (same as ci:check pdf gate)
bun run consistency:pdfjs-worker

# ocr — Tesseract worker/WASM + PDF.js worker
cd apps/ocr && bun run sync:assets       # sync:tesseract + sync:pdf-worker (dev/build run this)
bun run download:tessdata                # only when adding/refreshing eng/deu language data
# Root command validates both pdf and ocr zones (same as ci:check)
bun run consistency:pdfjs-worker

# web — React Bits (from apps/web)
# shadcn add @react-bits/<name>.json — then reconcile apps/web/components/vendor/
```

## ONNX model operator flow

1. Follow `apps/image-upscaler/public/models/README.md`
2. Update SHA-256 in `apps/image-upscaler/lib/models.ts`
3. Upload `.onnx` + `.data` to Supabase bucket `image-upscaler-models`
4. Clear browser Cache API `upscale-models-v1` when testing

## Docs

- Inventory: `docs/dependency-inventory.md`
- UI vendor policy: `docs/ui-shadcn-integration-policy.md`
