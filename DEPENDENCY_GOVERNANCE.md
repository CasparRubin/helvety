# Dependency Governance

This repository uses Bun workspaces with a lockstep policy for critical runtime and tooling dependencies.

## Lockstep Packages

The following dependencies must stay aligned across workspace `dependencies` and `devDependencies`:

- `next`
- `react`
- `react-dom`
- `typescript`
- `eslint`
- `vitest`
- `@vitest/coverage-v8`
- `@supabase/supabase-js`
- `@supabase/ssr`
- `@simplewebauthn/server`
- `@simplewebauthn/browser`
- `zod`
- `prettier-plugin-tailwindcss`

Run `bun run deps:drift` before opening a PR.

## Install Determinism

- Use `bun install --frozen-lockfile` (or `bun ci`) in CI.
- Commit lockfile updates with dependency changes.

## Overrides Hygiene

Root `package.json` `overrides` are allowed only for:

- active security advisories,
- confirmed upstream breakage that blocks release.

When adding an override:

1. Add a short reason comment in the PR description.
2. Link the upstream advisory/issue.
3. Add a removal condition (version or date checkpoint).
