# Helvety

![Next.js](https://img.shields.io/badge/Next.js-16.x-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Turborepo](https://img.shields.io/badge/Turborepo-2-blue?style=flat-square)
![Bun](https://img.shields.io/badge/Bun-1.3.x-f9f1e1?style=flat-square&logo=bun)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

Monorepo for all Helvety applications. Engineered & Designed in Switzerland.

## Apps

| App                            | URL                                                  | Description                                                                                  |
| ------------------------------ | ---------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **[Web](apps/web/)**           | [helvety.com](https://helvety.com)                   | Gateway app (multi-zone rewrites), main website, legal pages                                 |
| **[Auth](apps/auth/)**         | [helvety.com/auth](https://helvety.com/auth)         | Centralized passwordless authentication (email + passkey SSO)                                |
| **[Store](apps/store/)**       | [helvety.com/store](https://helvety.com/store)       | Product catalog: web apps plus public downloads (e.g. SPFx packages, browser extension ZIPs) |
| **[PDF](apps/pdf/)**           | [helvety.com/pdf](https://helvety.com/pdf)           | Client-side PDF toolkit (merge, reorder, rotate, extract)                                    |
| **[Tasks](apps/tasks/)**       | [helvety.com/tasks](https://helvety.com/tasks)       | Task management with client-side encryption for sensitive data                               |
| **[Contacts](apps/contacts/)** | [helvety.com/contacts](https://helvety.com/contacts) | Contact management with client-side encryption for sensitive data                            |
| **[Notes](apps/notes/)**       | [helvety.com/notes](https://helvety.com/notes)       | Note management with client-side encryption for sensitive data                               |

## Shared Packages

| Package                                 | Description                                                                                                                                                                                                                                                                                                                                                                      |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **[@helvety/brand](packages/brand/)**   | Shared brand assets: SVG React components and asset URL constants                                                                                                                                                                                                                                                                                                                |
| **[@helvety/config](packages/config/)** | Shared TypeScript, ESLint (factory exports plus a default flat config for this package’s own lint), Vitest, PostCSS, and Next.js security-header configurations                                                                                                                                                                                                                  |
| **[@helvety/shared](packages/shared/)** | Shared libraries: Supabase clients, auth, CSRF, proxy, rate limiting, crypto, cached server helpers, structured logging (`@helvety/shared/logger`, including `logUnexpectedError` for caught/API failures), ID helpers (`@helvety/shared/uuid-string`), **shared constants** (e.g. `ACTION_LIMITS` for reorder/export caps, toast durations), font definitions, types, utilities |
| **[@helvety/ui](packages/ui/)**         | Shared UI components: shadcn/ui, footer, theme provider, Tiptap editor, CSRF provider, EncryptionGate, AppSwitcher, ThemeSwitcher, navbar-scoped animated Lucide icon aliases, AuthTokenHandler, SessionRecovery, SkipToContent (Vitest tests for selected primitives)                                                                                                           |

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) >= 1.3
- [Node.js](https://nodejs.org/) 22.x

### Setup

```bash
# Clone the repository
git clone https://github.com/CasparRubin/helvety.git
cd helvety

# Install all dependencies
bun install

# Copy env templates for each app you want to run
cp apps/web/env.template apps/web/.env.local
cp apps/auth/env.template apps/auth/.env.local
cp apps/store/env.template apps/store/.env.local
cp apps/pdf/env.template apps/pdf/.env.local
cp apps/tasks/env.template apps/tasks/.env.local
cp apps/contacts/env.template apps/contacts/.env.local
cp apps/notes/env.template apps/notes/.env.local
```

```powershell
# Windows PowerShell equivalent
Copy-Item "apps/web/env.template" "apps/web/.env.local"
Copy-Item "apps/auth/env.template" "apps/auth/.env.local"
Copy-Item "apps/store/env.template" "apps/store/.env.local"
Copy-Item "apps/pdf/env.template" "apps/pdf/.env.local"
Copy-Item "apps/tasks/env.template" "apps/tasks/.env.local"
Copy-Item "apps/contacts/env.template" "apps/contacts/.env.local"
Copy-Item "apps/notes/env.template" "apps/notes/.env.local"
```

### Development

```bash
# Run all apps in development mode
bun run dev

# Run a specific app
bun run dev --filter=@helvety/web
bun run dev --filter=@helvety/store

# Type-check all workspaces (apps + packages)
bun run type-check

# Lint all workspaces (apps + packages)
bun run lint

# Run tests across all workspaces (apps + packages)
bun run test

# Format all files
bun run format
```

### Automation

- GitHub Actions workflows are intentionally not configured in this repository.
- Quality checks: `bun run ci:check` runs `format:check`, `lint`, `type-check`, and `test`. For a full pre-deploy pass including production build, run `bun run ci:release` (same as `ci:check` plus `build`).
- Dependency hygiene (`deps:outdated`, `deps:check` with [Knip](https://knip.dev/) for unused files/dependencies, `knip:exports` for unused exports/types, or `deps:unused` to run both Knip passes) and security review (`deps:security` = `deps:security:floors` plus `deps:audit`) are run locally as needed. Minimum versions for **Next.js**, **React** / **react-dom**, **@supabase/supabase-js**, and **@simplewebauthn/server** are defined in [`scripts/check-security-dependency-floors.mjs`](scripts/check-security-dependency-floors.mjs)—bump those floors when you intentionally raise those packages. This repo uses **Bun** (`bun audit`); there is no root `package-lock.json`, so `npm audit` is not the primary signal unless you generate an npm lockfile for comparison.
- When `bun audit` reports vulnerable **transitive** packages, root `package.json` **`overrides`** may pin patched versions; re-run `bun install` and `ci:release` after changing overrides.
- Deployments are handled by Vercel via Git integration.

### Supabase Workflow (Remote-First)

- We do not run a local Supabase stack in this repo.
- Database changes are applied directly in the hosted Supabase project (SQL Editor / SQL migrations).
- Keep `supabase/getSupabase.sql` for full-schema export/audit queries.
- Keep `supabase/supabase.json` local-only (gitignored). It contains sensitive schema/ACL/function metadata and must be regenerated after live hardening changes before using it for security conclusions.
- Run a monthly Supabase auth-provider posture check:
  1. Review enabled providers in Supabase Dashboard -> Authentication -> Providers and disable any provider not intentionally used.
  2. If Apple or Azure providers are enabled, verify current Supabase Auth advisories before release and confirm expected issuer/domain configuration.
  3. Re-run project security/performance advisors after auth configuration changes.
  4. Regenerate `supabase/supabase.json` after hardening updates so local security reviews use current ACL/policy metadata.
- Regenerate shared DB types only when needed:

```bash
SUPABASE_PROJECT_ID=<project-ref> bun run db:gen-types
```

### Project Structure

```
helvety/
├── apps/
│   ├── web/          # helvety.com
│   ├── auth/         # helvety.com/auth
│   ├── store/        # helvety.com/store
│   ├── pdf/          # helvety.com/pdf
│   ├── tasks/        # helvety.com/tasks
│   ├── contacts/     # helvety.com/contacts
│   └── notes/        # helvety.com/notes
├── packages/
│   ├── brand/        # Shared brand assets (SVG components, asset URLs)
│   ├── config/       # Shared tooling configs
│   ├── shared/       # Shared libraries
│   └── ui/           # Shared UI components (same as table above); package includes Vitest tests for key pieces (e.g. button, tiptap-utils)
├── supabase/         # Remote-first Supabase SQL/export helpers (supabase.json is gitignored)
├── turbo.json        # Turborepo task configuration
└── package.json      # Root workspace configuration
```

## Tech Stack

- **[Next.js 16](https://nextjs.org/)** - React framework with App Router
- **[React 19](https://react.dev/)** - UI library
- **[TypeScript 5](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Turborepo](https://turbo.build/)** - Monorepo build system
- **[Bun](https://bun.sh/)** - Package manager and runtime
- **[Supabase](https://supabase.com/)** - Backend-as-a-Service
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first CSS
- **[shadcn/ui](https://ui.shadcn.com/)** - Component library
- **[Vercel](https://vercel.com/)** - Deployment platform

## UI/UX Consistency Notes

- Typography is centralized through `@helvety/shared/fonts` (`next/font/google` with shared `Public Sans` variable setup).
- App layouts should import shared font definitions instead of referencing local font files from `node_modules`.

## Service Availability

Helvety services are primarily intended for customers in Switzerland. Sign-in for account-based services includes a confirmation that the user is not located in the EU/EEA before verification-code delivery, but technical access from outside Switzerland may still occur. Mandatory law in other jurisdictions may still apply in specific cases.

## Developer

This project is developed and maintained by [Helvety](https://helvety.com), a Swiss sole proprietorship (Einzelfirma) focused on security and user privacy.

For questions or inquiries, please contact us at [contact@helvety.com](mailto:contact@helvety.com).

## License & Usage

This monorepo is open source under the [MIT License](./LICENSE).

You may use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of this software, provided the copyright and permission notice are
included in substantial portions of the software.

The software is provided "as is", without warranty of any kind. See
[LICENSE](./LICENSE) for full legal terms.
