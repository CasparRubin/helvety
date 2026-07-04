# @helvety/dev-deps

Private meta-package that pins the shared development toolchain for Helvety workspaces.

Add to any app or package:

```json
"devDependencies": {
  "@helvety/config": "workspace:*",
  "@helvety/dev-deps": "workspace:*"
}
```

Canonical versions live here in **`dependencies`** (not `devDependencies`) so Bun hoists toolchain bins and types into workspaces that declare `"@helvety/dev-deps": "workspace:*"`. They are enforced by [`scripts/check-workspace-version-drift.mjs`](../../scripts/check-workspace-version-drift.mjs) (`bun run deps:drift`, included in root `bun run ci:check`). Do not duplicate these packages in individual workspace `package.json` files. Runtime dependency versions (for example `next`, `react`, `@supabase/supabase-js`) stay in each app or library manifest and are checked by the same drift script.

Keep app-specific devDependencies (for example `@types/three` on web, `@types/chrome` ^0.2.2 on extension-chrome) in the workspace that needs them.

**Exceptions:**

- `@helvety/shared` keeps `@helvety/config` in `dependencies` (not only devDependencies) because `packages/shared/src/proxy.ts` imports `@helvety/config/next-headers` at runtime. All other workspaces should use `@helvety/config` in `devDependencies` only.
- `@helvety/ui` keeps `tailwindcss` and `@tailwindcss/postcss` in `dependencies` so Tailwind packages sit on zone apps’ production dependency graph for Turbopack CSS processing. `@helvety/config/postcss` loads the PostCSS plugin from this package. Versions stay canonical here in `@helvety/dev-deps`; do not add those packages to individual app manifests.
