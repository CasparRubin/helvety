# Helvety

![Next.js](https://img.shields.io/badge/Next.js-16.x-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Turborepo](https://img.shields.io/badge/Turborepo-2-blue?style=flat-square)
![Bun](https://img.shields.io/badge/Bun-1.3.x-f9f1e1?style=flat-square&logo=bun)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

Monorepo for all Helvety applications. Engineered & Designed in Switzerland.

## Apps

| App                            | URL                                                  | Description                                                       |
| ------------------------------ | ---------------------------------------------------- | ----------------------------------------------------------------- |
| **[Web](apps/web/)**           | [helvety.com](https://helvety.com)                   | Gateway app (multi-zone rewrites), main website, legal pages      |
| **[Auth](apps/auth/)**         | [helvety.com/auth](https://helvety.com/auth)         | Centralized passwordless authentication (email + passkey SSO)     |
| **[Store](apps/store/)**       | [helvety.com/store](https://helvety.com/store)       | Product catalog with app listings and public package downloads    |
| **[PDF](apps/pdf/)**           | [helvety.com/pdf](https://helvety.com/pdf)           | Client-side PDF toolkit (merge, reorder, rotate, extract)         |
| **[Tasks](apps/tasks/)**       | [helvety.com/tasks](https://helvety.com/tasks)       | Task management with client-side encryption for sensitive data    |
| **[Contacts](apps/contacts/)** | [helvety.com/contacts](https://helvety.com/contacts) | Contact management with client-side encryption for sensitive data |
| **[Notes](apps/notes/)**       | [helvety.com/notes](https://helvety.com/notes)       | Notes management with client-side encryption for sensitive data   |

## Shared Packages

| Package                                 | Description                                                                                                                                                                                                                     |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **[@helvety/brand](packages/brand/)**   | Shared brand assets: SVG React components and asset URL constants                                                                                                                                                               |
| **[@helvety/config](packages/config/)** | Shared TypeScript, ESLint, Vitest, PostCSS, and Next.js security-header configurations                                                                                                                                          |
| **[@helvety/shared](packages/shared/)** | Shared libraries: Supabase clients, auth, CSRF, proxy, rate limiting, crypto, cached server helpers, types, utilities                                                                                                           |
| **[@helvety/ui](packages/ui/)**         | Shared UI components: shadcn/ui, footer, theme provider, Tiptap editor, CSRF provider, EncryptionGate, AppSwitcher, ThemeSwitcher, navbar-scoped animated Lucide icon aliases, AuthTokenHandler, SessionRecovery, SkipToContent |

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

# Type-check all apps
bun run type-check

# Lint all apps
bun run lint

# Run all tests
bun run test

# Format all files
bun run format
```

### Automation

- GitHub Actions workflows are intentionally not configured in this repository.
- Quality checks (`lint`, `type-check`, `test`, and `format:check`) are run manually/local as needed.
- Dependency and security checks (`deps:audit`, `deps:check`) are also run manually/local as needed.
- Deployments are handled by Vercel via Git integration.

### Supabase Workflow (Remote-First)

- We do not run a local Supabase stack in this repo.
- Database changes are applied directly in the hosted Supabase project (SQL Editor / SQL migrations).
- Keep `supabase/getSupabase.sql` for full-schema export/audit queries.
- Keep `supabase/supabase.json` local-only (gitignored). It contains sensitive schema/ACL/function metadata and must be regenerated after live hardening changes before using it for security conclusions.
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
│   └── ui/           # Shared UI components (shadcn/ui, footer, theme provider, Tiptap editor, CSRF provider, EncryptionGate, AppSwitcher, ThemeSwitcher, navbar-scoped animated Lucide icon aliases, AuthTokenHandler, SessionRecovery, SkipToContent)
├── patches/          # Bun dependency patches (applied on install)
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

## Service Availability

Helvety services are primarily intended for customers in Switzerland. New account creation includes a Switzerland location confirmation step for account-based services, but technical access from outside Switzerland may still occur. Mandatory law in other jurisdictions may still apply in specific cases.

## Developer

This project is developed and maintained by [Helvety](https://helvety.com), a Swiss company focused on security and user privacy.

For questions or inquiries, please contact us at [contact@helvety.com](mailto:contact@helvety.com).

## License & Usage

This monorepo is open source under the [MIT License](./LICENSE).

You may use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of this software, provided the copyright and permission notice are
included in substantial portions of the software.

The software is provided "as is", without warranty of any kind. See
[LICENSE](./LICENSE) for full legal terms.
