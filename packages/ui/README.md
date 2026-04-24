# @helvety/ui

Shared React components and small utilities used across Helvety Next.js apps (shadcn/Radix, Tiptap, theme, auth helpers, etc.).

## E2EE and app shell exports

These are consumed mainly by **Contacts**, **Notes**, and **Tasks** (and thin re-exports in each app where needed):

- `@helvety/ui/e2ee-app-root-layout` — `E2eeAppRootLayout` (nonce/CSRF/user bootstrap, providers, `EncryptionGateApp`)
- `@helvety/ui/e2ee-app-navbar` — `E2eeAppNavbar` + `E2eeAppNavbarLabels` (parameterized copy; uses `@helvety/shared/crypto/encryption-context`)
- `@helvety/ui/root-global-error` — `RootGlobalError` for `app/global-error.tsx` in all zones
- `@helvety/ui/use-e2ee-entity-list-dnd-sensors` — shared @dnd-kit sensor setup for main lists

## Tests

The package uses [Vitest](https://vitest.dev/) with the shared config from `@helvety/config/vitest` (jsdom, `server-only` mock, Testing Library).

```bash
# From repo root
bun run test --filter=@helvety/ui

# From this package
bun run test
bun run test:watch
bun run test:coverage
```

Current coverage focuses on stable primitives (e.g. `Button`, `ListSearchField`, `tiptap-utils`). Add tests when touching complex interactive components.

## Related

- Root [README](../../README.md) for monorepo setup
- [AGENTS.md](../../AGENTS.md) for workspace conventions
