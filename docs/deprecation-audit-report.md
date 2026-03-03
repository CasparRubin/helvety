# Deprecation Audit Report

Generated as part of the Full Deprecation & Legacy Audit Plan. This document is a historical baseline inventory and findings matrix captured on February 28, 2026.

## 1. Dependency Baseline (Framework-Critical)

| Package               | Version in Repo    | Latest Stable | Status     | Deprecation Notes                                             |
| --------------------- | ------------------ | ------------- | ---------- | ------------------------------------------------------------- |
| next                  | ^16.1.6            | 16.x          | Current    | middleware.ts deprecated in favor of proxy.ts                 |
| react                 | ^19.2.4            | 19.x          | Current    | React 19 removed legacy APIs (findDOMNode, string refs, etc.) |
| react-dom             | ^19.2.4            | 19.x          | Current    | —                                                             |
| @supabase/supabase-js | ^2.98.0            | 2.x           | Current    | —                                                             |
| @supabase/ssr         | ^0.8.0             | 0.x           | Pre-1.0    | Replaces deprecated auth-helpers packages                     |
| stripe                | ^20.4.0            | 20.x          | Current    | —                                                             |
| ajv                   | 6.14.0 (override)  | 8.x           | **Legacy** | v6 EOL Feb 2021; v8 recommended                               |
| minimatch             | 3.1.4 (override)   | 9.x           | **Legacy** | v3 old; transitive compatibility pin                          |
| rollup                | 4.59.0 (override)  | 4.x           | Pinned     | Compatibility                                                 |
| hono                  | 4.11.10 (override) | 4.x           | Pinned     | Compatibility                                                 |

### Root Overrides (package.json)

```json
"overrides": {
  "rollup": "4.59.0",
  "minimatch": "3.1.4",
  "ajv": "6.14.0",
  "hono": "4.11.10"
}
```

### Patched Dependencies

- `next@16.1.6` — custom patch at `patches/next@16.1.6.patch` (increases upgrade friction)

### Package Manager

- `bun@1.3.9` at audit time — keep updated; Bun releases frequently

## 2. Apps & Packages Inventory

| Workspace       | Next    | React    | Supabase                        | Stripe  | Testing            |
| --------------- | ------- | -------- | ------------------------------- | ------- | ------------------ |
| apps/web        | ^16.1.6 | ^19.2.4  | supabase-js ^2.98.0             | —       | vitest ^4, RTL ^16 |
| apps/auth       | ^16.1.6 | ^19.2.4  | supabase-js ^2.98.0             | —       | vitest ^4, RTL ^16 |
| apps/store      | ^16.1.6 | ^19.2.4  | supabase-js ^2.98.0             | ^20.4.0 | vitest ^4, RTL ^16 |
| apps/pdf        | ^16.1.6 | ^19.2.4  | supabase-js ^2.98.0             | —       | vitest ^4, RTL ^16 |
| apps/tasks      | ^16.1.6 | ^19.2.4  | supabase-js ^2.98.0             | —       | vitest ^4, RTL ^16 |
| apps/contacts   | ^16.1.6 | ^19.2.4  | supabase-js ^2.98.0             | —       | vitest ^4, RTL ^16 |
| packages/shared | —       | peer ^19 | supabase-js ^2.98.0, ssr ^0.8.0 | —       | vitest ^4          |
| packages/ui     | —       | peer ^19 | —                               | —       | —                  |
| packages/config | —       | —        | —                               | —       | —                  |
| packages/brand  | —       | peer ^19 | —                               | —       | —                  |

## 3. Code-Level Migration Checks

### Next.js

| Check                             | Result | Evidence                                      |
| --------------------------------- | ------ | --------------------------------------------- |
| middleware.ts                     | ✓ None | No middleware.ts files; all apps use proxy.ts |
| next/head                         | ✓ None | metadata/generateMetadata used                |
| next/router                       | ✓ None | next/navigation used                          |
| getServerSideProps/getStaticProps | ✓ None | App Router only                               |

### React

| Check                          | Result  | Evidence                                                 |
| ------------------------------ | ------- | -------------------------------------------------------- |
| findDOMNode                    | ✓ None  | No usage                                                 |
| string refs                    | ✓ None  | No usage                                                 |
| contextTypes/childContextTypes | ✓ None  | No usage                                                 |
| ReactDOM.render                | ✓ None  | Next.js handles mounting                                 |
| react-dom/test-utils           | ✓ None  | —                                                        |
| react-test-renderer/shallow    | ✓ None  | —                                                        |
| Class error boundary           | 1 usage | apps/pdf/.../pdf-page-error-boundary.tsx (valid pattern) |

