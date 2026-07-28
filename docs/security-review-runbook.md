# Security review runbook

Periodic checks for the Helvety monorepo. Run locally or before major releases.

**Zones:** `web`, `store`, `pdf`, `image-editor`, `ocr`.

## Automated local checks (`ci:check`)

```bash
bun run ci:check
```

`ci:check` includes proxy wiring, env template tiers, and security dependency floors (`deps:security:floors`).

## Manual pre-release checks (not part of `ci:check`)

Run these before major releases or production promotions:

```bash
bun run deps:security
bun run consistency:vercel-prod-env
bun run consistency:vercel-preview-env
bun run ci:check:e2e
# or, with an existing gateway only:
HELVETY_SMOKE_BASE_URL=http://localhost:3001 bun run test:e2e
```

`deps:security` runs floors plus `bun audit`. Vercel env audits require Vercel CLI login. `ci:check:e2e` installs Chromium if needed, starts zone dev servers when `HELVETY_SMOKE_BASE_URL` is unset, and runs Playwright gateway smoke tests.

## Vercel production and preview env

Requires Vercel CLI login:

```bash
bun run consistency:vercel-prod-env
bun run consistency:vercel-preview-env
```

Preview env should mirror Production tier keys (same allow/forbid rules); never set `SKIP_ENV_VALIDATION=1` on Vercel.

### Vercel dashboard (manual, five zone projects)

Applies to every Vercel project in [`vercel-monorepo-apps.md`](./vercel-monorepo-apps.md).

- **Analytics → Web Analytics** and **Speed Insights** must stay **disabled** (Helvety CSP does not allow `va.vercel-scripts.com`).
- Do not set `NEXT_PUBLIC_HELVETY_VERCEL_ANALYTICS`, `NEXT_PUBLIC_VERCEL_ANALYTICS_ID`, or `VERCEL_ANALYTICS_ID` in Production or Preview.
- Align Node.js version with zone apps (24.x per `.nvmrc`).

## Store public downloads

- SPFx packages (for example Helvety SPO Explorer) resolve to GitHub Releases asset URLs in `apps/store/lib/packages/config.ts`.
- Signed redirect URLs from `createPackageDownload` must pass `isAllowedDownloadUrl` (trusted GitHub hosts only: `github.com`, `objects.githubusercontent.com`, `release-assets.githubusercontent.com`).
- Reject test URLs with path traversal or wrong origin before shipping download config changes.
- Power Platform Configurator installs from the Chrome Web Store (no Store-hosted ZIP).

## CSP

Document accepted tradeoffs in [`packages/config/next-headers.mjs`](../packages/config/next-headers.mjs): `style-src 'unsafe-inline'`, dev `unsafe-eval`, `wasm-unsafe-eval` where public tools need WASM (OCR).

## Quarterly cadence

1. `bun run ci:check` on `main`
2. `bun run consistency:vercel-prod-env` and `bun run consistency:vercel-preview-env`
3. `bun run deps:outdated` + [`docs/dependency-inventory.md`](./dependency-inventory.md) extended assets
4. Spot-check Store download redirects and Chrome Web Store / GitHub release links for catalog products
