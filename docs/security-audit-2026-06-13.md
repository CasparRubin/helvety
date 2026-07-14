# Hosting, database & dependency security audit

> **Point-in-time snapshot (2026-06-13).** Findings below reflect that audit date. For **current** dependency pins and extended assets, use [`dependency-inventory.md`](./dependency-inventory.md). See [Subsequent updates](#subsequent-updates-2026-06-17) for material changes after this audit.

**Date:** 2026-06-13  
**Scope:** Supabase MCP, Vercel MCP/CLI, local guardrails, full dependency sweep (npm + extended assets)

## Summary

Live audit confirms a **strong security posture**: all 9 user-data tables have forced RLS with owner-scoped policies, Vercel Production env tiers pass automated checks, and `bun audit` reports zero CVEs. Applied dependency updates: `hono` 4.12.25, `rollup` 4.62.0. Regenerated Supabase TypeScript types via MCP and refreshed local RLS export metadata. **As of the audit date**, manual follow-ups remained for Supabase Auth dashboard settings, Vercel Preview Upstash keys on two tool zones, and confirming Analytics is disabled on all projects — see [Subsequent updates](#subsequent-updates-2026-06-17) for what changed after this snapshot.

---

## Supabase (`helvety`, `eu-central-2`, Postgres 17.6.1)

| Check                          | Result                                                                                                                                                                                                                                                  |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Project health                 | `ACTIVE_HEALTHY`                                                                                                                                                                                                                                        |
| User-data tables (9)           | RLS **enabled + forced**                                                                                                                                                                                                                                |
| Policies                       | `auth.uid()` owner scope; credentials table denies all direct access                                                                                                                                                                                    |
| `anon` grants on vault tables  | **None**                                                                                                                                                                                                                                                |
| Public views                   | **None**                                                                                                                                                                                                                                                |
| `SECURITY DEFINER` in `public` | Not executable by `anon` / `authenticated`                                                                                                                                                                                                              |
| Edge functions                 | **None**                                                                                                                                                                                                                                                |
| Storage                        | `packages` private + deny-all; `image-upscaler-models` public by design (ONNX weights)                                                                                                                                                                  |
| Security advisor               | **WARN:** [Leaked password protection disabled](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) _(historical; **not applicable** as of 2026-07-04 — no password sign-in; Supabase Free tier)_ |
| Local RLS export               | `consistency:supabase-rls` **passed** (export metadata refreshed 2026-06-13)                                                                                                                                                                            |

### Manual dashboard actions

1. ~~**Authentication → Email:** Enable leaked-password protection~~ **Not applicable** (2026-07-04): Helvety uses email OTP + passkeys only; the setting is Pro-tier only on Supabase Free.
2. **Authentication → Providers:** Disable any unused OAuth/OIDC providers.
3. **Authentication → Sessions** (Pro): JWT 3600s, time-box 7d, inactivity 24h — align with `packages/shared/src/auth-session-policy.ts`.
4. **Project Settings → Infrastructure:** Note GoTrue version; ensure ≥ 2.185.0 if OIDC is enabled ([CVE-2026-31813](https://www.sentinelone.com/vulnerability-database/cve-2026-31813/)).

---

## Vercel (team Helvety, 9 zone projects — historical; **10 zones** as of Image Editor launch; **11 zones** as of Helvety OCR launch — see [Subsequent updates (2026-07-11)](#subsequent-updates-2026-07-11))

| Check          | Result                                                                                                                                                                                                                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Projects       | All 9 present; latest Production deploys **READY**                                                                                                                                                                                                                                                      |
| Production env | `bun run consistency:vercel-prod-env` **passed**                                                                                                                                                                                                                                                        |
| Preview env    | `bun run consistency:vercel-preview-env` **failed** — missing Upstash on `helvety-pdf` and `helvety-image-upscaler` (remediated 2026-06; see [`env-vercel-audit-checklist.md`](./env-vercel-audit-checklist.md))                                                                                        |
| Node version   | **Snapshot 2026-06-13:** `helvety-com` Project Setting was 22.x; zone apps 24.x. **Current repo SSOT:** all eleven apps + root `engines.node: "24.x"` (`.nvmrc` `24`). Residual: confirm Vercel `helvety-com` UI is 24.x (see [U5](#subsequent-updates-2026-07-14--cross-repo-uxsecurity-remediation)). |

### Manual dashboard actions

1. Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to **Preview** env on `helvety-pdf` and `helvety-image-upscaler` (Production already has them on other tiers; these two zones are missing Preview Upstash).
2. Confirm **Web Analytics** and **Speed Insights** disabled on all zone projects (nine at time of audit; `helvety-image-editor` and `helvety-ocr` added later — **eleven** total as of 2026-07-11).
3. After any `*_URL` gateway change, redeploy `helvety-com`.

---

## Npm / toolchain

> Snapshot at **2026-06-13** audit date. Current override pins: [`dependency-inventory.md`](./dependency-inventory.md).

| Package                                                   | Was     | Now (at audit)        | Action           |
| --------------------------------------------------------- | ------- | --------------------- | ---------------- |
| `hono` (override)                                         | 4.12.23 | **4.12.25**           | Bumped           |
| `rollup` (override)                                       | 4.61.1  | **4.62.0**            | Bumped           |
| `next`, `react`, `@supabase/supabase-js`, `@supabase/ssr` | pinned  | latest stable         | No change needed |
| Toolchain (`@helvety/dev-deps`)                           | current | latest within pins    | No change needed |
| `bun audit`                                               | —       | **0 vulnerabilities** | —                |

---

## Extended assets

> Pins below are **as of 2026-06-13**. For **current** pins, use [`dependency-inventory.md`](./dependency-inventory.md). Dependency changelog: [Subsequent updates (2026-07-14)](#subsequent-updates-2026-07-14--cross-repo-uxsecurity-remediation) (latest code remediations); also [2026-07-11](#subsequent-updates-2026-07-11).

| Asset                              | Pin at audit (2026-06-13)                                            | Upstream latest (at audit)                               | Recommendation                                                                                   |
| ---------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `onnxruntime-web`                  | 1.26.0                                                               | 1.26.0                                                   | **Keep** — latest stable                                                                         |
| Real-ESRGAN ONNX (Supabase bucket) | SHA in `apps/image-upscaler/lib/models.ts`                           | unchanged                                                | **Keep** — no upstream model change                                                              |
| `pdfjs-dist`                       | via `react-pdf@10.4.1` → `5.4.296` (transitive; do not root/app pin) | see [`dependency-inventory.md`](dependency-inventory.md) | **Follow react-pdf** — worker must match runtime API; `consistency:pdfjs-worker` in `ci:check`   |
| `three` / `postprocessing`         | 0.184.0 / 6.39.1                                                     | same                                                     | **Removed (2026-07)** — gateway hero no longer uses a WebGL backdrop; row kept as audit snapshot |

> **Correction (2026-07-06):** Gateway hero no longer uses `three` / `postprocessing`, and the later follow-up WebGL backdrop was removed as well. See [`dependency-inventory.md`](./dependency-inventory.md).

> **Correction (2026-07-01):** An earlier draft of this table listed a direct `pdfjs-dist@6.0.227` pin. In production, `pdfjs-dist` is **transitive via `react-pdf`**; syncing the worker from a separate pin caused API/worker version skew. See [`docs/dependency-inventory.md`](dependency-inventory.md) (pdf zone) and root `consistency:pdfjs-worker`.

---

## Code / automation changes made

- [`scripts/audit-vercel-production-env.mjs`](../scripts/audit-vercel-production-env.mjs): added `--preview` flag.
- [`package.json`](../package.json): `consistency:vercel-preview-env` script; `hono`/`rollup` override bumps.
- [`docs/security-review-runbook.md`](./security-review-runbook.md): Storage tradeoffs, dashboard checklist, preview env audit.
- [`packages/shared/src/types/database.types.ts`](../packages/shared/src/types/database.types.ts): regenerated via Supabase MCP + `DatabaseSchema` alias restored.
- [`supabase/supabase.json`](../supabase/supabase.json): export metadata refreshed (gitignored; not committed).

---

## Skipped / discuss

| Item                              | Reason                                                                                                                                                                        |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Supabase migrations in VCS        | **Not used** — remote-first DDL on hosted Supabase; see [`security-review-runbook.md`](./security-review-runbook.md) and root [`README.md`](../README.md) § Supabase Workflow |
| Remote CI (GitHub Actions)        | Guardrails currently forbid; policy change required                                                                                                                           |
| Drop unused DB indexes            | Performance-only INFO from advisor; needs query traffic analysis                                                                                                              |
| Enable leaked password protection | **Not applicable** (2026-07-04): no password sign-in; Supabase Free tier                                                                                                      |

---

## Verification

### Snapshot at 2026-06-13 (historical)

```text
bun run consistency:supabase-rls          OK (9 tables)
bun run consistency:supabase-schema     OK
bun run consistency:vercel-prod-env       OK (all zones)
bun run consistency:vercel-preview-env    FAIL (pdf, image-upscaler missing Preview Upstash)
bun run deps:security                     OK (floors + audit)
bun run ci:check                          OK (lint, type-check, test)
```

Preview Upstash gaps were **remediated in 2026-06** (see [Subsequent updates (2026-06-20)](#subsequent-updates-2026-06-20)). Re-run the checks below for current status.

### Expected as of 2026-07-04

```text
bun run consistency:vercel-preview-env    OK (after 2026-06 remediation)
bun run deps:drift                        OK
bun run deps:security                     OK (0 CVEs at sweep time)
bun run ci:check                          OK
```

Manual smoke recommended: sign-in/logout, passkey unlock on one E2EE zone, extension passkey curl from runbook, store package download URL validation.

---

## Follow-ups

1. Complete Supabase Auth dashboard items above (~~leaked password protection~~ session JWT/time-box alignment if on Pro, disable unused OAuth).
2. ~~Add Preview Upstash env vars on `helvety-pdf` and `helvety-image-upscaler`~~ — **done** (2026-06); re-run `bun run consistency:vercel-preview-env` after any new zone.
3. Confirm Vercel Analytics disabled on all **eleven** zone projects (`helvety-image-editor` and `helvety-ocr` added after the June 2026 audit).
4. Align `helvety-com` Node.js to 24.x.
5. Confirm `HELVETY_CHROME_EXTENSION_ORIGINS` on `helvety-auth` includes every supported extension id (see [`docs/env-vercel-audit-checklist.md`](./env-vercel-audit-checklist.md)); redeploy auth after changes.
6. Run `supabase login` locally if you want `bun run db:gen-types` without MCP.

### Completed in auth/E2EE audit (2026-06-13)

- Added `user_passkey_params.key_check_value` column (applied on the hosted Supabase project via Supabase MCP; not tracked as SQL files in this repo).
- Regenerated `database.types.ts`; extension `PASSKEY_PARAMS_SELECT` includes KCV.
- Extension session bootstrap refactored to `getUser()`-first (`extension-session.ts`).
- Removed dead crypto exports (`StoredPasskey`, `WrappedKey`, wrap error types).

---

## Subsequent updates (2026-06-17)

Dependency sweep after this audit (see [`dependency-inventory.md`](./dependency-inventory.md) for canonical pins):

| Item                                      | 2026-06-13 audit  | As of 2026-06-17                                                                                                                  |
| ----------------------------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `@supabase/supabase-js` / `@supabase/ssr` | latest stable     | **^2.108.2**                                                                                                                      |
| `bun audit`                               | 0 vulnerabilities | **1 low** transitive (`@babel/core` via shadcn/eslint-config-next); root overrides added for `protobufjs`, `dompurify`, `js-yaml` |
| Toolchain (`@helvety/dev-deps`)           | current           | eslint **10.5.0**, vitest **4.1.9**, tailwind **4.3.1**, lucide **^1.20.0**                                                       |

Re-run `bun run deps:security` and `bun run deps:drift` after bumps. Supabase RLS posture and remaining dashboard-only follow-ups above stay valid until re-audited.

## Subsequent updates (2026-06-20)

| Item                                                        | As of 2026-06-17                 | As of 2026-06-20                                                                                                                                                              |
| ----------------------------------------------------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Preview Upstash on `helvety-pdf` / `helvety-image-upscaler` | open follow-up                   | **Resolved** — `bun run consistency:vercel-preview-env` passes ([`env-vercel-audit-checklist.md`](./env-vercel-audit-checklist.md))                                           |
| `bun audit`                                                 | 1 low (`@babel/core` transitive) | **0 vulnerabilities** — root overrides `undici@7.28.0`, `@babel/core@8.0.1` ([`dependency-inventory.md`](./dependency-inventory.md))                                          |
| `deps:security:floors` in `ci:check`                        | not yet wired                    | **In `ci:check`** (before `deps:drift`)                                                                                                                                       |
| Playwright gateway smoke                                    | manual `test:e2e` + dev server   | **`bun run ci:check:e2e`** — installs Chromium, starts all zones via `scripts/run-e2e-smoke.mjs` when `HELVETY_SMOKE_BASE_URL` is unset (optional; not in default `ci:check`) |

## Subsequent updates (2026-06-21)

Auth, sessions, token TTL, and E2EE cross-repo audit (see [`security-review-runbook.md`](./security-review-runbook.md) MCP baseline):

| Item | Result |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Extension weekly re-auth | **Server-HMAC `weekly_proof`** (parity with web `helvety_device_trust`); Bearer routes verify via `authenticateBearerRequest` |
| Retired client OTP anchor | Removed `helvety_extension_last_email_verified` / JWT-`iat`-only cap |
| Supabase MCP (`get_advisors` security) | RLS forced on all 9 user-data tables; **WARN** leaked-password protection _(not applicable as of 2026-07-04)_ |
| Session policy docs | Canonical: **JWT 3600s + time-box 7d + inactivity 24h** (`auth-session-policy.ts`) |
| `deps:security` / `deps:drift` | **0 CVEs**; no `@supabase/*` or `@simplewebauthn/*` bumps required at audit time |
| CI guardrails | Monorepo `consistency:extension-auth`, `consistency:extension-e2ee`, `consistency:e2ee-catalogs`; extension `ci:check` runs `check-extension-auth-consistency.mjs` and `check-extension-e2ee-consistency.mjs` |
| `clean:artifacts` during `test:coverage` | could delete active Vitest `coverage/.tmp` | **Fixed** — skips `coverage/` dirs with active `.tmp` or when `HELVEY_SKIP_COVERAGE_CLEAN=1` |

**Post-deploy verification (after auth + extension ship):** Supabase MCP `get_logs` (auth API errors), Vercel MCP runtime logs on `helvety-auth`, spot-check extension OTP verify returns `weekly_proof`, passkey routes reject missing `X-Helvety-Weekly-Proof`.

## Subsequent updates (2026-06-22)

Full dependency sweep (canonical pins: [`dependency-inventory.md`](./dependency-inventory.md); drift map in `scripts/check-workspace-version-drift.mjs`):

| Item                                                  | As of 2026-06-21                                | As of 2026-06-22                                                                                                                                                          |
| ----------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onnxruntime-web`                                     | **^1.26.0**                                     | **^1.27.0** — re-run `node scripts/copy-ort-runtime.mjs`; worker wiring tests guard `wasmPaths`                                                                           |
| Toolchain (`@helvety/dev-deps` + drift)               | lucide **^1.20.0**, TipTap **^3.27.0**          | lucide **^1.21.0**, `@tiptap/pm` / `@tiptap/react` **^3.27.1**, knip **6.18.0**, eslint import-x **4.17.0**, eslint-plugin-jsdoc **63.0.7**, typescript-eslint **8.62.0** |
| Extension repo (`helvety-browser-extension-chromium`) | lucide **^1.20.0**, `@types/chrome` **^0.1.43** | lucide **^1.21.0**, `@types/chrome` **^0.2.0**, tailwindcss **^4.3.1** (via `pnpm.overrides`)                                                                             |
| `bun audit` / `deps:security:floors`                  | **0 CVEs**                                      | **0 CVEs** at sweep time                                                                                                                                                  |
| Doc/inventory guardrails                              | drift + inventory table                         | **`dependency-inventory-pins.test.ts`**, ORT copy/wiring tests                                                                                                            |

Re-run `bun run deps:drift`, `bun run deps:security`, and `bun run ci:check` after bumps. Historical tables above remain audit snapshots; use **dependency-inventory.md** for current pins.

## Subsequent update (2026-07-04)

Treat Supabase MCP `auth_leaked_password_protection` as **not applicable** for Helvety. The product has no password-based sign-in (email OTP + passkeys only), and the setting is Pro-tier only while the hosted project is on Supabase Free. Future audits should not file leaked password protection as a finding unless the auth model or Supabase tier changes; see [`security-review-runbook.md`](./security-review-runbook.md).

### Dependency sweep (2026-07-04)

Full dependency sweep across monorepo + extension repos (canonical pins: [`dependency-inventory.md`](./dependency-inventory.md); expanded drift map in `scripts/check-workspace-version-drift.mjs`):

| Item                                                  | As of 2026-06-22                               | As of 2026-07-04                                                                                                    |
| ----------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `onnxruntime-web`                                     | **^1.27.0**                                    | **^1.27.0** (unchanged; upstream latest)                                                                            |
| `@supabase/supabase-js`                               | **^2.108.2**                                   | **^2.110.0** — drift + security floor + root override; extension `pnpm.overrides` aligned                           |
| Next.js                                               | **^16.2.9**                                    | **^16.2.10** — all 10 apps + `eslint-config-next`                                                                   |
| Toolchain (`@helvety/dev-deps` + drift)               | lucide **^1.21.0**, tailwind **^4.3.1**        | lucide **^1.23.0**, tailwind **^4.3.2**, prettier **^3.9.4**, shadcn **^4.13.0**, knip **6.24.0**, turbo **2.10.3** |
| Extension repo (`helvety-browser-extension-chromium`) | lucide **^1.21.0**, `@types/chrome` **^0.2.0** | lucide **^1.23.0**, `@types/chrome` **^0.2.2**, tailwindcss **^4.3.2**, vite **^8.1.3**, pnpm **9.15.9**            |
| Drift enforcement                                     | partial `@tiptap/*`                            | **+ `@dnd-kit/*`, full `@tiptap/*`, `@base-ui/react`** in `REQUIRED_VERSION_BY_DEP`                                 |
| `bun audit` / `deps:security:floors`                  | **0 CVEs**                                     | **0 CVEs** at sweep time                                                                                            |

Re-run `bun run deps:drift`, `bun run deps:security`, and `bun run ci:check` after bumps.

## Full auth / E2EE / vulnerability audit (2026-07-04)

**Scope:** Both repos (`helvety` monorepo + `helvety-browser-extension-chromium`), all zone apps, live Supabase + Vercel infrastructure, automated guardrails, targeted code review, production spot-checks.

**Verdict:** **No Critical or High findings.** E2EE model matches documented zero-knowledge-oriented design for user-written content (structural metadata plaintext by design; see Privacy §2 and §10.2). Defense-in-depth (RLS, JWT, CSRF, rate limits, device trust / weekly proof, passkey PRF) intact. **0 CVEs** after dependency bumps in working tree.

### Automated checks (this pass)

| Check                                            | Result                                                                                                  |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| `bun run ci:check` (monorepo)                    | **OK**                                                                                                  |
| `bun run deps:security` (`floors` + `bun audit`) | **OK** (0 vulnerabilities)                                                                              |
| `bun run consistency:vercel-prod-env`            | **OK** (10 zone projects)                                                                               |
| `bun run consistency:vercel-preview-env`         | **OK**                                                                                                  |
| `bun run consistency:supabase-rls`               | **OK** (9 user-data tables)                                                                             |
| `bun run consistency:local-env`                  | **FAIL** — `apps/web/.env.local` missing `IMAGE_EDITOR_URL` (local dev only; production gateway env OK) |
| `pnpm run ci:check` (extension)                  | **OK** (all pass + `consistency:extension-auth` + `consistency:extension-e2ee`)                         |

### Live Supabase MCP (`helvety`, `bkdzeihxzvrkndjvyzye`, eu-central-2, Postgres **17.6.1**, `ACTIVE_HEALTHY`)

| Check                            | Result                                                                                                |
| -------------------------------- | ----------------------------------------------------------------------------------------------------- |
| User-data tables (9)             | RLS **enabled + forced** on all                                                                       |
| `anon` grants on vault tables    | **None** (authenticated only)                                                                         |
| `user_auth_credentials` policies | **Deny all access** (`using_expr = false`)                                                            |
| `user_passkey_params` policies   | Owner-scoped (`auth.uid() = user_id`)                                                                 |
| Edge functions                   | **None**                                                                                              |
| Storage buckets                  | `packages` **private**; `image-upscaler-models` **public** (ONNX weights, by design)                  |
| `SECURITY DEFINER` in `public`   | 6 functions (auth cleanup, entity-link validation, email lookup) — expected system flows              |
| Security advisor                 | **WARN:** `auth_leaked_password_protection` — **not applicable** (no password sign-in; Supabase Free) |

### Live Vercel (team Helvety)

| Check                | Result                                                                                                         |
| -------------------- | -------------------------------------------------------------------------------------------------------------- |
| Zone projects        | **10** Helvety apps present (+ unrelated `casparrubin-ch`)                                                     |
| Production env audit | **OK** — publishable keys only on client tiers; `DEVICE_TRUST_COOKIE_SECRET` parity across auth + 4 E2EE zones |
| Preview env audit    | **OK**                                                                                                         |
| `helvety-auth`       | `HELVETY_CHROME_EXTENSION_ORIGINS`, Upstash, `SUPABASE_SECRET_KEY` present                                     |

### E2EE encryption format (resolved July 2026)

All entity ciphertext uses field-bound AAD (`table:recordId:column`, `ENCRYPTION_VERSION = 2`) via `encryptEntityField` / `decryptEntityField`. Legacy record-level format data was cleared from the database; read/write paths accept only the current wire format.

### Code review highlights (no regressions)

- **Crypto:** AES-256-GCM field-bound AAD via `encryptEntityField` in all vault apps (`ENCRYPTION_VERSION = 2` wire format only; legacy record-level ciphertext was cleared); PRF → HKDF with info label `helvety-e2ee-v1` (HKDF domain separation, not ciphertext wire version); KCV wrong-key detection; master key in IndexedDB with 24h idle / 7d max vault policy.
- **Auth:** `getUser()`-first in server guards and extension session (`extension-session.ts` uses `getSession()` only after JWT validation). Extension passkey verify omits PRF from JSON body.
- **Admin client:** `createAdminClient()` limited to approved call sites (OTP send, passkey lookup, user lookup, store package downloads); user-owned mutations use scoped client or RLS-scoped user client.
- **Public tools:** PDF, image-upscaler, image-editor, and OCR — no user file upload to Supabase in normal flow (client-local processing only).
- **Store:** `isAllowedDownloadUrl` rejects traversal and non-Supabase origins; tests pass.

### Production spot-checks (curl)

| Endpoint                                                         | Expected | Observed                       |
| ---------------------------------------------------------------- | -------- | ------------------------------ |
| `POST /auth/api/extension/passkey/verify` (no Bearer)            | 401 JSON | **401** `Not authenticated`    |
| `POST /auth/api/extension/passkey/options` (no Bearer)           | 401 JSON | **401** `Not authenticated`    |
| `POST /auth/api/extension/otp/send` (no origin)                  | 400 JSON | **400** `Invalid request body` |
| `GET /store/api/packages/INVALID_ID/download`                    | 400      | **400**                        |
| `GET /store/api/packages/spfx%2F..%2F..%2Fetc%2Fpasswd/download` | 400      | **400**                        |
| `GET /tasks`, `/auth/login`, `/pdf`, `/image-editor`, `/ocr`     | 200      | **200**                        |

### Findings by severity

| Severity     | Finding                                                                       | Action                                                                                                              |
| ------------ | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **Critical** | —                                                                             | None                                                                                                                |
| **High**     | —                                                                             | None                                                                                                                |
| **Medium**   | Supabase Free: hosted session time-box / inactivity settings not configurable | App-layer vault + device trust compensate; align Dashboard on Pro upgrade                                           |
| **Medium**   | Structural metadata (category/stage/folder ids) stored plaintext              | By design — privacy policy aligned                                                                                  |
| **Low**      | `apps/web/.env.local` missing `IMAGE_EDITOR_URL`                              | Add from [`apps/web/env.template`](apps/web/env.template) for local gateway rewrites                                |
| **Low**      | `helvety-com` Node.js Project Setting may still show 22.x (June snapshot)     | **Repo resolved:** all apps `engines.node: "24.x"`. Ops-only: set Vercel `helvety-com` to 24.x if UI still shows 22 |
| **Low**      | Vercel Analytics / Speed Insights                                             | Confirm disabled on all **eleven** zone projects (manual Dashboard; CSP blocks `va.vercel-scripts.com`)             |
| **N/A**      | `auth_leaked_password_protection` advisor WARN                                | No password auth; Free tier                                                                                         |

### Customer-facing copy audit (same pass)

Automated copy guardrails and targeted legal/SEO/store tests were re-run; **no false or misleading customer-facing claims found.**

| Check                                                                                      | Result                                                                                      |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| `consistency:customer-copy` (no em-dashes)                                                 | **OK**                                                                                      |
| `consistency:install-manifest-metadata`                                                    | **OK**                                                                                      |
| `consistency:license`                                                                      | **OK**                                                                                      |
| Legal E2EE product tests (`legal-e2ee-products`, `legal-public-tools`, cookies disclosure) | **OK** (39+ tests)                                                                          |
| Store catalog + product copy guardrails                                                    | **OK**                                                                                      |
| SEO / PWA manifest license-free copy                                                       | **OK**                                                                                      |
| Extension `copy-accuracy` + `security-e2ee-docs` tests                                     | **OK**                                                                                      |
| `auth-extension-copy-guardrails` (maintainer + llms.txt stale-auth scan)                   | **OK** (all zone `llms.txt` paths via `CUSTOMER_COPY_LLMS_RELATIVE_PATHS`, including `ocr`) |

**Accurate qualifiers in place:** Privacy and Terms use **zero-knowledge-oriented** (not absolute zero-knowledge); E2EE apps disclose plaintext structural metadata and cross-app linking; public tools state client-local processing; Store browser-extension copy states open beta, manual GitHub install, and passkey unlock; navbar tooltips match encryption reality.

**Not outdated:** `lastReviewed="June 19, 2026"` on privacy/terms/impressum remains correct (no legal body changes this pass). Historical security-audit tables that say "9 zone projects" are **June 2026 snapshots**; **current count is eleven** (see [Subsequent updates (2026-07-11)](#subsequent-updates-2026-07-11) and [`env-vercel-audit-checklist.md`](./env-vercel-audit-checklist.md)).

### Critical/High fixes applied

**None required** for security vulnerabilities. **Copy guardrail coverage:** all zone `public/llms.txt` files (including `apps/ocr/public/llms.txt`) are scanned via `CUSTOMER_COPY_LLMS_RELATIVE_PATHS` in `auth-extension-copy-guardrails`.

### Residual manual follow-ups (quarterly)

1. Interactive smoke: web sign-in → passkey unlock → mutate E2EE entity → logout clears IndexedDB key (requires user passkey).
2. Interactive smoke: extension OTP → weekly proof → passkey unlock → PostgREST write (verify ciphertext in Network tab).
3. Confirm Vercel Web Analytics disabled on all eleven zone projects.
4. On Supabase Pro upgrade: set JWT **3600s**, time-box **7d**, inactivity **24h** per [`auth-session-policy.ts`](../packages/shared/src/auth-session-policy.ts).
5. After any new extension build id: verify id in `HELVETY_CHROME_EXTENSION_ORIGINS` on `helvety-auth`.

### Verification commands (re-run)

```text
bun run ci:check
bun run deps:security
bun run consistency:vercel-prod-env
bun run consistency:vercel-preview-env
bun run consistency:supabase-rls
cd ../helvety-browser-extension-chromium && pnpm run ci:check
```

## Full auth / E2EE / session re-audit (2026-07-04, plan execution)

> **Zone-count snapshot:** This pass predates `helvety-ocr`; tables below that say **10** zone projects are accurate for July 2026. **Current** count is **eleven** — see [Subsequent updates (2026-07-11)](#subsequent-updates-2026-07-11).

**Scope:** Both repos (`helvety` monorepo + `helvety-browser-extension-chromium`), automated guardrails, production curl spot-checks, targeted auth/E2EE/session code review. Live Supabase MCP not used (no local `supabase/supabase.json` export).

**Verdict:** **No Critical or High findings.** Defense-in-depth intact; no regressions vs the earlier 2026-07-04 pass in this document.

### Automated checks (this pass)

| Check                                            | Result                                                                                                                                                                     |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bun run ci:check` (monorepo)                    | **OK** (~2m53s; includes `consistency:supabase-auth`, `consistency:e2ee-aad`, `consistency:auth-action-guards`, `consistency:extension-auth`, `consistency:customer-copy`) |
| `bun run deps:security` (`floors` + `bun audit`) | **OK** (0 vulnerabilities)                                                                                                                                                 |
| `bun run consistency:vercel-prod-env`            | **OK** (10 zone projects)                                                                                                                                                  |
| `bun run consistency:vercel-preview-env`         | **OK**                                                                                                                                                                     |
| `bun run consistency:supabase-rls`               | **SKIPPED** — no local `supabase/supabase.json` (generate via `supabase/getSupabase.sql` to verify RLS locally)                                                            |
| `bun run consistency:local-env`                  | **OK** (10 missing `.env.local` warnings — expected when zones are not run locally)                                                                                        |
| `pnpm run ci:check` (extension)                  | **OK** (all pass + `consistency:extension-auth`)                                                                                                                           |

### Production spot-checks (curl against helvety.com)

| Endpoint                                                             | Expected         | Observed                                           |
| -------------------------------------------------------------------- | ---------------- | -------------------------------------------------- |
| `POST /auth/api/extension/passkey/verify` (no Bearer)                | 401 JSON         | **401** `Not authenticated`                        |
| `POST /auth/api/extension/passkey/options` (no Bearer)               | 401 JSON         | **401** `Not authenticated`                        |
| `POST /auth/api/extension/passkey/options` (Bearer, no weekly proof) | 401 weekly proof | **401** `Weekly email verification expired…`       |
| `POST /auth/api/extension/otp/send` (no origin)                      | 400 JSON         | **400** `Invalid request body`                     |
| `GET /store/api/packages/spfx%2F..%2F..%2Fetc%2Fpasswd/download`     | 400              | **400** `Invalid package ID`                       |
| `GET /tasks/api/items` (unauthenticated)                             | Auth error JSON  | **200** body `AUTH_REQUIRED:Auth session missing!` |
| `GET /auth/login`, `GET /tasks`                                      | 200              | **200**                                            |

### Code review highlights (no regressions)

**Auth & sessions**

- E2EE zone pages use `requireE2eeAppPageAuth` with `requireDeviceTrust: true` (`apps/{tasks,contacts,notes,links}/app/page.tsx`).
- Server actions use `authenticateAndRateLimit`; E2EE prefixes default `requireDeviceTrust` (`packages/shared/src/action-helpers.ts`).
- Monorepo authorization uses `getUser()` only; `getSession()` appears only in extension code **after** JWT validation (`extension-session.ts`) and in proxy comments — not for server authz.
- `createAdminClient()` call sites match approved list in `packages/shared/src/supabase/admin.ts` (auth OTP/passkey, user lookup, store downloads). Vault zones do not import admin client (`zone-admin-client-wiring.test.ts`).
- Extension Bearer routes: `authenticateBearerRequest` requires JWT + `X-Helvety-Weekly-Proof` HMAC (`extension-bearer-auth.ts`; production curl confirms weekly-proof gate).
- Logout: CSRF enforced, optional global revoke, device-trust cookie cleared (`logout-actions.ts`).

**E2EE & crypto**

- All vault app encryption modules use `encryptEntityField` / field-bound AAD (enforced by `consistency:e2ee-aad`).
- Extension writes use `encryptEntityField` (`encrypt-entities.ts`); `assertEncryptedWritePayloadAuto` from `@helvety/shared/e2ee-write-guard` blocks plaintext column names (`entity-repository.test.ts`, shared `e2ee-entity-columns` / `e2ee-write-guard` tests).
- Passkey unlock strips `clientExtensionResults` from verify JSON body; PRF derived locally (`passkey-unlock.ts`; `passkey-unlock.test.ts`).
- KCV wrong-key detection before writes; vault idle/max policy via `vault-session.ts`, `key-storage.ts`, `useVaultIdleLock`.
- Prefetch API routes use explicit ciphertext columns + `authenticateAndRateLimit` with E2EE device-trust default (`apps/*/app/api/**/route.ts`).

**Extension session wipe**

- **Vault lock:** `deleteMasterKey` + `clearAllKeys` in `use-extension-vault.ts`; `clearDecryptedEntityState` + form wipe in `use-extension-entities.ts` / `use-extension-entity-form.ts` (wired from `App.tsx` `onLocked`); PRF salt cache kept for faster re-unlock.
- **Sign-out / `user_id` change:** `clearAllKeys` + `clearCachedPRFSalt` + weekly proof clear in `use-extension-auth.ts` / `use-extension-vault.ts`; decrypted list/form state via `clearDecryptedEntityState` in `use-extension-entities.ts`.

### Interactive smoke (manual)

**Not executed in this pass** — requires a real Helvety account, email OTP inbox, and WebAuthn passkey on operator hardware.

**Automated coverage used as substitute:**

| Scenario                                               | Automated coverage                                                                                                                    |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| Extension session bootstrap (`getUser` + weekly proof) | `extension-session.test.ts`                                                                                                           |
| Bearer weekly-proof gate                               | `extension-bearer-auth.test.ts` + production curl                                                                                     |
| PRF omitted from verify body                           | `passkey-unlock.test.ts`, `helvety-auth-api.test.ts`                                                                                  |
| Plaintext column guardrails                            | Shared `e2ee-entity-columns.test.ts`, `e2ee-write-guard.test.ts`, `e2ee-entity-crypto.test.ts`, extension `entity-repository.test.ts` |
| Logout CSRF + device trust clear                       | `logout-actions.test.ts`                                                                                                              |
| E2EE page device trust                                 | `auth-guard.test.ts`, `e2ee-page-auth.test.ts`                                                                                        |

**Quarterly manual checklist** (unchanged): web sign-in → passkey unlock → mutate → logout; extension OTP → weekly proof → passkey → PostgREST write; confirm Vercel Analytics disabled on all **eleven** zone projects.

### Findings by severity

| Severity     | Finding                                                                           | Action                                                                                  |
| ------------ | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| **Critical** | —                                                                                 | None                                                                                    |
| **High**     | —                                                                                 | None                                                                                    |
| **Medium**   | Supabase Free: hosted session time-box / inactivity not configurable in Dashboard | App-layer vault + device trust compensate; align on Pro upgrade                         |
| **Medium**   | Structural metadata plaintext                                                     | By design                                                                               |
| **Low**      | `consistency:supabase-rls` skipped (no local export)                              | Regenerate `supabase/supabase.json` locally after schema changes                        |
| **Low**      | No local `.env.local` files (10 zones at July 2026 pass; **11** today)            | Copy from `env.template` only if developing zones locally                               |
| **Low**      | Interactive passkey/OTP smoke not run                                             | Operator quarterly checklist above                                                      |
| **Low**      | `helvety-com` Node Project Setting may still show 22.x (June snapshot)            | **Repo resolved:** all apps `engines.node: "24.x"`. Ops-only: confirm Vercel UI is 24.x |
| **Low**      | Vercel Analytics / Speed Insights                                                 | Confirm disabled on all **eleven** zone projects (manual Dashboard)                     |
| **N/A**      | `auth_leaked_password_protection` advisor WARN                                    | No password auth; Free tier                                                             |

### Deltas vs earlier 2026-07-04 pass (same document)

| Item                    | Earlier pass | This pass                                                                   |
| ----------------------- | ------------ | --------------------------------------------------------------------------- |
| `ci:check`              | OK           | **OK** (re-confirmed)                                                       |
| `deps:security`         | 0 CVEs       | **0 CVEs**                                                                  |
| Vercel prod/preview env | OK           | **OK**                                                                      |
| Extension `ci:check`    | All pass     | **All pass** (re-confirmed; see current extension repo `pnpm run ci:check`) |
| Live Supabase MCP       | Used         | **Not used** (RLS check skipped locally)                                    |
| Production curl         | OK           | **OK** (weekly-proof gate re-verified)                                      |
| Critical/High findings  | None         | **None**                                                                    |

### Customer-facing copy guardrails (Phase 5)

| Check                                                          | Result                                                 |
| -------------------------------------------------------------- | ------------------------------------------------------ |
| `consistency:customer-copy` (no em-dashes in user-facing copy) | **OK** (re-run this pass)                              |
| Extension `tests/security-e2ee-docs.test.ts`                   | **OK** (see extension `ci:check`)                      |
| Extension `tests/copy-accuracy.test.ts`                        | **OK**                                                 |
| `auth-extension-copy-guardrails` (in monorepo `ci:check`)      | **OK** (July pass; included in full `ci:check` re-run) |

No misleading E2EE or extension weekly-re-auth claims detected by automated guardrails.

### Stack / best-practices alignment (July 2026 re-audit pass)

Verified against [`docs/dependency-inventory.md`](./dependency-inventory.md) pins **at that time** and guardrails then in force — no drift, no auth-pattern regressions. Pins in this table are a snapshot; see [Subsequent updates (2026-07-11)](#subsequent-updates-2026-07-11) and **dependency-inventory.md** for current pins.

| Area                  | Pin / pattern                                                                                | Status                                                                |
| --------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| **Next.js**           | `^16.2.10`; `proxy.ts` edge (no `middleware.ts` in zone apps)                                | **Aligned** — session refresh at proxy; RSC/actions are auth boundary |
| **Supabase SSR**      | `@supabase/ssr` `^0.12.0`; `getClaims()` at proxy, `getUser()` for authz                     | **Aligned** — `consistency:supabase-auth` passed                      |
| **Supabase JS**       | `2.110.0` (floor + override)                                                                 | **Aligned** — `deps:drift` + `deps:security` passed                   |
| **React**             | `^19.2.7`; E2EE pages auth-gated in Server Components                                        | **Aligned**                                                           |
| **Vercel**            | `failClosedOnAuthRefresh` on auth gateway; prod/preview env audits                           | **Aligned**                                                           |
| **Session mutations** | `createServerMutatingClient` for OTP/callback/logout; read client no-ops after proxy refresh | **Aligned**                                                           |
| **E2EE**              | Field-bound AAD; PRF → HKDF; device trust + weekly proof HMAC                                | **Aligned**                                                           |

### Plan phase completeness

| Phase                  | Status       | Notes                                                                                                                       |
| ---------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------- |
| 1 Automated guardrails | **Complete** | Both repos; all auth/E2EE scripts re-confirmed                                                                              |
| 2 Live infra           | **Partial**  | Vercel + production curl OK; Supabase MCP/RLS export **not** re-run (no local `supabase.json`); Vercel Analytics **manual** |
| 3 Code review          | **Complete** | Auth, E2EE, extension surfaces reviewed                                                                                     |
| 4 Interactive smoke    | **Deferred** | Requires operator passkey/OTP; automated substitutes documented                                                             |
| 5 Findings report      | **Complete** | This section + tables above                                                                                                 |

**Nothing broken:** audit execution was read-only (doc append + verification commands). No application code or dependency changes were made during this pass.

## Subsequent updates (2026-07-07)

Patch/minor dependency sweep across monorepo + extension (canonical pins: [`dependency-inventory.md`](./dependency-inventory.md); drift map in `scripts/check-workspace-version-drift.mjs`). Core stack (Next `^16.2.10`, React `^19.2.7`, `@supabase/supabase-js` `2.110.0`, `onnxruntime-web` `^1.27.0`, `react-pdf` `^10.4.1`) already at latest stable and left unchanged.

| Item                                    | As of 2026-07-04     | As of 2026-07-07                                                                                                           |
| --------------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Toolchain (`@helvety/dev-deps` + drift) | vitest **^4.1.9**    | vitest / `@vitest/coverage-v8` **^4.1.10**, `fake-indexeddb` **^6.2.5** (now drift-managed)                                |
| `@tiptap/*` (`packages/ui` + drift)     | **^3.27.1**          | **^3.27.2** (all six packages)                                                                                             |
| `@helvety/config` lint tooling          | ts-eslint **8.62.0** | typescript-eslint **^8.63.0**, eslint-plugin-import-x **^4.17.1**, eslint-plugin-jsdoc **^63.0.12**                        |
| `konva` (`apps/image-editor`)           | **^10.2.0**          | **^10.3.0** (`react-konva` **^19.2.5** unchanged)                                                                          |
| `turbo` (root)                          | **2.10.3**           | **^2.10.4**                                                                                                                |
| Root security overrides                 | —                    | `hono` **4.12.28**, `brace-expansion` **5.0.7** (patch); major jumps deferred (`protobufjs`/`js-yaml`/`undici`/`ajv`/etc.) |
| Extension repo                          | vitest **^4.1.9**    | vitest **^4.1.10** (mirrors drift map; other pins unchanged, pnpm **9.15.9**)                                              |
| `bun audit` / `deps:security:floors`    | **0 CVEs**           | **0 CVEs** at sweep time                                                                                                   |

Verification: `bun run deps:drift`, `bun run deps:security`, `bun run consistency:pdfjs-worker`, `bun run deps:unused`, `bun run ci:check` (monorepo) and `pnpm run ci:check` (extension) all pass. `@types/node` deliberately held at `24.13.2` (matches `engines.node: 24.x`). Historical tables above remain audit snapshots; use **dependency-inventory.md** for current pins.

## Subsequent updates (2026-07-11)

Patch/minor dependency sweep across monorepo + extension (canonical pins: [`dependency-inventory.md`](./dependency-inventory.md); drift map in `scripts/workspace-version-drift.config.json`). Core stack (Next `^16.2.10`, React `^19.2.7`, `onnxruntime-web` `^1.27.0`, `react-pdf` `^10.4.1`) already at latest stable.

| Item                                       | As of 2026-07-07                                              | As of 2026-07-11                                                                |
| ------------------------------------------ | ------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `@supabase/supabase-js` (override + floor) | `2.110.0`                                                     | `2.110.2`                                                                       |
| `lucide-react` (drift + zone apps)         | `^1.23.0`                                                     | `^1.24.0`                                                                       |
| `@tiptap/*` (`packages/ui` + drift)        | `^3.27.2`                                                     | `^3.27.3`                                                                       |
| Toolchain (`@helvety/dev-deps` + drift)    | eslint `^10.6.0`, prettier `^3.9.4`, `@types/node` `^24.13.2` | eslint `^10.7.0`, prettier `^3.9.5`, `@types/node` `^24.13.3`, `knip` `^6.26.0` |
| Root security overrides                    | `hono` `4.12.28`, `vite` `8.1.3`                              | `hono` `4.12.29`, `vite` `8.1.4`                                                |
| `konva` (`apps/image-editor`)              | `^10.3.0`                                                     | `^10.3.0` (unchanged)                                                           |
| `vitest` (`@helvety/dev-deps`)             | `^4.1.10`                                                     | `^4.1.10` (unchanged)                                                           |
| Extension repo                             | vite `^8.1.3`, supabase `2.110.0`                             | vite `^8.1.4`, supabase `2.110.2`, mirrors drift map                            |

Verification: `bun run deps:drift`, `bun run deps:security`, `bun run consistency:pdfjs-worker`, `bun run ci:check` (monorepo) and `pnpm run ci:check` + `pnpm run build` (extension) all pass. Removed orphan `packages/light-pillar/` artifacts; drift script skips workspace dirs without `package.json`. TypeScript 7 and `@types/node` 26 deferred.

### Helvety OCR zone launch (same date)

New public-tool zone **`helvety-ocr`** (`apps/ocr`):

| Area                | Change                                                                                                                       |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Vercel / gateway    | Eleventh zone project; gateway rewrite `/ocr` + `OCR_URL`; Playwright gateway smoke covers `/ocr`                            |
| Env tiers           | Public-tool + rate limit (Upstash + `HELVETY_COOKIE_SIGNING_SECRET`); `wasm-unsafe-eval` CSP for Tesseract WASM              |
| Store / SEO / legal | Catalog product `helvety-ocr`; `OCR_*` in `app-product-descriptions`; Privacy/Terms/Impressum public-tools list includes OCR |
| Customer copy       | Zone `public/llms.txt`, PWA `manifest.json`, README UI contract; `consistency:customer-copy` + `seo-customer-copy` guards    |
| Extended assets     | `tesseract.js` + local `tessdata` (eng/deu); PDF.js worker via `react-pdf` (`sync:pdf-worker`, `consistency:pdfjs-worker`)   |

Re-run `bun run consistency:vercel-prod-env` and `consistency:vercel-preview-env` after provisioning `helvety-ocr` on Vercel. Confirm Web Analytics disabled on the new project (eleven zone projects total).

## Subsequent updates (2026-07-14) — cross-repo UX/security remediation

Minimal remediations from the cross-repo UI/UX & auth/privacy/security audit (no new CI, tools, or env vars).

### Code

| ID  | Change                                                                                                                                                                                                                                                                                                                               |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| S1  | Extension `host_permissions` narrowed to `https://bkdzeihxzvrkndjvyzye.supabase.co/*` (matches hardcoded `HELVETY_SUPABASE_URL`); docs/error copy + manifest test updated                                                                                                                                                            |
| U1  | Extension side panel, Links (`link-form-fields`, `folder-editor`), Contacts (`contact-editor`), and Tasks `item-action-panel` date fields use shared `@helvety/ui/form-field` (removed local `LinksFormField` / inline `E2EE_FORM_FIELD_CLASS` wrappers); `DatePicker` / `DateTimePicker` accept optional `id` for label association |
| U2  | `processing-shine` CSS moved once into `packages/ui/globals.css`; removed from `apps/ocr`, `image-upscaler`, `image-editor`                                                                                                                                                                                                          |

### Ops verify-only (repo SSOT; no new secrets)

| Check                                                     | Result                                                                                                                                                                                                                                                                                                             |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **S2** Supabase Auth sessions vs `auth-session-policy.ts` | Policy SSOT unchanged: JWT **3600s**, time-box **7d**, inactivity **24h**. Hosted Dashboard session controls remain Pro-only on Free — app-layer vault + device trust / weekly proof continue to enforce the policy. No Dashboard change in this pass.                                                             |
| **S3** Vercel Web Analytics / Speed Insights              | Still forbidden in code (`analytics-guardrails` + CSP blocks `va.vercel-scripts.com`). No analytics packages or env keys added. Confirm each of the **eleven** zone projects still has Analytics/Speed Insights **disabled** in the Vercel UI when next in the Dashboard (CLI auth not available in this session). |
| **U5** Gateway Node 24                                    | All eleven apps + root declare `engines.node: "24.x"`; `.nvmrc` is `24`. If `helvety-com` Project Settings still show Node **22.x**, set to **24.x** there (existing setting only — no new env).                                                                                                                   |

**Out of scope (confirmed):** GitHub Actions, Playwright/axe, extension token palette rewrite, new env vars.
