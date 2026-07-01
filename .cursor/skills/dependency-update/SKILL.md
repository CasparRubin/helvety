---
name: dependency-update
description: >-
  Update dependencies to latest stable compatible versions for the Helvety
  monorepo. Use when the user asks for dependency updates, bump deps, bun
  outdated, deps:drift, package upgrades, security floors, or a full dependency
  sweep. Covers npm/toolchain AND extended assets (ONNX models, ORT WASM, PDF.js
  worker, React Bits vendor, external repos)—not npm-only.
---

# Helvety dependency update

Full-stack dependency maintenance: **npm/workspace pins** plus **extended inventory** (models, vendored binaries, CDN, vendored UI).

## Before you start

1. Read [docs/dependency-inventory.md](../../../docs/dependency-inventory.md).
2. Ask whether the user wants **report-only** (no version bumps) or **apply updates**.
3. Target: **latest stable & compatible** — never break `deps:drift`, `deps:security:floors`, or documented override policy without fixing downstream.

## Phase 1 — Npm and toolchain

1. `bun run deps:outdated` (root).
2. If toolchain packages move, update [`packages/dev-deps/package.json`](../../../packages/dev-deps/package.json) first, then consuming workspaces.
3. Align [`scripts/check-workspace-version-drift.mjs`](../../../scripts/check-workspace-version-drift.mjs) `REQUIRED_VERSION_BY_DEP` when shared specifiers change.
4. `bun install` → `bun run deps:drift` → `bun run deps:security`.
5. After filtered `bun update <pkg...> --filter='@helvety/*'`, confirm root `package.json` has **no** `dependencies` block (drift enforces this). Never use bare `bun update -r` at the repo root — Bun may add packages to root `dependencies`.
6. After substantive bumps: `bun run ci:check` or at minimum `lint`, `type-check`, `test` for touched workspaces.
7. Do **not** commit `supabase/supabase.json` (gitignored export).

See [reference.md](./reference.md) for command cheat sheet.

## Phase 2 — Extended inventory

1. `bun run deps:inventory` — print current extended pins.
2. Walk every table in [docs/dependency-inventory.md](../../../docs/dependency-inventory.md) by zone: `image-upscaler`, `pdf`, `web`, monorepo-wide, external repos.
3. For each row with a **Check URL**, research upstream (WebSearch / WebFetch / GitHub releases / HuggingFace model cards). Record: latest version, release date, breaking changes, license, size impact.

## Phase 3 — Apply extended updates (when requested)

| Zone               | After bump                                                                                                         | Verification                                                           |
| ------------------ | ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| **image-upscaler** | ORT: `copy-ort-runtime.mjs`; model: runbook in `apps/image-upscaler/public/models/README.md`                       | Update SHA-256 in `lib/models.ts`; upload Supabase; smoke AI upscale   |
| **pdf**            | Bump `react-pdf` only (not `pdfjs-dist` at root/apps/pdf); `bun install`; `cd apps/pdf && bun run sync:pdf-worker` | Viewer + merge tests; worker test suite; `consistency:pdfjs-worker`    |
| **web**            | React Bits via shadcn from `apps/web`                                                                              | Reconcile `components/vendor/`; `docs/ui-shadcn-integration-policy.md` |

Update [docs/dependency-inventory.md](../../../docs/dependency-inventory.md) if pins or procedures changed.

## Phase 4 — External repos

Mention Store/extension repos from inventory **external repositories** table. Note if `@helvety/extension-chrome` changes require coordinated releases outside this monorepo.

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

(Manual steps: Supabase upload, external repo release, visual QA)
```

## Report-only mode

When the user only wants a sweep: run Phases 1–2 and output the report **without** editing `package.json`, lockfile, models, or vendored files unless they explicitly approve each change.
