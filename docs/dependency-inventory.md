# Helvety dependency inventory (extended)

Canonical list of **non-npm-only** dependencies and high-impact pins for public zones (`pdf`, `image-editor`, `ocr`, `web`, `store`) plus monorepo-wide toolchain. Used by the Cursor **`dependency-update`** skill (`.cursor/skills/dependency-update/SKILL.md`).

**Maintain this file** whenever you change a pin (SHA-256, vendored worker, git override, or major vendor bump). Run `bun run deps:inventory` for a machine-readable snapshot of current pins.

## How to use

1. **Npm/toolchain:** follow root `README.md` (`bun run deps:outdated`, `@helvety/dev-deps`, `bun run deps:drift`, `deps:security`, `ci:check`). Apply bumps with filtered `bun update <pkg...> --filter='@helvety/*'` (never bare `bun update -r` at repo root).
2. **Extended assets:** walk each table below; check upstream `checkUrl` for releases, breaking changes, licenses, and size.
3. **Apply updates:** follow the **Update procedure** column; re-run zone-specific verification and update this doc.

---

## Monorepo-wide

| Name                                 | Current pin                                                                                                                                                                                                                                                                                       | Upstream                       | Check URL                                                        | Update procedure                                                                                     | Risk                        |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | --------------------------- |
| Bun                                  | `1.3.14` (`package.json` `packageManager`)                                                                                                                                                                                                                                                        | [bun.sh](https://bun.sh)       | https://github.com/oven-sh/bun/releases                          | Bump `packageManager`, README; `bun install`                                                         | local install               |
| Node.js                              | `24.x` (`.nvmrc`, `engines.node`)                                                                                                                                                                                                                                                                 | Node LTS                       | https://github.com/nodejs/node/releases                          | Align `.nvmrc` and all workspace `engines`                                                           | Runtime/API                 |
| `@helvety/dev-deps`                  | `packages/dev-deps/package.json`                                                                                                                                                                                                                                                                  | Workspace                      | (workspace)                                                      | Edit dev-deps first; run `deps:drift`                                                                | All workspaces              |
| Workspace drift specifiers           | [`scripts/workspace-version-drift.config.json`](../scripts/workspace-version-drift.config.json) `requiredVersionByDep`                                                                                                                                                                            | Per package                    | npm/GitHub releases                                              | Update map + matching `package.json` / dev-deps                                                      | `ci:check` fails            |
| `eslint-plugin-react` (git override) | `c9a2de77…` (root `package.json` `overrides`)                                                                                                                                                                                                                                                     | jsx-eslint/eslint-plugin-react | https://github.com/jsx-eslint/eslint-plugin-react/commits/master | Change commit hash in override; lint all apps                                                        | ESLint rule breakage        |
| Next.js                              | `^16.2.11` (drift; web is canonical)                                                                                                                                                                                                                                                              | Vercel                         | https://github.com/vercel/next.js/releases                       | Bump apps + `docs/naming-conventions.md` doc link (`consistency:toolchain-docs`)                     | All zones                   |
| React / React DOM                    | `^19.2.8` (drift)                                                                                                                                                                                                                                                                                 | Meta                           | https://github.com/facebook/react/releases                       | Bump with Next compatibility                                                                         | All apps                    |
| `@base-ui/react`                     | `^1.6.0` (drift; `@helvety/ui` only)                                                                                                                                                                                                                                                              | MUI Base UI                    | https://github.com/mui/base-ui/releases                          | Update `workspace-version-drift.config.json` + `packages/ui`; regen shadcn primitives if API changes | All UI surfaces             |
| shadcn CLI style                     | `base-vega` in all `components.json`                                                                                                                                                                                                                                                              | shadcn/ui                      | https://ui.shadcn.com/docs/changelog                             | Regen from `packages/ui`; re-apply Helvety customizations per this policy                            | Primitive breakage          |
| `shadcn` (CSS + CLI)                 | `^4.14.0` (production dep on `@helvety/ui`; `globals.css` imports `shadcn/tailwind.css`); CLI also in `@helvety/dev-deps`                                                                                                                                                                         | shadcn/ui                      | Same as CLI row                                                  | Update `workspace-version-drift.config.json` + `packages/ui`                                         | CSS build                   |
| Root security overrides              | `hono@4.12.31`, `vite@8.1.5`, `rollup@4.62.2`, `protobufjs@7.6.5`, `dompurify@3.4.12`, `js-yaml@4.3.0`, `undici@7.28.0`, `@babel/core@8.0.1`, `postcss@8.5.16`, `qs@6.15.3`, `brace-expansion@5.0.7`, `typescript-eslint@8.65.0`, `body-parser@2.3.0`, `sharp@0.35.3`, `@hono/node-server@2.0.11` | npm                            | `bun audit`                                                      | Bump root `overrides`; `bun install`                                                                 | Transitive CVEs             |
| `@types/*` dedupe overrides          | `@types/node@24.13.3`, `@types/react@19.2.17`, `@types/react-dom@19.2.3` (root `package.json`)                                                                                                                                                                                                    | DefinitelyTyped                | npm releases                                                     | Bump with dev-deps drift map; stay on Node 24 types until engines move                               | Type skew across workspaces |

---

## pdf

| Name                           | Current pin                                                       | Upstream                      | Check URL                                       | Update procedure                                                                                                                                              | Risk                |
| ------------------------------ | ----------------------------------------------------------------- | ----------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| `pdfjs-dist`                   | `5.4.296` via `react-pdf@^10.4.1` (transitive; lockfile-resolved) | Mozilla pdf.js                | https://github.com/mozilla/pdf.js/releases      | Owned by `react-pdf`: bump `react-pdf` first, then `sync:pdf-worker`; `consistency:pdfjs-worker`. **Never** pin at root or in `apps/pdf` independently.       | Worker API mismatch |
| PDF.js worker (vendored)       | `apps/pdf/public/pdf.worker.min.mjs`                              | `react-pdf>pdfjs-dist/build/` | Same as pdf.js                                  | Shared [`scripts/sync-pdf-worker.mjs`](../scripts/sync-pdf-worker.mjs) via `apps/pdf/scripts/sync-pdf-worker.mjs` on dev/build; writes `pdf.worker.meta.json` | Stale worker vs lib |
| `pdf-lib`                      | `^1.17.1`                                                         | Hopding/pdf-lib               | https://github.com/Hopding/pdf-lib/releases     | npm bump; worker merge/export tests                                                                                                                           | PDF corruption      |
| `react-pdf`                    | `^10.4.1`                                                         | wojtekmaj/react-pdf           | https://github.com/wojtekmaj/react-pdf/releases | npm bump; `bun install`; `sync:pdf-worker`; `consistency:pdfjs-worker`; smoke viewer + merge tests                                                            | pdfjs API mismatch  |
| `@napi-rs/canvas` (transitive) | Via `pdfjs-dist`; stubbed SSR                                     | napi-rs/canvas                | (transitive)                                    | No action unless removing stub; client-only                                                                                                                   | Build-only          |

---

## image-editor

| Name          | Current pin                                  | Upstream | Check URL                                       | Update procedure              | Risk              |
| ------------- | -------------------------------------------- | -------- | ----------------------------------------------- | ----------------------------- | ----------------- |
| `konva`       | `^10.3.0` (`apps/image-editor/package.json`) | Konva    | https://github.com/konvajs/konva/releases       | npm bump; canvas editor smoke | Canvas API        |
| `react-konva` | `^19.2.5` (`apps/image-editor/package.json`) | Konvajs  | https://github.com/konvajs/react-konva/releases | npm bump with React 19        | React-Konva API   |
| `canvas-size` | `^2.0.0` (`packages/shared/package.json`)    | npm      | https://www.npmjs.com/package/canvas-size       | Standard npm bump             | Input size limits |

---

## ocr

| Name                             | Current pin                                                       | Upstream                      | Check URL                                       | Update procedure                                                                                                                                              | Risk                |
| -------------------------------- | ----------------------------------------------------------------- | ----------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| `tesseract.js`                   | `^7.0.0` (`apps/ocr/package.json`)                                | naptha/tesseract.js           | https://github.com/naptha/tesseract.js/releases | npm bump; worker + WASM smoke; re-verify `wasm-unsafe-eval` CSP and bundled worker path                                                                       | OCR worker / WASM   |
| Tesseract traineddata (eng, deu) | `apps/ocr/public/tessdata/*.traineddata` (uncompressed)           | tesseract-ocr/tessdata_fast   | https://github.com/tesseract-ocr/tessdata_fast  | `cd apps/ocr && bun run download:tessdata` to refresh matching `tesseract.js` core; keep `eng` + `deu` only; committed and served locally (no CDN fetch)      | Language accuracy   |
| `pdfjs-dist`                     | `5.4.296` via `react-pdf@^10.4.1` (transitive; lockfile-resolved) | Mozilla pdf.js                | https://github.com/mozilla/pdf.js/releases      | Owned by `react-pdf`: bump `react-pdf` first, then `sync:pdf-worker`; `consistency:pdfjs-worker`. **Never** pin at root or in `apps/ocr` independently.       | Worker API mismatch |
| PDF.js worker (vendored)         | `apps/ocr/public/pdf.worker.min.mjs`                              | `react-pdf>pdfjs-dist/build/` | Same as pdf.js                                  | Shared [`scripts/sync-pdf-worker.mjs`](../scripts/sync-pdf-worker.mjs) via `apps/ocr/scripts/sync-pdf-worker.mjs` on dev/build; writes `pdf.worker.meta.json` | Stale worker vs lib |
| `react-pdf`                      | `^10.4.1`                                                         | wojtekmaj/react-pdf           | https://github.com/wojtekmaj/react-pdf/releases | npm bump; `bun install`; `sync:pdf-worker`; `consistency:pdfjs-worker`; smoke render + extract tests                                                          | pdfjs API mismatch  |

---

## web (gateway)

| Name                            | Current pin                             | Upstream      | Check URL                                         | Update procedure                                                                                  | Risk             |
| ------------------------------- | --------------------------------------- | ------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ---------------- |
| React Bits (Shuffle, ShinyText) | Vendored `apps/web/components/vendor/*` | reactbits.dev | https://reactbits.dev                             | `cd apps/web && shadcn add @react-bits/...`; reconcile per `docs/ui-shadcn-integration-policy.md` | Hero text motion |
| `gsap` / `@gsap/react`          | `^3.15.0` / `^2.1.2`                    | GreenSock     | https://github.com/greensock/GSAP/releases        | npm bump; Shuffle tests                                                                           | Animation API    |
| `framer-motion`                 | `^12.42.2`                              | Motion        | https://github.com/motiondivision/motion/releases | npm bump; hero-text tests                                                                         | Motion v12 API   |

---

## External repositories (not in this monorepo)

Listed in Store catalog; bump or release separately from `helvety` npm.

| Product                     | Repository                                                                            | Versioning / release notes                                                                                        | Check URL                                                                                                                              |
| --------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Power Platform Configurator | https://github.com/CasparRubin/power-platform-configurator-browser-extension-chromium | Separate repo; Chrome Web Store install. Uses `@helvety/extension-chrome` from this monorepo when vendored.       | [Chrome Web Store](https://chromewebstore.google.com/detail/power-platform-configurat/mdneakhceachnimmejciaehnfjfabang); GitHub source |
| Helvety SPO Explorer        | https://github.com/CasparRubin/helvety-spo-explorer                                   | SPFx `.sppkg` published as GitHub Release assets; Store download redirects to trusted GitHub Releases hosts.      | GitHub releases                                                                                                                        |
| Helvety Screen Tools        | Separate Windows desktop product                                                      | Store catalog card + install/source links; not built in this monorepo.                                            | Store product page                                                                                                                     |
| Shared extension chrome     | Consumes `@helvety/extension-chrome` from this repo                                   | Bump `@helvety/extension-chrome` in monorepo first; then release Power Platform Configurator if its copy changes. | `packages/extension-chrome/README.md`                                                                                                  |

---

## Hosted services (no version in repo)

| Service       | Used by                         | Notes                                                        |
| ------------- | ------------------------------- | ------------------------------------------------------------ |
| Upstash Redis | rate limits (Store downloads)   | Env per `docs/turbo-env-tiers.md`                            |
| Vercel        | deploy per `apps/*/vercel.json` | Node 24; five zone projects (`docs/vercel-monorepo-apps.md`) |

Check Vercel runtime advisories during major updates.

---

## Related commands

```bash
bun run deps:inventory    # snapshot pins (extended)
bun run deps:outdated     # npm outdated
bun run deps:drift        # workspace specifier alignment
bun run deps:security     # floors + audit
bun run consistency:pdfjs-worker  # pdf + ocr zones: sync worker + validate react-pdf alignment
bun run ci:check          # full gate including deps:drift
```
