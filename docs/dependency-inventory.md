# Helvety dependency inventory (extended)

Canonical list of **non-npm-only** dependencies and high-impact pins for public-tool zones (`pdf`, `image-upscaler`, `web`) plus monorepo-wide toolchain. Used by the Cursor **`dependency-update`** skill (`.cursor/skills/dependency-update/SKILL.md`).

**Maintain this file** whenever you change a pin (SHA-256, vendored worker, git override, hosted model upload, or major vendor bump). Run `bun run deps:inventory` for a machine-readable snapshot of current pins.

## How to use

1. **Npm/toolchain** — follow root `README.md` (`bun run deps:outdated`, `@helvety/dev-deps`, `bun run deps:drift`, `deps:security`, `ci:check`). Apply bumps with filtered `bun update <pkg...> --filter='@helvety/*'` (never bare `bun update -r` at repo root).
2. **Extended assets** — walk each table below; check upstream `checkUrl` for releases, breaking changes, licenses, and size.
3. **Apply updates** — follow the **Update procedure** column; re-run zone-specific verification and update this doc.

---

## Monorepo-wide

| Name                                 | Current pin                                                                                                                                                                                       | Upstream                       | Check URL                                                        | Update procedure                                                                 | Risk                        |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | ---------------------------------------------------------------- | -------------------------------------------------------------------------------- | --------------------------- |
| Bun                                  | `1.3.14` — `package.json` `packageManager`                                                                                                                                                        | [bun.sh](https://bun.sh)       | https://github.com/oven-sh/bun/releases                          | Bump `packageManager`, README; `bun install`                                     | local install               |
| Node.js                              | `24.x` — `.nvmrc`, `engines.node`                                                                                                                                                                 | Node LTS                       | https://github.com/nodejs/node/releases                          | Align `.nvmrc` and all workspace `engines`                                       | Runtime/API                 |
| `@helvety/dev-deps`                  | `packages/dev-deps/package.json`                                                                                                                                                                  | Workspace                      | —                                                                | Edit dev-deps first; run `deps:drift`                                            | All workspaces              |
| Workspace drift specifiers           | `scripts/check-workspace-version-drift.mjs` `REQUIRED_VERSION_BY_DEP`                                                                                                                             | Per package                    | npm/GitHub releases                                              | Update map + matching `package.json` / dev-deps                                  | `ci:check` fails            |
| `eslint-plugin-react` (git override) | `f6ec87dd…` — root `package.json` `overrides`                                                                                                                                                     | jsx-eslint/eslint-plugin-react | https://github.com/jsx-eslint/eslint-plugin-react/commits/master | Change commit hash in override; lint all apps                                    | ESLint rule breakage        |
| Supabase JS client                   | `^2.108.2` (drift; security floor `2.108.2`; root override `2.108.2`)                                                                                                                             | supabase-js                    | https://github.com/supabase/supabase-js/releases                 | Bump in drift script + apps; `deps:security:floors`                              | Auth/API                    |
| `@supabase/ssr`                      | `^0.12.0` (drift)                                                                                                                                                                                 | supabase/ssr                   | https://github.com/supabase/ssr/releases                         | Proxy `setAll` must apply cache headers; `consistency:supabase-auth`             | Cookie/session              |
| Next.js                              | `^16.2.9` (drift; web is canonical)                                                                                                                                                               | Vercel                         | https://github.com/vercel/next.js/releases                       | Bump apps + `docs/naming-conventions.md` doc link (`consistency:toolchain-docs`) | All zones                   |
| React / React DOM                    | `^19.2.7` (drift)                                                                                                                                                                                 | Meta                           | https://github.com/facebook/react/releases                       | Bump with Next compatibility                                                     | All apps                    |
| Root security overrides              | `hono@4.12.27`, `vite@8.1.0`, `rollup@4.62.2`, `pdfjs-dist@6.1.200`, `protobufjs@7.6.4`, `dompurify@3.4.11`, `js-yaml@4.2.0`, `undici@7.28.0`, `@babel/core@8.0.1`, `postcss@8.5.15`, `qs@6.15.3` | npm                            | `bun audit`                                                      | Bump root `overrides`; `bun install`                                             | Transitive CVEs             |
| `@types/*` dedupe overrides          | `@types/node@24.13.2`, `@types/react@19.2.17`, `@types/react-dom@19.2.3` — root `package.json`                                                                                                    | DefinitelyTyped                | npm releases                                                     | Bump with dev-deps drift map; stay on Node 24 types until engines move           | Type skew across workspaces |

---

## image-upscaler

| Name                        | Current pin                                                             | Upstream                                | Check URL                                                | Update procedure                                                                                                                                     | Risk                                |
| --------------------------- | ----------------------------------------------------------------------- | --------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| Real-ESRGAN ONNX weights    | SHA-256 in `apps/image-upscaler/lib/models.ts` (`realesr-general-x4v3`) | xinntao/Real-ESRGAN; Qualcomm HF export | https://huggingface.co/qualcomm/Real-ESRGAN-General-x4v3 | Re-export per `apps/image-upscaler/public/models/README.md`; update `sha256` + `externalData`; upload to Supabase bucket `image-upscaler-models`     | Inference break, download size      |
| Supabase Storage bucket     | `image-upscaler-models` — `lib/models.ts`                               | Supabase                                | Project dashboard                                        | Create/sync bucket per runbook; same filenames                                                                                                       | 404 on first AI run                 |
| `onnxruntime-web`           | `^1.27.0` — `apps/image-upscaler/package.json`                          | Microsoft ONNX Runtime                  | https://github.com/microsoft/onnxruntime/releases        | Bump package; run `predev`/`prebuild` (both invoke `copy-ort-runtime.mjs`) or `node scripts/copy-ort-runtime.mjs`; verify worker `wasmPaths` and CSP | WASM path/API changes               |
| ORT WASM/JSEP (self-hosted) | Copied to `apps/image-upscaler/public/ort/` (gitignored)                | From `onnxruntime-web` dist             | ORT web docs                                             | `node scripts/copy-ort-runtime.mjs` after ORT bump                                                                                                   | CSP / 404 on `/image-upscaler/ort/` |
| `canvas-size`               | `^2.0.0` — app `package.json`                                           | npm                                     | https://www.npmjs.com/package/canvas-size                | Standard npm bump                                                                                                                                    | Input limits                        |

---

## pdf

| Name                           | Current pin                          | Upstream                     | Check URL                                       | Update procedure                                                                     | Risk                 |
| ------------------------------ | ------------------------------------ | ---------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------ | -------------------- |
| `pdfjs-dist`                   | `^6.1.200` + app/root `overrides`    | Mozilla pdf.js               | https://github.com/mozilla/pdf.js/releases      | Bump; `bun run sync:pdf-worker` in `apps/pdf`; smoke viewer                          | Worker API mismatch  |
| PDF.js worker (vendored)       | `apps/pdf/public/pdf.worker.min.mjs` | From app `pdfjs-dist/build/` | Same as pdf.js                                  | `apps/pdf/scripts/sync-pdf-worker.mjs` on dev/build                                  | Stale worker vs lib  |
| `pdf-lib`                      | `^1.17.1`                            | Hopding/pdf-lib              | https://github.com/Hopding/pdf-lib/releases     | npm bump; worker merge/export tests                                                  | PDF corruption       |
| `react-pdf`                    | `^10.4.1`                            | wojtekmaj/react-pdf          | https://github.com/wojtekmaj/react-pdf/releases | npm bump; keep root + app `pdfjs-dist` overrides aligned; smoke viewer + merge tests | pdfjs 6 API mismatch |
| `@napi-rs/canvas` (transitive) | Via `pdfjs-dist`; stubbed SSR        | napi-rs/canvas               | —                                               | No action unless removing stub; client-only                                          | Build-only           |

---

## web (gateway)

| Name                                        | Current pin                             | Upstream              | Check URL                                         | Update procedure                                                                                  | Risk              |
| ------------------------------------------- | --------------------------------------- | --------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ----------------- |
| React Bits (Hyperspeed, Shuffle, ShinyText) | Vendored `apps/web/components/vendor/*` | reactbits.dev         | https://reactbits.dev                             | `cd apps/web && shadcn add @react-bits/...`; reconcile per `docs/ui-shadcn-integration-policy.md` | Hero motion/WebGL |
| `three`                                     | `^0.185.0`                              | three.js              | https://github.com/mrdoob/three.js/releases       | Bump with `@types/three` (`0.185.0` drift); Hyperspeed tests                                      | WebGL shaders     |
| `postprocessing`                            | `^6.39.1`                               | pmndrs/postprocessing | https://github.com/pmndrs/postprocessing/releases | npm bump; hero visual check                                                                       | Bloom/pass API    |
| `gsap` / `@gsap/react`                      | `^3.15.0` / `^2.1.2`                    | GreenSock             | https://github.com/greensock/GSAP/releases        | npm bump; Shuffle tests                                                                           | Animation API     |
| `framer-motion`                             | `^12.40.0`                              | Motion                | https://github.com/motiondivision/motion/releases | npm bump; hero-text tests                                                                         | Motion v12 API    |
| `@helvety/light-pillar`                     | workspace                               | In-repo               | —                                                 | Co-change with Hyperspeed backdrop                                                                | Gateway hero      |

---

## External repositories (not in this monorepo)

Listed in Store catalog / extension docs; bump or release separately from `helvety` npm.

| Product                               | Repository                                                                            | Check URL                                                                                                                              |
| ------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Helvety Chromium extension            | https://github.com/CasparRubin/helvety-browser-extension-chromium                     | GitHub releases                                                                                                                        |
| Power Platform Configurator extension | https://github.com/CasparRubin/power-platform-configurator-browser-extension-chromium | [Chrome Web Store](https://chromewebstore.google.com/detail/power-platform-configurat/mdneakhceachnimmejciaehnfjfabang); GitHub source |
| Shared extension chrome               | Consumes `@helvety/extension-chrome` from this repo                                   | `packages/extension-chrome/README.md`                                                                                                  |

When `@helvety/extension-chrome` changes, coordinate releases in those external repos.

---

## Hosted services (no version in repo)

| Service                      | Used by                         | Notes                                                        |
| ---------------------------- | ------------------------------- | ------------------------------------------------------------ |
| Supabase (Auth, DB, Storage) | upscaler models, sessions       | Schema: `supabase/getSupabase.sql` (local export gitignored) |
| Upstash Redis                | rate limits (shared proxy)      | Env per `docs/turbo-env-tiers.md`                            |
| Vercel                       | deploy per `apps/*/vercel.json` | Node 24; monorepo roots                                      |

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
