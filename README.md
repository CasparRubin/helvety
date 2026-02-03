# Helvety.com

![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19.2.4-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![License](https://img.shields.io/badge/License-All%20Rights%20Reserved-red?style=flat-square)

The main Helvety website. Swiss Engineering.

**Website:** [helvety.com](https://helvety.com)

## Features

- **App Switcher** - Navigate between Helvety ecosystem apps (Home, Auth, Store, PDF)
- **Sign in** - Sign in when not authenticated (centralized auth)
- **Profile menu** - When signed in: user email, links to Store (Products, Account, Subscriptions, Tenants), Sign out
- **Dark & Light mode** - Comfortable viewing in any lighting condition
- **Legal pages** - Impressum, Privacy Policy, and Terms of Service (in the site footer)
- **SEO optimized** - Sitemap and robots.txt for search engine visibility
- **Animated logo** - Subtle glow effect on the main logo

## Security Features

This application implements comprehensive security hardening:

- **Session Management** - Session validation and refresh via `proxy.ts` using `getClaims()` (local JWT validation; Auth API only when refresh is needed)
- **Server Layout Guards** - Authentication checks in Server Components (CVE-2025-29927 compliant)
- **CSRF Protection** - Token-based protection with timing-safe comparison for state-changing operations
- **Rate Limiting** - In-memory rate limiting to prevent brute force attacks
- **Idle Timeout** - Automatic session expiration after 30 minutes of inactivity
- **Security Headers** - Comprehensive CSP, HSTS, and other security headers
- **Audit Logging** - Structured logging for authentication events

### Cross-Subdomain SSO

Sessions are shared across all `*.helvety.com` applications via cookie-based SSO. Authentication is handled centrally by [auth.helvety.com](https://auth.helvety.com).

## Tech Stack

This project is built with modern web technologies:

- **[Next.js 16.1.6](https://nextjs.org/)** - React framework with App Router
- **[React 19.2.4](https://react.dev/)** - UI library
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[shadcn/ui](https://ui.shadcn.com/)** - High-quality React component library
- **[Radix UI](https://www.radix-ui.com/)** - Unstyled, accessible component primitives
- **[Lucide React](https://lucide.dev/)** - Icon library
- **[Framer Motion](https://www.framer.com/motion/)** - Animation library
- **[next-themes](https://github.com/pacocoursey/next-themes)** - Dark mode support
- **[Vitest](https://vitest.dev/)** - Unit and integration testing

**Environment:** Copy `env.template` to `.env.local` and set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and (for server-side admin) `SUPABASE_SECRET_KEY`. Node.js 20.9+ required.

**Pre-deployment:** Run `npm run predeploy` to run format check, type check, lint, tests, and production build.

**Shared code sync:** This repo is the source of truth for code shared with helvety-auth, helvety-store, and helvety-pdf. After changing any file listed in `.cursor/rules/shared-code-patterns.mdc`, run `node scripts/sync-shared.js` from this repo to copy updates to the other three. Note: `lib/constants.ts` is not synced to helvety-pdf (that app keeps TOAST_DURATIONS plus PDF-specific constants). Then run format/lint/tests in each target repo.

**Development standards:** Project rules live in `.cursor/rules/` (code organization, JSDoc, shared code patterns, after-change checklist, official-docs-first). These rule files are kept in sync across helvety.com, helvety-auth, helvety-pdf, and helvety-store. When changing code, also update tests, comments, README, and legal pages as needed (see `after-change-checklist.mdc`).

## Developer

This application is developed and maintained by [Helvety](https://helvety.com), a Swiss company committed to transparency, strong security, and respect for user privacy and data protection.

For questions or inquiries, please contact us at [contact@helvety.com](mailto:contact@helvety.com).

## License & Usage

> **This is NOT open source software.**

This repository is public **for transparency purposes only** so users can verify the application's behavior and security.

**All Rights Reserved.** No license is granted for any use of this code. You may:

- View and inspect the code

You may NOT:

- Clone, copy, or download this code for any purpose
- Modify, adapt, or create derivative works
- Redistribute or share this code
- Use this code in your own projects
- Run this code locally or on your own servers

See [LICENSE](./LICENSE) for full legal terms.
