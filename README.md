# Helvety

![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Turborepo](https://img.shields.io/badge/Turborepo-2-blue?style=flat-square)
![Bun](https://img.shields.io/badge/Bun-1.3-f9f1e1?style=flat-square&logo=bun)
![License](https://img.shields.io/badge/License-All%20Rights%20Reserved-red?style=flat-square)

Monorepo for all Helvety applications. Engineered & Designed in Switzerland.

## Apps

| App                            | URL                                                  | Description                                                   |
| ------------------------------ | ---------------------------------------------------- | ------------------------------------------------------------- |
| **[Web](apps/web/)**           | [helvety.com](https://helvety.com)                   | Main website, legal pages, landing                            |
| **[Auth](apps/auth/)**         | [helvety.com/auth](https://helvety.com/auth)         | Centralized passwordless authentication (email + passkey SSO) |
| **[Store](apps/store/)**       | [helvety.com/store](https://helvety.com/store)       | Product catalog, subscriptions, Stripe payments               |
| **[PDF](apps/pdf/)**           | [helvety.com/pdf](https://helvety.com/pdf)           | Client-side PDF toolkit (merge, reorder, rotate, extract)     |
| **[Tasks](apps/tasks/)**       | [helvety.com/tasks](https://helvety.com/tasks)       | End-to-end encrypted task management                          |
| **[Contacts](apps/contacts/)** | [helvety.com/contacts](https://helvety.com/contacts) | End-to-end encrypted contact management                       |

## Shared Packages

| Package                                 | Description                                                                                                                                                                   |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **[@helvety/brand](packages/brand/)**   | Shared brand assets: SVG React components and asset URL constants                                                                                                             |
| **[@helvety/config](packages/config/)** | Shared TypeScript, ESLint, Vitest, and PostCSS configurations                                                                                                                 |
| **[@helvety/shared](packages/shared/)** | Shared libraries: Supabase clients, auth, CSRF, proxy, rate limiting, crypto, types, utilities                                                                                |
| **[@helvety/ui](packages/ui/)**         | Shared UI components: shadcn/ui, footer, theme provider, Tiptap editor, CSRF provider, navbar building blocks (ThemeSwitcher, AppSwitcher), AuthTokenHandler, SessionRecovery |

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) >= 1.3
- [Node.js](https://nodejs.org/) >= 20.9

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
# ... etc. for each app
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

### Project Structure

```
helvety/
├── apps/
│   ├── web/          # helvety.com
│   ├── auth/         # helvety.com/auth
│   ├── store/        # helvety.com/store
│   ├── pdf/          # helvety.com/pdf
│   ├── tasks/        # helvety.com/tasks
│   └── contacts/     # helvety.com/contacts
├── packages/
│   ├── brand/        # Shared brand assets (SVG components, asset URLs)
│   ├── config/       # Shared tooling configs
│   ├── shared/       # Shared libraries
│   └── ui/           # Shared UI components (shadcn/ui, footer, navbar building blocks, Tiptap editor)
├── patches/          # Bun dependency patches (applied on install)
├── supabase/         # Database schema export & SQL scripts (gitignored export)
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

Helvety services are intended exclusively for customers located in Switzerland. **We are not able to serve customers in the EU/EEA.**

## Developer

This project is developed and maintained by [Helvety](https://helvety.com), a Swiss company focused on security and user privacy.

For questions or inquiries, please contact us at [contact@helvety.com](mailto:contact@helvety.com).

## License & Usage

> **This is NOT open source software.**

This monorepo is public so users can inspect and verify the applications' behavior and security.

**All Rights Reserved.** No license is granted for any use of this code. You may:

- View and inspect the code

You may NOT:

- Copy, use, or reuse the code in any form
- Redistribute, publish, or share the code
- Modify, adapt, or create derivative works
- Sell, sublicense, or commercially exploit the code
- Reverse engineer or decompile the code

See [LICENSE](./LICENSE) for full legal terms.
