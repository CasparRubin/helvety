# Helvety Monorepo Conventions

This document defines structure and boundary guardrails for all workspace apps/packages.

## Workspace structure

- `apps/*`: deployable Next.js applications.
- `packages/*`: shared code and shared tooling only.
- Applications may consume:
  - `@helvety/shared`
  - `@helvety/ui`
  - `@helvety/brand`
  - external npm dependencies
- Applications must not import from other apps directly.

## App folder contract

Each app should use these top-level folders when relevant:

- `app`: App Router routes, layouts, route handlers.
- `components`: app-specific UI components.
- `hooks`: app-specific hooks.
- `lib`: app-specific domain/config/data logic.
- `public`: static assets.

When a module is reused across multiple apps, move it into a package instead of copying it.

## Package folder contract

- Packages should keep implementation in `src`.
- Package entry points are declared explicitly in `package.json` `exports`.
- Do not import package internals via deep relative paths from other workspaces.

## Styling contract (Tailwind v4)

- Global Tailwind baseline stays centralized in `@helvety/ui` and imported by every app through `app/globals.css`.
- Shared design tokens should be added once in `@helvety/ui` styles instead of redefining per app.
- App-local CSS should only include app-specific overrides.

## Testing contract

- `vitest.setup.ts` must include:
  - `@testing-library/jest-dom/vitest`
  - `afterEach(cleanup)` for deterministic test isolation
- Workspace scripts should expose:
  - `test`
  - `test:watch`
  - `test:coverage` (or explicit no-tests stub)

## TypeScript contract

- Workspaces should inherit from `@helvety/config/tsconfig.base.json`.
- Keep strict typing and avoid `any` for new code.
