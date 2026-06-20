# @helvety/config

Shared toolchain **factories** for Helvety apps and packages. Version pins live in [`@helvety/dev-deps`](../dev-deps/README.md); this package exports config entrypoints only.

## Exports

| Import                               | Purpose                                                                           |
| ------------------------------------ | --------------------------------------------------------------------------------- |
| `@helvety/config/tsconfig.base.json` | Strict TypeScript base (`extends` from app/package `tsconfig.json`)               |
| `@helvety/config/eslint`             | `createEslintConfig`, `createPackageEslintConfig`                                 |
| `@helvety/config/vitest`             | `createVitestConfig` (jsdom, 20s timeout, CSS stub)                               |
| `@helvety/config/vitest.setup`       | jest-dom + RTL cleanup (import from each `vitest.setup.ts`)                       |
| `@helvety/config/postcss`            | Tailwind PostCSS one-liner for zone apps                                          |
| `@helvety/config/next`               | Next.js presets (`createE2eeZoneNextConfig`, `createAuthGatewayNextConfig`, etc.) |
| `@helvety/config/next-headers`       | Shared security headers (used by `@helvety/shared/proxy`)                         |

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

Zone Next.js presets are enforced by `packages/shared/src/zone-next-config-wiring.test.ts`. See [`docs/app-consistency-checklist.md`](../../docs/app-consistency-checklist.md).
