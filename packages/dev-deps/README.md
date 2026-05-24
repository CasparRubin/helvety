# @helvety/dev-deps

Private meta-package that pins the shared development toolchain for Helvety workspaces.

Add to any app or package:

```json
"devDependencies": {
  "@helvety/config": "workspace:*",
  "@helvety/dev-deps": "workspace:*"
}
```

Canonical versions live here and are enforced by [`scripts/check-workspace-version-drift.mjs`](../../scripts/check-workspace-version-drift.mjs) (`bun run deps:drift`, included in root `bun run ci:check`). Do not duplicate these packages in individual workspace `package.json` files. Runtime dependency versions (for example `next`, `react`, `@supabase/supabase-js`) stay in each app or library manifest and are checked by the same drift script.

Keep app-specific devDependencies (for example `@types/three` on web, `@types/chrome` on extension-chrome) in the workspace that needs them.

**Exceptions:**

- `@helvety/shared` keeps `@helvety/config` in `dependencies` (not only devDependencies) because `packages/shared/src/proxy.ts` imports `@helvety/config/next-headers` at runtime. All other workspaces should use `@helvety/config` in `devDependencies` only.
- `@helvety/ui` keeps `tailwindcss` and `@tailwindcss/postcss` in `dependencies` so zone apps can resolve the shared PostCSS plugin on Vercel/Turbopack builds. Versions stay canonical here in `@helvety/dev-deps`; do not add those packages to individual app manifests.
