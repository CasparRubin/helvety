---
name: dependency-update
description: >-
  Update dependencies to latest stable compatible versions for the Helvety
  monorepo. Use when the user asks for dependency updates, bump deps, bun
  outdated, deps:drift, package upgrades, security floors, or a full dependency
  sweep. Covers npm/toolchain AND extended assets (PDF.js worker, Tesseract
  assets, React Bits vendor, external repos); not npm-only.
---

# Helvety dependency update

Full-stack dependency maintenance: **npm/workspace pins** plus **extended inventory** (vendored binaries, vendored UI).

## Before you start

1. Read [docs/dependency-inventory.md](../../../docs/dependency-inventory.md).
2. Ask whether the user wants **report-only** (no version bumps) or **apply updates**.
3. Target: **latest stable & compatible**. Never break `deps:drift`, `deps:security:floors`, or documented override policy without fixing downstream.

## Phase 1: Npm and toolchain

1. `bun run deps:outdated` (root).
2. If toolchain packages move, update [`packages/dev-deps/package.json`](../../../packages/dev-deps/package.json) first, then consuming workspaces.
3. Update [`scripts/workspace-version-drift.config.json`](../../../scripts/workspace-version-drift.config.json) `requiredVersionByDep` when shared specifiers change (enforced by `check-workspace-version-drift.mjs` / `bun run deps:drift`).
4. `bun install` → `bun run deps:drift` → `bun run deps:security`.
5. After filtered `bun update <pkg...> --filter='@helvety/*'`, confirm root `package.json` has **no** `dependencies` block (drift enforces this). Never use bare `bun update -r` at the repo root. Bun may add packages to root `dependencies`.
6. After substantive bumps: `bun run ci:check` or at minimum `lint`, `type-check`, `test` for touched workspaces.

See [reference.md](./reference.md) for command cheat sheet.

## Phase 2: Extended inventory

1. `bun run deps:inventory`: print current extended pins.
2. Walk every table in [docs/dependency-inventory.md](../../../docs/dependency-inventory.md) by zone: `pdf`, `ocr`, `image-editor`, `web`, monorepo-wide, external repos.
3. For each row with a **Check URL**, research upstream (WebSearch / WebFetch / GitHub releases). Record: latest version, release date, breaking changes, license, size impact.

## Phase 3: Apply extended updates (when requested)

| Zone             | After bump                                                                                                                                                                                                                                          | Verification                                                           |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| **pdf**          | Bump `react-pdf` only (not `pdfjs-dist` at root/apps/pdf); `bun install`; `cd apps/pdf && bun run sync:pdf-worker`                                                                                                                                  | Viewer + merge tests; worker test suite; `consistency:pdfjs-worker`    |
| **ocr**          | `react-pdf` (not `pdfjs-dist` at root/apps/ocr) + `tesseract.js` (core is transitive); `bun install`; `cd apps/ocr && bun run sync:assets` (tesseract worker/WASM + pdf worker); `cd apps/ocr && bun run download:tessdata` only to refresh eng/deu | Render + extract tests; worker test suite; `consistency:pdfjs-worker`  |
| **image-editor** | Bump `konva` / `react-konva` as needed                                                                                                                                                                                                              | Canvas editor smoke                                                    |
| **web**          | React Bits via shadcn from `apps/web`                                                                                                                                                                                                               | Reconcile `components/vendor/`; `docs/ui-shadcn-integration-policy.md` |

Update [docs/dependency-inventory.md](../../../docs/dependency-inventory.md) if pins or procedures changed.

## Phase 4: External repos

Mention Store catalog products from inventory **external repositories** table (Power Platform Configurator, SPO Explorer, Screen Tools, Power Platform Tools). Note if `@helvety/extension-chrome` changes require coordinated releases outside this monorepo.

## Required report (always produce)

Use this structure in the final message:

```markdown
## Summary

(1–3 sentences: scope, report-only vs applied, overall risk)

## Npm / toolchain

| Package | Was | Now / available | Action |
...

## Extended assets

| Asset | Current pin | Upstream latest | Recommendation |
...

## Skipped / discuss

(Items deferred with reason)

## Verification

(Commands run and results)

## Follow-ups

(Manual steps: external repo release, visual QA)
```

## Report-only mode

When the user only wants a sweep: run Phases 1–2 and output the report **without** editing `package.json`, lockfile, or vendored files unless they explicitly approve each change.
