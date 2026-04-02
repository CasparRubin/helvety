# @helvety/ui

Shared React components and small utilities used across Helvety Next.js apps (shadcn/Radix, Tiptap, theme, auth helpers, etc.).

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

Current coverage focuses on stable primitives (e.g. `Button`, `tiptap-utils`). Add tests when touching complex interactive components.

## Related

- Root [README](../../README.md) for monorepo setup
- [AGENTS.md](../../AGENTS.md) for workspace conventions
