# Helvety.com

![Next.js](https://img.shields.io/badge/Next.js-16.x-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19.x-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

The main Helvety website. Engineered, Designed & Made in Switzerland. Software & Apparel. Private, simple, clean.

**Website:** [helvety.com](https://helvety.com)

> **Part of the [Helvety monorepo](https://github.com/CasparRubin/helvety).** This app lives in `apps/web/`. See the root README for monorepo setup instructions.

## Service Availability

Helvety services are primarily intended for customers in Switzerland. Sign-in for account-based services includes a confirmation that the user is not located in the EU/EEA before verification-code delivery, but technical access from outside Switzerland may still occur. Mandatory law in other jurisdictions may still apply in specific cases.

Helvety's legal baseline is Swiss data protection law (nDSG). Account-based services collect this non-EU/EEA location-attestation signal during sign-in on [helvety.com/auth](https://helvety.com/auth).

## Features

- **App Switcher** - Navigate between Helvety ecosystem apps (Home, Auth, Store, PDF, Tasks, Contacts, Notes). Downloadable extensions (SharePoint packages, browser ZIPs) are listed on the Store.
- **Sign in** - Sign in when not authenticated (centralized auth)
- **Profile menu** - When signed in: user email, links to Store Account, Sign out
- **Dark & Light mode** - Switch between dark and light themes
- **Legal pages** - Privacy Policy, Terms of Service, and Impressum are hosted centrally on [helvety.com](https://helvety.com) and linked in the site footer. Services are primarily intended for customers in Switzerland, and account-based services collect a non-EU/EEA location-attestation signal during sign-in on [helvety.com/auth](https://helvety.com/auth). The legal baseline is Swiss data protection law (nDSG), and where other mandatory law applies in a specific case, Helvety follows those obligations.
- **Abuse reporting** - The Impressum includes an abuse reporting section ([helvety.com/impressum#abuse](https://helvety.com/impressum#abuse)) with guidance for users and law enforcement. Abuse contact: [contact@helvety.com](mailto:contact@helvety.com).
- **Cookie notice** - Informational notice in the footer about essential cookies; analytics and performance telemetry usage is documented in the Privacy Policy
- **SEO optimized** - Sitemap and robots.txt for search engine visibility
- **Animated logo** - Subtle glow effect on the main logo

## Multi-Zone Routing Notes

- Sub-apps are forwarded by gateway rewrites in `apps/web/next.config.ts`.
- Use wildcard segment patterns (prefer `:path*`) for zone forwarding rules so App Router Flight/RSC prefetch requests (`?_rsc=...`) and trailing-slash variants are forwarded consistently.
- Keep wildcard usage consistent across zones (`auth`, `tasks`, `contacts`, `notes`, `store`, `pdf`) and include each zone's static asset prefix routes (`/auth-static`, `/tasks-static`, `/contacts-static`, `/notes-static`) to avoid stale bundles or edge-case misses.

## Security Features

This application includes the following security hardening:

- **Session Management** - `proxy.ts` performs lightweight request setup (headers/CSP and, when Supabase session cookies are present on matched routes, cookie refresh). The web app is primarily public-facing; strict auth enforcement for protected data/actions is handled in the app-specific zones (`/auth`, `/store`, `/tasks`, `/contacts`, `/notes`).
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
| `NOTES_URL`                            | Prod     | **Yes**     | Internal Vercel URL for Notes app (gateway rewrite target)    |

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

Run these commands from `apps/web`:

| Script                  | Description                       |
| ----------------------- | --------------------------------- |
| `bun run test`          | Run all tests once                |
| `bun run test:watch`    | Run tests in watch mode           |
| `bun run test:coverage` | Run tests with v8 coverage report |

Test files follow the `**/*.test.{ts,tsx}` pattern and live next to the source they test.

## Developer

This application is developed and maintained by [Helvety](https://helvety.com), a Swiss sole proprietorship (Einzelfirma) focused on security and user privacy.

Vercel Analytics is used across Helvety apps for privacy-oriented, aggregated/pseudonymized usage metrics. Vercel Speed Insights is currently enabled on [helvety.com](https://helvety.com) for performance telemetry. See our [Privacy Policy](https://helvety.com/privacy) for details.

For questions or inquiries, please contact us at [contact@helvety.com](mailto:contact@helvety.com). To report abuse, contact [contact@helvety.com](mailto:contact@helvety.com).

## License & Usage

This app is open source under the [MIT License](./LICENSE).

You may use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of this software, provided the copyright and permission notice are
included in substantial portions of the software.

The software is provided "as is", without warranty of any kind. See
[LICENSE](./LICENSE) for full legal terms.
