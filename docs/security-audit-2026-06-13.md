# Hosting, database & dependency security audit

> **Point-in-time snapshot (2026-06-13).** Findings below reflect that audit date. For **current** dependency pins and extended assets, use [`dependency-inventory.md`](./dependency-inventory.md). See [Subsequent updates](#subsequent-updates-2026-06-17) for material changes after this audit.

**Date:** 2026-06-13  
**Scope:** Supabase MCP, Vercel MCP/CLI, local guardrails, full dependency sweep (npm + extended assets)

## Summary

Live audit confirms a **strong security posture**: all 10 user-data tables have forced RLS with owner-scoped policies, Vercel Production env tiers pass automated checks, and `bun audit` reports zero CVEs. Applied dependency updates: `@eigenpal/docx-editor-react` 1.4.0, `hono` 4.12.25, `rollup` 4.62.0. Regenerated Supabase TypeScript types via MCP and refreshed local RLS export metadata. **As of the audit date**, manual follow-ups remained for Supabase Auth dashboard settings, Vercel Preview Upstash keys on two tool zones, and confirming Analytics is disabled on all projects — see [Subsequent updates](#subsequent-updates-2026-06-17) for what changed after this snapshot.

---

## Supabase (`helvety`, `eu-central-2`, Postgres 17.6.1)

| Check                          | Result                                                                                                                                                    |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Project health                 | `ACTIVE_HEALTHY`                                                                                                                                          |
| User-data tables (10)          | RLS **enabled + forced**                                                                                                                                  |
| Policies                       | `auth.uid()` owner scope; credentials table denies all direct access                                                                                      |
| `anon` grants on vault tables  | **None**                                                                                                                                                  |
| Public views                   | **None**                                                                                                                                                  |
| `SECURITY DEFINER` in `public` | Not executable by `anon` / `authenticated`                                                                                                                |
| Edge functions                 | **None**                                                                                                                                                  |
| Storage                        | `packages` private + deny-all; `image-upscaler-models` public by design (ONNX weights)                                                                    |
| Security advisor               | **WARN:** [Leaked password protection disabled](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) |
| Local RLS export               | `consistency:supabase-rls` **passed** (export metadata refreshed 2026-06-13)                                                                              |

### Manual dashboard actions

1. **Authentication → Email:** Enable leaked-password protection (defense-in-depth; app is OTP/passkey-first).
2. **Authentication → Providers:** Disable any unused OAuth/OIDC providers.
3. **Authentication → Sessions** (Pro): JWT 3600s, time-box 7d, inactivity 24h — align with `packages/shared/src/auth-session-policy.ts`.
4. **Project Settings → Infrastructure:** Note GoTrue version; ensure ≥ 2.185.0 if OIDC is enabled ([CVE-2026-31813](https://www.sentinelone.com/vulnerability-database/cve-2026-31813/)).

---

## Vercel (team Helvety, 10 zone projects)

| Check          | Result                                                                                                                                                                                                           |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Projects       | All 10 present; latest Production deploys **READY**                                                                                                                                                              |
| Production env | `bun run consistency:vercel-prod-env` **passed**                                                                                                                                                                 |
| Preview env    | `bun run consistency:vercel-preview-env` **failed** — missing Upstash on `helvety-pdf` and `helvety-image-upscaler` (remediated 2026-06; see [`env-vercel-audit-checklist.md`](./env-vercel-audit-checklist.md)) |
| Node version   | `helvety-com` on 22.x; zone apps on 24.x — align when convenient                                                                                                                                                 |

### Manual dashboard actions

1. Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to **Preview** env on `helvety-pdf` and `helvety-image-upscaler` (Production already has them on other tiers; these two zones are missing Preview Upstash).
2. Confirm **Web Analytics** and **Speed Insights** disabled on all ten projects.
3. After any `*_URL` gateway change, redeploy `helvety-com`.

---

## Npm / toolchain

| Package                                                   | Was     | Now                   | Action                  |
| --------------------------------------------------------- | ------- | --------------------- | ----------------------- |
| `@eigenpal/docx-editor-react`                             | ^1.3.3  | **1.4.0**             | Bumped; docs tests pass |
| `hono` (override)                                         | 4.12.23 | **4.12.25**           | Bumped                  |
| `rollup` (override)                                       | 4.61.1  | **4.62.0**            | Bumped                  |
| `next`, `react`, `@supabase/supabase-js`, `@supabase/ssr` | pinned  | latest stable         | No change needed        |
| Toolchain (`@helvety/dev-deps`)                           | current | latest within pins    | No change needed        |
| `bun audit`                                               | —       | **0 vulnerabilities** | —                       |

---

## Extended assets

| Asset                              | Current pin                                | Upstream latest | Recommendation                      |
| ---------------------------------- | ------------------------------------------ | --------------- | ----------------------------------- |
| `onnxruntime-web`                  | 1.26.0                                     | 1.26.0          | **Keep** — latest stable            |
| Real-ESRGAN ONNX (Supabase bucket) | SHA in `apps/image-upscaler/lib/models.ts` | unchanged       | **Keep** — no upstream model change |
| `pdfjs-dist`                       | 6.0.227                                    | 6.0.227         | **Keep** — latest stable            |
| `three` / `postprocessing`         | 0.184.0 / 6.39.1                           | same            | **Keep**                            |
| Eigenpal docx editor               | 1.4.0                                      | 1.4.0           | **Updated** this audit              |

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
| Enable leaked password protection | Requires Supabase Dashboard (no MCP API)                                                                                                                                      |

---

## Verification

```text
bun run consistency:supabase-rls          OK (10 tables)
bun run consistency:supabase-schema     OK
bun run consistency:vercel-prod-env       OK (all zones)
bun run consistency:vercel-preview-env    FAIL (pdf, image-upscaler missing Preview Upstash)
bun run deps:security                     OK (floors + audit)
bun run ci:check                          OK (lint, type-check, test)
```

Manual smoke recommended: sign-in/logout, passkey unlock on one E2EE zone, extension passkey curl from runbook, store package download URL validation.

---

## Follow-ups

1. Complete Supabase Auth dashboard items above (leaked password protection, session JWT/time-box alignment, disable unused OAuth).
2. ~~Add Preview Upstash env vars on `helvety-pdf` and `helvety-image-upscaler`~~ — **done** (2026-06); re-run `bun run consistency:vercel-preview-env` after any new zone.
3. Confirm Vercel Analytics disabled on all ten projects.
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
| `@eigenpal/docx-editor-react`             | 1.4.0             | **^1.6.2** (vendor uses semantic CSS variables; bridge Layer 3 `slate-*` remaps are defensive)                                    |
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

| Item                                     | Result                                                                                                                        |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Extension weekly re-auth                 | **Server-HMAC `weekly_proof`** (parity with web `helvety_device_trust`); Bearer routes verify via `authenticateBearerRequest` |
| Retired client OTP anchor                | Removed `helvety_extension_last_email_verified` / JWT-`iat`-only cap                                                          |
| Supabase MCP (`get_advisors` security)   | RLS forced on all 10 user-data tables; **WARN** leaked-password protection still disabled (Dashboard manual)                  |
| Session policy docs                      | Canonical: **JWT 3600s + time-box 7d + inactivity 24h** (`auth-session-policy.ts`)                                            |
| `deps:security` / `deps:drift`           | **0 CVEs**; no `@supabase/*` or `@simplewebauthn/*` bumps required at audit time                                              |
| CI guardrails                            | Monorepo `consistency:extension-auth`; extension `ci:check` includes auth consistency script                                  |
| `clean:artifacts` during `test:coverage` | could delete active Vitest `coverage/.tmp`                                                                                    | **Fixed** — skips `coverage/` dirs with active `.tmp` or when `HELVEY_SKIP_COVERAGE_CLEAN=1` |

**Post-deploy verification (after auth + extension ship):** Supabase MCP `get_logs` (auth API errors), Vercel MCP runtime logs on `helvety-auth`, spot-check extension OTP verify returns `weekly_proof`, passkey routes reject missing `X-Helvety-Weekly-Proof`.

## Subsequent updates (2026-06-22)

Full dependency sweep (canonical pins: [`dependency-inventory.md`](./dependency-inventory.md); drift map in `scripts/check-workspace-version-drift.mjs`):

| Item                                                  | As of 2026-06-21                                | As of 2026-06-22                                                                                                                                                          |
| ----------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@eigenpal/docx-editor-react`                         | **^1.6.2**                                      | **^1.9.0** (vendor CSS at `dist/styles.css`; theme bridge + vendor-version tests unchanged at bump time)                                                                  |
| `onnxruntime-web`                                     | **^1.26.0**                                     | **^1.27.0** — re-run `node scripts/copy-ort-runtime.mjs`; worker wiring tests guard `wasmPaths`                                                                           |
| Toolchain (`@helvety/dev-deps` + drift)               | lucide **^1.20.0**, TipTap **^3.27.0**          | lucide **^1.21.0**, `@tiptap/pm` / `@tiptap/react` **^3.27.1**, knip **6.18.0**, eslint import-x **4.17.0**, eslint-plugin-jsdoc **63.0.7**, typescript-eslint **8.62.0** |
| Extension repo (`helvety-browser-extension-chromium`) | lucide **^1.20.0**, `@types/chrome` **^0.1.43** | lucide **^1.21.0**, `@types/chrome` **^0.2.0**, tailwindcss **^4.3.1** (via `pnpm.overrides`)                                                                             |
| `bun audit` / `deps:security:floors`                  | **0 CVEs**                                      | **0 CVEs** at sweep time                                                                                                                                                  |
| Doc/inventory guardrails                              | drift + inventory table                         | **`dependency-inventory-pins.test.ts`**, docs **`docx-editor-vendor-version.test.ts`**, ORT copy/wiring tests                                                             |

Re-run `bun run deps:drift`, `bun run deps:security`, and `bun run ci:check` after bumps. Historical tables above remain audit snapshots; use **dependency-inventory.md** for current pins.