### Supabase

| Check                     | Result   | Evidence                                                  |
| ------------------------- | -------- | --------------------------------------------------------- |
| @supabase/auth-helpers-\* | ✓ None   | Using @supabase/ssr                                       |
| createBrowserClient       | ✓ Used   | packages/shared/src/supabase/client.ts                    |
| createServerClient        | ✓ Used   | packages/shared/src/supabase/client-factory.ts, server.ts |
| RLS auth.jwt()            | ✓ Modern | claim-based policies; no deprecated helpers               |

## 4. Pattern Scan Results (Repo-Wide)

### Files Scanned

- All `*.ts`, `*.tsx`, `*.js`, `*.jsx` under `apps/`, `packages/`, `scripts/`
- Excluded: `node_modules`, `.next`, `.turbo`, `dist`, `build`, `coverage`

### Findings

| Category         | Pattern                             | Count   | Notes                                                                     |
| ---------------- | ----------------------------------- | ------- | ------------------------------------------------------------------------- |
| Deprecated alias | `createSessionRefreshProxy`         | Removed | Was in packages/shared/src/proxy.ts; removed (no callers)                 |
| Legacy override  | `ajv@6.14.0`                        | 1       | Root override; v6 EOL 2021                                                |
| Legacy override  | `minimatch@3.1.4`                   | 1       | Root override; v3 old                                                     |
| Terminology      | `service_role key` in messages      | 3       | admin.ts, env-validation.ts; Supabase transitioning to secret-key wording |
| Raw img          | `next/next/no-img-element` disables | 5       | Blob/decrypted URLs; intentional exceptions                               |
| Class component  | `PageErrorBoundary`                 | 1       | apps/pdf/.../pdf-page-error-boundary.tsx; valid error boundary pattern    |

## 5. Prioritized Findings

### Must change now (as of 2026-02-28 audit snapshot)

| ID  | Finding                                      | Files                        | Action                                                |
| --- | -------------------------------------------- | ---------------------------- | ----------------------------------------------------- |
| M1  | Deprecated alias `createSessionRefreshProxy` | packages/shared/src/proxy.ts | Remove export; no imports exist                       |
| M2  | `ajv@6` override is EOL (Feb 2021)           | package.json                 | Assess transitive deps; upgrade or document rationale |

### Should modernize soon (legacy / soon-to-be-legacy)

| ID  | Finding                                   | Files                                                    | Action                                                                              |
| --- | ----------------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| S1  | Supabase key wording ("service_role key") | packages/shared/src/supabase/admin.ts, env-validation.ts | Add transition note; prefer "secret key" where docs align                           |
| S2  | `minimatch@3` override                    | package.json                                             | Reassess; upgrade if compatible                                                     |
| S3  | Proxy does not refresh Supabase tokens    | proxy.ts                                                 | Document design; Supabase recommends proxy refresh; we rely on action/route context |

### Intentional exceptions (documented)

| ID  | Finding                              | Rationale                                                                                             |
| --- | ------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| I1  | Raw `<img>` with eslint-disable      | Blob URLs, decrypted previews, GIFs; next/image not applicable                                        |
| I2  | Class component `PageErrorBoundary`  | Error boundaries require class API (getDerivedStateFromError/componentDidCatch)                       |
| I3  | `createAdminClient` in allowed paths | Admin client required for webhooks, license validation, session creation; CI guard enforces allowlist |

## 6. Remediation Status

| ID  | Status   | Notes                                                                 |
| --- | -------- | --------------------------------------------------------------------- |
| M1  | Done     | Removed `createSessionRefreshProxy` from packages/shared/src/proxy.ts |
| M2  | Deferred | `ajv@6` override kept; revisit when upstream deps upgrade             |
| S1  | Done     | Updated admin.ts and env-validation.ts with secret-key terminology    |
| S2  | Deferred | `minimatch@3` override kept; same rationale as ajv                    |
| S3  | Done     | Documented proxy design in packages/shared/src/proxy.ts               |

## 7. CI Guardrails Added

- **scripts/ci/guard-deprecated-patterns.mjs** — Blocks: middleware.ts, createSessionRefreshProxy, @supabase/auth-helpers-\*, React 19 removed APIs, Pages Router data methods, next/head.
- Wired into `ci:check` via `bun run ci:guard:deprecated`.

## 8. Verification (ci:check)

As of the 2026-02-28 audit run, checks passed: guard-generated-types, guard-admin-client, guard-proxy-policy, guard-deprecated, format:check, lint, type-check, test.
