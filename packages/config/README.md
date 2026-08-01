# @helvety/config

Shared toolchain **factories** for Helvety apps and packages. Version pins live in [`@helvety/dev-deps`](../dev-deps/README.md); this package exports config entrypoints only.

## Exports

| Import                                    | Purpose                                                                              |
| ----------------------------------------- | ------------------------------------------------------------------------------------ |
| `@helvety/config/tsconfig.base.json`      | Strict TypeScript base (`extends` from app/package `tsconfig.json`)                  |
| `@helvety/config/tsconfig.extension.json` | TypeScript base for Chromium extension repos (no Next plugin; `chrome` + Vite types) |
| `@helvety/config/eslint`                  | `createEslintConfig`, `createPackageEslintConfig`                                    |
| `@helvety/config/vitest`                  | `createVitestConfig` (jsdom, 20s timeout, CSS stub)                                  |
| `@helvety/config/vitest-extension`        | `createExtensionVitestConfig` (Vite extension repos; jsdom + shadcn CSS alias)       |
| `@helvety/config/vitest.setup`            | jest-dom + RTL cleanup (import from each `vitest.setup.ts`)                          |
| `@helvety/config/postcss`                 | Tailwind PostCSS one-liner for zone apps                                             |
| `@helvety/config/next`                    | Next.js presets (`createHelvetyNextConfig`, `createPublicToolNextConfig`, etc.)      |
| `@helvety/config/next-headers`            | Shared security headers (used by `@helvety/shared/proxy`)                            |

## App wiring (typical)

```javascript
// eslint.config.mjs
import { createEslintConfig } from "@helvety/config/eslint";
export default createEslintConfig(import.meta.dirname);
```

```typescript
// vitest.config.ts
import { createVitestConfig } from "@helvety/config/vitest";
export default createVitestConfig(__dirname, { passWithNoTests: false });
```

Zone Next.js presets are covered by `packages/config/next.test.mjs`. See [`docs/app-consistency-checklist.md`](../../docs/app-consistency-checklist.md).

## Extension wiring (Chromium popup / extension repos)

```typescript
// vitest.config.ts
import { createExtensionVitestConfig } from "@helvety/config/vitest-extension";
export default createExtensionVitestConfig(import.meta.dirname, {
  passWithNoTests: false,
});
```

```json
// tsconfig.json
{
  "extends": "@helvety/config/tsconfig.extension.json",
  "include": [
    "src/**/*.ts",
    "src/**/*.tsx",
    "tests/**/*.ts",
    "vite.config.ts",
    "vitest.config.ts"
  ]
}
```
