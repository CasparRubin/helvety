# Helvety.com

![Next.js](https://img.shields.io/badge/Next.js-16.x-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19.x-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![License](https://img.shields.io/badge/License-All%20Rights%20Reserved-red?style=flat-square)

The main Helvety website. Engineered & Designed in Switzerland.

**Website:** [helvety.com](https://helvety.com)

> **Part of the [Helvety monorepo](https://github.com/CasparRubin/helvety).** This app lives in `apps/web/`. See the root README for monorepo setup instructions.

## Service Availability

Helvety services are primarily intended for customers in Switzerland. New account creation includes a Switzerland location confirmation step for account-based services, but technical access from outside Switzerland may still occur. Mandatory law in other jurisdictions may still apply in specific cases.

Helvety's legal baseline is Swiss data protection law (nDSG). Account-based services ask new users to confirm Switzerland-based usage during account creation on [helvety.com/auth](https://helvety.com/auth) before a new account is created.

## Features

- **App Switcher** - Navigate between Helvety ecosystem apps (Home, Auth, Store, PDF, Tasks, Contacts)
- **Sign in** - Sign in when not authenticated (centralized auth)
- **Profile menu** - When signed in: user email, links to Store (Account, Subscriptions), Sign out
- **Dark & Light mode** - Switch between dark and light themes
- **Legal pages** - Privacy Policy, Terms of Service, and Impressum are hosted centrally on [helvety.com](https://helvety.com) and linked in the site footer. Services are primarily intended for customers in Switzerland, and account-based services ask new users to confirm Switzerland-based usage during account creation on [helvety.com/auth](https://helvety.com/auth) (before a new account is created). The legal baseline is Swiss data protection law (nDSG), and where other mandatory law applies in a specific case, Helvety follows those obligations.
- **Abuse reporting** - The Impressum includes an abuse reporting section ([helvety.com/impressum#abuse](https://helvety.com/impressum#abuse)) with guidance for users and law enforcement. Abuse contact: [contact@helvety.com](mailto:contact@helvety.com).
- **Cookie notice** - Informational notice in the footer about essential cookies under the current published policy (Swiss nDSG / FMG positioning); analytics usage is documented separately in the Privacy Policy
- **SEO optimized** - Sitemap and robots.txt for search engine visibility
- **Animated logo** - Subtle glow effect on the main logo

## Multi-Zone Routing Notes

- Sub-apps are forwarded by gateway rewrites in `apps/web/next.config.ts`.
- Use wildcard segment patterns (prefer `:path*`) for zone forwarding rules so App Router Flight/RSC prefetch requests (`?_rsc=...`) and trailing-slash variants are forwarded consistently.
- Keep wildcard usage consistent across zones (`auth`, `tasks`, `contacts`, `store`, `pdf`) to avoid edge-case misses and preserve smooth prefetch behavior.

## Security Features

This application includes the following security hardening:

- **Session Management** - `proxy.ts` performs lightweight request setup (CSP headers and CSRF bootstrap). Session/auth checks are enforced in pages, Server Actions, and Route Handlers.
- **Redirect URI Validation** - Redirect URIs are allowlist-validated in core auth flows via `@helvety/shared/redirect-validation` to reduce open-redirect risk
- **CSRF Protection** - Token-based protection for state-changing operations
- **Security Headers** - CSP, HSTS, and other security headers

### Session Sharing (SSO)

Sessions are shared across all Helvety apps via cookie-based SSO (all apps are served under `helvety.com` via path-based routing). Authentication is handled centrally by [helvety.com/auth](https://helvety.com/auth).

## Environment Variables

Copy `env.template` to `.env.local` and fill in values. All `NEXT_PUBLIC_*` vars are exposed to the client; others are server-only.

| Variable                               | Required | Server-only | Description                                                   |
| -------------------------------------- | -------- | ----------- | ------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Yes      | No          | Supabase project URL                                          |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes      | No          | Publishable key (RLS applies)                                 |
| `AUTH_URL`                             | Prod     | **Yes**     | Internal Vercel URL for Auth app (gateway rewrite target)     |
| `STORE_URL`                            | Prod     | **Yes**     | Internal Vercel URL for Store app (gateway rewrite target)    |
| `PDF_URL`                              | Prod     | **Yes**     | Internal Vercel URL for PDF app (gateway rewrite target)      |
| `TASKS_URL`                            | Prod     | **Yes**     | Internal Vercel URL for Tasks app (gateway rewrite target)    |
| `CONTACTS_URL`                         | Prod     | **Yes**     | Internal Vercel URL for Contacts app (gateway rewrite target) |

> **Note:** Public app URL/cookie domain are derived from `NODE_ENV` in `packages/shared/src/config.ts`. Separately, the gateway rewrite URLs (`AUTH_URL`, `STORE_URL`, etc.) are only needed on Vercel production — they point to each sub-app's internal Vercel deployment URL (not `helvety.com`). In development, they fall back to localhost ports. Production rewrite hosts must use the built-in trusted host policy (`*.vercel.app`, `*.helvety.com`, and `helvety.com`). Make sure your production URL (`https://helvety.com`) is in your Supabase Redirect URLs allowlist (Supabase Dashboard > Authentication > URL Configuration > Redirect URLs).

## Tech Stack

This project is built with modern web technologies:

- **[Next.js 16.x](https://nextjs.org/)** - React framework with App Router
- **[React 19.x](https://react.dev/)** - UI library
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first CSS framework
- **[shadcn/ui](https://ui.shadcn.com/)** - High-quality React component library
- **[Radix UI](https://www.radix-ui.com/)** - Unstyled, accessible component primitives
- **[Lucide React](https://lucide.dev/)** - Icon library
- **[Framer Motion](https://www.framer.com/motion/)** - Animation library
- **[next-themes](https://github.com/pacocoursey/next-themes)** - Dark mode support

## Testing

Unit tests are written with [Vitest](https://vitest.dev/) and run in a jsdom environment with type-checking enabled.

| Script                  | Description                       |
| ----------------------- | --------------------------------- |
| `bun run test`          | Run all tests once                |
| `bun run test:watch`    | Run tests in watch mode           |
| `bun run test:coverage` | Run tests with v8 coverage report |

Test files follow the `**/*.test.{ts,tsx}` pattern and live next to the source they test.

## Developer

This application is developed and maintained by [Helvety](https://helvety.com), a Swiss company focused on security and user privacy.

Vercel Analytics and Vercel Speed Insights are used across Helvety apps for privacy-oriented, aggregated/pseudonymized page-view and performance metrics. See our [Privacy Policy](https://helvety.com/privacy) for details.

For questions or inquiries, please contact us at [contact@helvety.com](mailto:contact@helvety.com). To report abuse, contact [contact@helvety.com](mailto:contact@helvety.com).

## License & Usage

> **This is NOT open source software.**

This monorepo is public so users can inspect the code and independently assess application behavior and security posture.

**All Rights Reserved.** No license is granted for any use of this code. You may:

- View and inspect the code

You may NOT:

- Copy, use, or reuse the code in any form
- Redistribute, publish, or share the code
- Modify, adapt, or create derivative works
- Sell, sublicense, or commercially exploit the code
- Reverse engineer or decompile the code

See [LICENSE](./LICENSE) for full legal terms.
