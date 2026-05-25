# Helvety dependency inventory (extended)

Canonical list of **non-npm-only** dependencies and high-impact pins for public-tool zones (`pdf`, `docs`, `image-upscaler`, `web`) plus monorepo-wide toolchain. Used by the Cursor **`dependency-update`** skill (`.cursor/skills/dependency-update/SKILL.md`).

**Maintain this file** whenever you change a pin (SHA-256, vendored worker, git override, hosted model upload, or major vendor bump). Run `bun run deps:inventory` for a machine-readable snapshot of current pins.

## How to use

1. **Npm/toolchain** — follow root `README.md` (`bun outdated`, `@helvety/dev-deps`, `bun run deps:drift`, `deps:security`, `ci:check`).
2. **Extended assets** — walk each table below; check upstream `checkUrl` for releases, breaking changes, licenses, and size.
3. **Apply updates** — follow the **Update procedure** column; re-run zone-specific verification and update this doc.

---

## Monorepo-wide

| Name                                 | Current pin                                                           | Upstream                       | Check URL                                                        | Update procedure                                                                 | Risk                 |
| ------------------------------------ | --------------------------------------------------------------------- | ------------------------------ | ---------------------------------------------------------------- | -------------------------------------------------------------------------------- | -------------------- |
| Bun                                  | `1.3.14` — `package.json` `packageManager`                            | [bun.sh](https://bun.sh)       | https://github.com/oven-sh/bun/releases                          | Bump `packageManager`, CI `.github/workflows/ci.yml`, README; `bun install`      | CI/local install     |
| Node.js                              | `24.x` — `.nvmrc`, `engines.node`                                     | Node LTS                       | https://github.com/nodejs/node/releases                          | Align `.nvmrc`, all workspace `engines`, CI `node-version`                       | Runtime/API          |
| `@helvety/dev-deps`                  | `packages/dev-deps/package.json`                                      | Workspace                      | —                                                                | Edit dev-deps first; run `deps:drift`                                            | All workspaces       |
| Workspace drift specifiers           | `scripts/check-workspace-version-drift.mjs` `REQUIRED_VERSION_BY_DEP` | Per package                    | npm/GitHub releases                                              | Update map + matching `package.json` / dev-deps                                  | `ci:check` fails     |
| `eslint-plugin-react` (git override) | `f6ec87dd…` — root `package.json` `overrides`                         | jsx-eslint/eslint-plugin-react | https://github.com/jsx-eslint/eslint-plugin-react/commits/master | Change commit hash in override; lint all apps                                    | ESLint rule breakage |
| Supabase JS client                   | `^2.106.0` (drift + security floors)                                  | supabase-js                    | https://github.com/supabase/supabase-js/releases                 | Bump in drift script + apps; `deps:security:floors`                              | Auth/API             |
| `@supabase/ssr`                      | `^0.10.3` (drift)                                                     | supabase/ssr                   | https://github.com/supabase/ssr/releases                         | Same as above                                                                    | Cookie/session       |
| Next.js                              | `^16.2.6` (drift; web is canonical)                                   | Vercel                         | https://github.com/vercel/next.js/releases                       | Bump apps + `docs/naming-conventions.md` doc link (`consistency:toolchain-docs`) | All zones            |
| React / React DOM                    | `^19.2.6` (drift)                                                     | Meta                           | https://github.com/facebook/react/releases                       | Bump with Next compatibility                                                     | All apps             |

---

## image-upscaler

| Name                        | Current pin                                                             | Upstream                                | Check URL                                                | Update procedure                                                                                                                                 | Risk                                |
| --------------------------- | ----------------------------------------------------------------------- | --------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------- |
| Real-ESRGAN ONNX weights    | SHA-256 in `apps/image-upscaler/lib/models.ts` (`realesr-general-x4v3`) | xinntao/Real-ESRGAN; Qualcomm HF export | https://huggingface.co/qualcomm/Real-ESRGAN-General-x4v3 | Re-export per `apps/image-upscaler/public/models/README.md`; update `sha256` + `externalData`; upload to Supabase bucket `image-upscaler-models` | Inference break, download size      |
| Supabase Storage bucket     | `image-upscaler-models` — `lib/models.ts`                               | Supabase                                | Project dashboard                                        | Create/sync bucket per runbook; same filenames                                                                                                   | 404 on first AI run                 |
| `onnxruntime-web`           | `^1.26.0` — `apps/image-upscaler/package.json`                          | Microsoft ONNX Runtime                  | https://github.com/microsoft/onnxruntime/releases        | Bump package; run `prebuild` / `copy-ort-runtime.mjs`; verify worker `wasmPaths` and CSP                                                         | WASM path/API changes               |
| ORT WASM/JSEP (self-hosted) | Copied to `apps/image-upscaler/public/ort/` (gitignored)                | From `onnxruntime-web` dist             | ORT web docs                                             | `node scripts/copy-ort-runtime.mjs` after ORT bump                                                                                               | CSP / 404 on `/image-upscaler/ort/` |
| `canvas-size`               | `^2.0.0` — app `package.json`                                           | npm                                     | https://www.npmjs.com/package/canvas-size                | Standard npm bump                                                                                                                                | Input limits                        |

---

## pdf

| Name                           | Current pin                          | Upstream                 | Check URL                                       | Update procedure                                            | Risk                 |
| ------------------------------ | ------------------------------------ | ------------------------ | ----------------------------------------------- | ----------------------------------------------------------- | -------------------- |
| `pdfjs-dist`                   | `^5.7.284` + app `overrides`         | Mozilla pdf.js           | https://github.com/mozilla/pdf.js/releases      | Bump; `bun run sync:pdf-worker` in `apps/pdf`; smoke viewer | Worker API mismatch  |
| PDF.js worker (vendored)       | `apps/pdf/public/pdf.worker.min.mjs` | From `pdfjs-dist/build/` | Same as pdf.js                                  | `apps/pdf/scripts/sync-pdf-worker.mjs` on dev/build         | Stale worker vs lib  |
| `pdf-lib`                      | `^1.17.1`                            | Hopding/pdf-lib          | https://github.com/Hopding/pdf-lib/releases     | npm bump; worker merge/export tests                         | PDF corruption       |
| `react-pdf`                    | `^10.4.1`                            | wojtekmaj/react-pdf      | https://github.com/wojtekmaj/react-pdf/releases | npm bump; ensure `pdfjs-dist` override wins                 | Nested pdfjs version |
| `@napi-rs/canvas` (transitive) | Via `pdfjs-dist`; stubbed SSR        | napi-rs/canvas           | —                                               | No action unless removing stub; client-only                 | Build-only           |

---

## docs

| Name                          | Current pin                                                                          | Upstream             | Check URL                                        | Update procedure                                                               | Risk                 |
| ----------------------------- | ------------------------------------------------------------------------------------ | -------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------ | -------------------- |
| `@eigenpal/docx-editor-react` | `^1.0.2` — `apps/docs/package.json`                                                  | eigenpal/docx-editor | https://github.com/eigenpal/docx-editor/releases | npm bump; **Eigenpal upgrade checklist** in `apps/docs/README.md`; theme tests | UI/theme regressions |
| Eigenpal theme bridge         | `apps/docs/styles/docx-editor-helvety-bridge.css`, `lib/docx-editor-theme-tokens.ts` | In-repo              | —                                                | Extend bridge if vendor class names change                                     | Dark/light contrast  |
| Google Material Symbols (CDN) | `apps/docs/app/globals.css` `@import`                                                | Google Fonts         | https://fonts.google.com/icons                   | CSP already allows via `googleFonts` proxy profile; verify toolbar icons       | CSP block            |
| Docx transitive stack         | `docxtemplater`, ProseMirror, etc. (lockfile)                                        | Various              | npm / Eigenpal changelog                         | Usually follows Eigenpal bump                                                  | Template/export      |

---

## web (gateway)

| Name                                        | Current pin                             | Upstream              | Check URL                                         | Update procedure                                                                                  | Risk              |
| ------------------------------------------- | --------------------------------------- | --------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ----------------- |
| React Bits (Hyperspeed, Shuffle, ShinyText) | Vendored `apps/web/components/vendor/*` | reactbits.dev         | https://reactbits.dev                             | `cd apps/web && shadcn add @react-bits/...`; reconcile per `docs/ui-shadcn-integration-policy.md` | Hero motion/WebGL |
| `three`                                     | `^0.184.0`                              | three.js              | https://github.com/mrdoob/three.js/releases       | Bump with `@types/three` (`0.184.1` drift); Hyperspeed tests                                      | WebGL shaders     |
| `postprocessing`                            | `^6.39.1`                               | pmndrs/postprocessing | https://github.com/pmndrs/postprocessing/releases | npm bump; hero visual check                                                                       | Bloom/pass API    |
| `gsap` / `@gsap/react`                      | `^3.15.0` / `^2.1.2`                    | GreenSock             | https://github.com/greensock/GSAP/releases        | npm bump; Shuffle tests                                                                           | Animation API     |
| `framer-motion`                             | `^12.39.0`                              | Motion                | https://github.com/motiondivision/motion/releases | npm bump; hero-text tests                                                                         | Motion v12 API    |
| `@helvety/light-pillar`                     | workspace                               | In-repo               | —                                                 | Co-change with Hyperspeed backdrop                                                                | Gateway hero      |

---

## External repositories (not in this monorepo)

Listed in Store catalog / extension docs; bump or release separately from `helvety` npm.

| Product                               | Repository                                                                            | Check URL                             |
| ------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------- |
| Helvety Chromium extension            | https://github.com/CasparRubin/helvety-browser-extension-chromium                     | GitHub releases                       |
| Power Platform Configurator extension | https://github.com/CasparRubin/power-platform-configurator-browser-extension-chromium | GitHub releases                       |
| Shared extension chrome               | Consumes `@helvety/extension-chrome` from this repo                                   | `packages/extension-chrome/README.md` |

When `@helvety/extension-chrome` changes, coordinate releases in those external repos.

---

## Hosted services (no version in repo)

| Service                      | Used by                               | Notes                                                        |
| ---------------------------- | ------------------------------------- | ------------------------------------------------------------ |
| Supabase (Auth, DB, Storage) | docs vault, upscaler models, sessions | Schema: `supabase/getSupabase.sql` (local export gitignored) |
| Upstash Redis                | rate limits (shared proxy)            | Env per `docs/turbo-env-tiers.md`                            |
| Vercel                       | deploy per `apps/*/vercel.json`       | Node 24; monorepo roots                                      |

Check Supabase CLI/dashboard and Vercel runtime advisories during major updates.

---

## Related commands

```bash
bun run deps:inventory    # snapshot pins (extended)
bun run deps:outdated     # npm outdated
bun run deps:drift        # workspace specifier alignment
bun run deps:security     # floors + audit
bun run ci:check          # full gate including deps:drift
```
