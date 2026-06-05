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
3. Update `scripts/check-workspace-version-drift.mjs` if shared specifiers changed
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

# pdf — PDF.js worker (from app pdfjs-dist, not react-pdf nested tree)
cd apps/pdf && bun run sync:pdf-worker

# docs — after Eigenpal bump
cd apps/docs && bun run test

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
- Eigenpal checklist: `apps/docs/README.md` § Eigenpal upgrade checklist
