# @helvety/ui

Shared React UI components and app-shell primitives for Helvety apps.

## Scope

This package provides:

- Shared design-system and utility components
- Theme and layout helpers
- E2EE app-shell primitives
- Cross-app navigation primitives

## Key Exports

Commonly used in `tasks`, `contacts`, and `notes`:

- `@helvety/ui/e2ee-app-root-layout` -> `E2eeAppRootLayout`
- `@helvety/ui/e2ee-app-navbar` -> `E2eeAppNavbar`, `E2eeAppNavbarLabels`
- `@helvety/ui/root-global-error` -> `RootGlobalError`
- `@helvety/ui/use-e2ee-entity-list-dnd-sensors` -> shared dnd sensor setup

Also includes reusable UI building blocks used across zones (for example command bars, search fields, app switcher, and selected editor helpers).

## Testing

Run from repo root:

```bash
bun run test --filter=@helvety/ui
```

Run from `packages/ui`:

```bash
bun run test
bun run test:watch
bun run test:coverage
```

Coverage focuses on stable primitives and key shared UX surfaces.

## Related

- Root monorepo docs: [`README.md`](../../README.md)
- Shared backend package: [`packages/shared/README.md`](../shared/README.md)
