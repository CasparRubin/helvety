# Hosting, database & dependency security audit

> **Point-in-time snapshot (2026-06-13).** Findings below reflect that audit date. For **current** dependency pins and extended assets, use [`dependency-inventory.md`](./dependency-inventory.md). See [Subsequent updates](#subsequent-updates-2026-06-17) for material changes after this audit.

**Date:** 2026-06-13  
**Scope:** Supabase MCP, Vercel MCP/CLI, local guardrails, full dependency sweep (npm + extended assets)

## Summary

Live audit confirms a **strong security posture**: all 10 user-data tables have forced RLS with owner-scoped policies, Vercel Production env tiers pass automated checks, and `bun audit` reports zero CVEs. Applied dependency updates: `@eigenpal/docx-editor-react` 1.4.0, `hono` 4.12.25, `rollup` 4.62.0. Regenerated Supabase TypeScript types via MCP and refreshed local RLS export metadata. **Manual follow-ups remain** for Supabase Auth dashboard settings, Vercel Preview Upstash keys on two tool zones, and confirming Analytics is disabled on all projects.

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

| Check          | Result                                                                                                              |
| -------------- | ------------------------------------------------------------------------------------------------------------------- |
| Projects       | All 10 present; latest Production deploys **READY**                                                                 |
| Production env | `bun run consistency:vercel-prod-env` **passed**                                                                    |
| Preview env    | `bun run consistency:vercel-preview-env` **failed** — missing Upstash on `helvety-pdf` and `helvety-image-upscaler` |
| Node version   | `helvety-com` on 22.x; zone apps on 24.x — align when convenient                                                    |

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
2. Add Preview Upstash env vars on `helvety-pdf` and `helvety-image-upscaler` — verify with `bun run consistency:vercel-preview-env`.
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

Re-run `bun run deps:security` and `bun run deps:drift` after bumps. Supabase RLS posture and Vercel manual follow-ups above remain valid until re-audited.
