# Helvety

Monorepo for all Helvety applications.

## Overview

Helvety is a Next.js monorepo for a path-routed ecosystem on `helvety.com`:

- Public apps: `web`, `store`, `pdf`, `image-upscaler`
- Account/E2EE apps: `auth`, `tasks`, `contacts`, `notes`
- Shared packages: `@helvety/shared`, `@helvety/ui`, `@helvety/config`, `@helvety/brand`

## Applications

| App                                           | URL                                  | Purpose                                                        |
| --------------------------------------------- | ------------------------------------ | -------------------------------------------------------------- |
| [`apps/web`](apps/web/)                       | <https://helvety.com>                | Gateway app, legal pages, sitemap index, cross-zone navigation |
| [`apps/auth`](apps/auth/)                     | <https://helvety.com/auth>           | Centralized passwordless auth (email OTP + passkey)            |
| [`apps/store`](apps/store/)                   | <https://helvety.com/store>          | Product catalog and package downloads                          |
| [`apps/pdf`](apps/pdf/)                       | <https://helvety.com/pdf>            | Browser-based PDF tools                                        |
| [`apps/image-upscaler`](apps/image-upscaler/) | <https://helvety.com/image-upscaler> | Browser-based image upscaling                                  |
| [`apps/tasks`](apps/tasks/)                   | <https://helvety.com/tasks>          | E2EE task management                                           |
| [`apps/contacts`](apps/contacts/)             | <https://helvety.com/contacts>       | E2EE contact management                                        |
| [`apps/notes`](apps/notes/)                   | <https://helvety.com/notes>          | E2EE notes                                                     |

## Shared Packages

| Package                               | Purpose                                                        |
| ------------------------------------- | -------------------------------------------------------------- |
| [`packages/brand`](packages/brand/)   | Shared brand assets                                            |
| [`packages/config`](packages/config/) | Shared TypeScript, ESLint, Vitest, PostCSS, Next config        |
| [`packages/shared`](packages/shared/) | Security/auth/rate-limit/Supabase helpers and shared constants |
| [`packages/ui`](packages/ui/)         | Shared UI components and app-shell primitives                  |

## Prerequisites

- [Bun](https://bun.sh/) `>= 1.3`
- [Node.js](https://nodejs.org/) `24.x`

## Getting Started

```bash
git clone https://github.com/CasparRubin/helvety.git
cd helvety
bun install
```

Copy env templates only for apps you will run:

```bash
cp apps/web/env.template apps/web/.env.local
cp apps/auth/env.template apps/auth/.env.local
cp apps/store/env.template apps/store/.env.local
cp apps/pdf/env.template apps/pdf/.env.local
cp apps/image-upscaler/env.template apps/image-upscaler/.env.local
cp apps/tasks/env.template apps/tasks/.env.local
cp apps/contacts/env.template apps/contacts/.env.local
cp apps/notes/env.template apps/notes/.env.local
```

## Common Commands

```bash
# run all dev servers
bun run dev

# run one workspace
bun run dev --filter=@helvety/web

# quality checks
bun run lint
bun run type-check
bun run test
bun run format
```

## Testing Consistency

- Prefer semantic Testing Library queries (`getByRole`, `getByLabelText`) over DOM-structure or text-count assertions.
- Keep `vi.mock(...)` at module scope and reset mocks in `beforeEach`; restore spies/globals in `afterEach` where applicable.
- For async rejection cases, capture one promise and assert multiple expectations against that same invocation.
- Use explicit `cleanup()` in workspace `vitest.setup.ts` files that use `@testing-library/react`.
- Prefer typed fixture builders in tests (`buildXxx(...)`) over repeated `as unknown as` casting so test inputs evolve with production types.

## CI and Release Checks

- `bun run ci:check` runs `consistency:proxy-docs`, `consistency:guardrails`, `format:check`, `lint`, `type-check`, `test`.
- `bun run ci:release` runs `ci:check` plus `build`.
- GitHub CI (`.github/workflows/ci.yml`) currently runs `bun run ci:check`.
- `ci:release` sets `SKIP_ENV_VALIDATION=1` during `build` only; missing env values use schema-valid placeholders in local builds.
- `VERCEL=1` disables placeholder mode; production builds must use real env vars.
- Dependency/security checks:
  - `bun run deps:security` (security floors + `bun audit`)
  - `bun run deps:drift` (workspace version drift)
  - `bun run deps:check` / `bun run knip:exports` / `bun run deps:unused`

## Environment Model

- App URL and cookie domain logic are derived from `NODE_ENV` via shared config.
- `HELVETY_SERVER_ACTION_ALLOWED_ORIGINS` can override the server-action trusted-origin allowlist as a comma-separated list; on Vercel, defaults are derived automatically from deployment/runtime URLs plus `https://helvety.com`.
- App READMEs document per-app env templates; shared runtime/security defaults are documented in this root README and `packages/config`.

## Supabase Workflow (Remote-First)

- This repo does not run a local Supabase stack.
- Schema/policy changes are made in the hosted Supabase project.
- `supabase/getSupabase.sql` is used for export/audit queries.
- `supabase/supabase.json` is local-only (gitignored) and must never be committed.
- Regenerate shared DB types when needed:

```bash
SUPABASE_PROJECT_ID=<project-ref> bun run db:gen-types
```

## Security Posture (High Level)

- `proxy.ts` is lightweight request setup (CSP headers, optional CSRF bootstrap, and Supabase cookie refresh), not the primary auth boundary.
- Primary auth/authz enforcement lives in Server Components, Server Actions, and route handlers.
- E2EE apps (`tasks`, `contacts`, `notes`) enforce server-side page guards and passkey-based unlock flows.

## Project Structure

```text
helvety/
├── apps/
├── packages/
├── supabase/
├── turbo.json
└── package.json
```

Architecture entry points and flow references are documented in each app/package README and in the shared runtime/security docs under `packages/shared`.

## Service and Legal

Services are primarily intended for customers in Switzerland. Account-based flows include a non-EU/EEA attestation step during sign-in. Legal pages are hosted on <https://helvety.com>:

- Privacy: <https://helvety.com/privacy>
- Terms: <https://helvety.com/terms>
- Impressum (including abuse reporting): <https://helvety.com/impressum#abuse>

## License

Licensed under the [MIT License](./LICENSE).
