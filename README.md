# Helvety.com

![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19.2.4-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![License](https://img.shields.io/badge/License-All%20Rights%20Reserved-red?style=flat-square)

The main Helvety website. Swiss Engineering.

**Website:** [helvety.com](https://helvety.com)

## Features

- **App Switcher** - Navigate between Helvety ecosystem apps (Home, Auth, Store, PDF, Tasks)
- **Sign in** - Sign in when not authenticated (centralized auth)
- **Profile menu** - When signed in: user email, links to Store (Account, Subscriptions), Sign out
- **Dark & Light mode** - Comfortable viewing in any lighting condition
- **Legal pages** - Privacy Policy, Terms of Service, and Impressum are hosted centrally on [helvety.com](https://helvety.com) and linked in the site footer. Services are exclusively available to customers in Switzerland and are not offered to EU/EEA residents; a geo-restriction confirmation dialog is displayed once per browser session (cached in sessionStorage; cleared when the tab or browser is closed). Only the Swiss Federal Act on Data Protection (nDSG) applies; the GDPR does not apply.
- **Cookie notice** - Informational banner about essential cookies only (Swiss nDSG / FMG compliant); no consent collected
- **SEO optimized** - Sitemap and robots.txt for search engine visibility
- **Animated logo** - Subtle glow effect on the main logo

## Security Features

This application implements comprehensive security hardening:

- **Session Management** - Session validation and refresh via `proxy.ts` using `getClaims()` (local JWT validation; Auth API only when refresh is needed)
- **Server Layout Guards** - Authentication checks in Server Components via `lib/auth-guard.ts` (CVE-2025-29927 compliant)
- **Redirect URI Validation** - All redirect URIs validated against allowlist via `lib/redirect-validation.ts` to prevent open redirect attacks
- **CSRF Protection** - Token-based protection with timing-safe comparison for state-changing operations
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
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first CSS framework
- **[shadcn/ui](https://ui.shadcn.com/)** - High-quality React component library
- **[Radix UI](https://www.radix-ui.com/)** - Unstyled, accessible component primitives
- **[Lucide React](https://lucide.dev/)** - Icon library
- **[Framer Motion](https://www.framer.com/motion/)** - Animation library
- **[next-themes](https://github.com/pacocoursey/next-themes)** - Dark mode support

## Developer

This application is developed and maintained by [Helvety](https://helvety.com), a Swiss company committed to transparency, strong security, and respect for user privacy and data protection.

Vercel Analytics is used across all Helvety apps for privacy-focused, anonymous page view statistics. Vercel Speed Insights is enabled only on [helvety.com](https://helvety.com). See our [Privacy Policy](https://helvety.com/privacy) for details.

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
