# Helvety Store

![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19.2.4-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![License](https://img.shields.io/badge/License-All%20Rights%20Reserved-red?style=flat-square)

Official Helvety Store. Software and subscriptions engineered & designed in Switzerland.

**Store:** [store.helvety.com](https://store.helvety.com)

> **Part of the [Helvety monorepo](https://github.com/CasparRubin/helvety).** This app lives in `apps/store/`. See the root README for monorepo setup instructions.

## Service Availability

Helvety services are intended exclusively for customers located in Switzerland. **We are not able to serve customers in the EU/EEA.**

As a Swiss company, Helvety operates solely under the Swiss Federal Act on Data Protection (nDSG). Because we do not target or serve customers in the EU/EEA, the GDPR does not apply. For this reason, new users are asked to confirm during account creation on [auth.helvety.com](https://auth.helvety.com) that they are located in Switzerland before any personal data is stored.

## Navigation

The store has four main sections, linked from the store nav bar (below the top navbar). The profile dropdown in the top navbar (when signed in) shows your email and links to Account, Subscriptions, and Sign out:

- **Products** (`/products`) - Product catalog with filters; product detail at `/products/[slug]`
- **Account** (`/account`) - Profile and account settings
- **Subscriptions** (`/subscriptions`) - Compact list of active subscriptions; SPO Explorer rows link to Tenants
- **Tenants** (`/tenants`) - Register and manage SharePoint tenant IDs for SPO Explorer

The root path (`/`) redirects all users to `/products`. No login is required to browse products.

**Legal Pages:** Privacy Policy, Terms of Service, and Impressum are hosted centrally on [helvety.com](https://helvety.com) and linked in the site footer. Services are exclusively available to customers in Switzerland and are not offered to EU/EEA residents; new users must confirm they are located in Switzerland during account creation on [auth.helvety.com](https://auth.helvety.com) (before any personal data is stored). Only the Swiss Federal Act on Data Protection (nDSG) applies; the GDPR does not apply. An informational cookie notice informs visitors that only essential cookies are used. A pre-checkout consent dialog records acceptance of the Terms of Service and Privacy Policy.

**Abuse Reporting:** Abuse reports can be submitted to [contact@helvety.com](mailto:contact@helvety.com). The Impressum on [helvety.com/impressum](https://helvety.com/impressum#abuse) includes an abuse reporting section with guidance for both users and law enforcement.

## Features

- **Product Catalog** - Browse Helvety software products with detailed descriptions and pricing
- **Stripe Integration** - Secure subscription and one-time payment processing via Stripe Checkout (CHF only). Before every purchase, a consent dialog requires acceptance of the Terms of Service and Privacy Policy. Consent is required on each purchase and is not cached.
- **Multi-App Support** - One user profile with subscriptions that work across all Helvety apps
- **Account Management** - Profile and account settings (Account page)
- **Subscription Management** - Compact list to view, cancel, or reactivate subscriptions; SPO Explorer subscriptions link to the Tenants page
- **Tenant Management** - Register SharePoint tenant IDs for SPO Explorer (Tenants page: compact subscription summary, Registered Tenants list with Add Tenant above it)
- **Download Management** - Access and download purchased software packages
- **License Validation** - API for validating tenant licenses per product (supports multi-product licensing; optional HMAC-signed machine-to-machine mode available)
- **Self-Service Account Deletion** - Delete your account from the Account page with a confirmation dialog; immediately cancels active Stripe subscriptions and permanently removes all user data via cascade deletes
- **Self-Service Data Export** - Export your profile, subscription history, purchase history, and tenant registrations as a JSON file from the Account page (nDSG Art. 28 compliance)
- **Consent Audit Trail** - Pre-checkout consent (Terms of Service & Privacy Policy acceptance) is recorded in both Stripe session metadata and a dedicated `consent_events` database table for audit compliance
- **Dark & Light mode** - Switch between dark and light themes
- **App Switcher** - Navigate between Helvety ecosystem apps (Home, Auth, Store, PDF, Tasks, Contacts)

## Security & Authentication

### Authentication Flow

Authentication is handled by the centralized Helvety Auth service (`auth.helvety.com`) using **email + passkey authentication** with no passwords required. **Login is optional for browsing** and users can view products without an account. Login is required for purchases, account management, subscriptions, and tenant management.

**New Users (when signing in):**

1. Click "Sign in" → Redirected to auth.helvety.com → Enter email address
2. Enter verification code from email → Verify email ownership
3. Scan QR code with phone → Verify with biometrics (Face ID/fingerprint)
4. Passkey created → Verify passkey → Session established → Redirected back to store

**Returning Users (when signing in):**

1. Click "Sign in" → Redirected to auth.helvety.com → Enter email address
2. Sign in with passkey (no email sent; existing users with a passkey skip email verification)
3. Scan QR code → Verify with biometrics → Session created
4. Redirected back to store

Sessions are shared across all `*.helvety.com` subdomains via cookie-based SSO.

**Privacy Note:** Your email address is used solely for authentication (verification codes for new users, passkey for returning) and account recovery. We do not share your email with third parties for marketing purposes.

### Security Hardening

This application includes the following security hardening:

- **Session Management** - Session validation and refresh via `proxy.ts` using `getClaims()` (local JWT validation; Auth API only when refresh is needed; wrapped in try/catch for resilience against transient network failures)
- **Server Layout Guards** - Authentication checks in Server Components via `lib/auth-guard.ts` with retry logic for transient failures (CVE-2025-29927 compliant)
- **Redirect URI Validation** - All redirect URIs validated against allowlist via `lib/redirect-validation.ts` to prevent open redirect attacks
- **CSRF Protection** - Token-based protection for state-changing operations
- **Rate Limiting** - Protection against brute force attacks
- **Security Headers** - CSP, HSTS, and other security headers

## Environment Variables

Copy `env.template` to `.env.local` and fill in values. All `NEXT_PUBLIC_*` vars are exposed to the client; others are server-only.

| Variable                               | Required | Server-only | Description                                   |
| -------------------------------------- | -------- | ----------- | --------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Yes      | No          | Supabase project URL                          |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes      | No          | Anon key (RLS applies)                        |
| `SUPABASE_SECRET_KEY`                  | Yes      | **Yes**     | Service role key; bypasses RLS. Never expose. |
| `NEXT_PUBLIC_*` URLs                   | No       | No          | Cross-app URLs; have sensible defaults        |
| `STRIPE_SECRET_KEY`                    | Yes      | **Yes**     | Stripe API key. Never expose.                 |
| `STRIPE_WEBHOOK_SECRET`                | Yes      | **Yes**     | Webhook signature verification. Never expose. |
| `UPSTASH_REDIS_REST_URL`               | Prod     | **Yes**     | Redis URL for rate limiting. Prod: required.  |
| `UPSTASH_REDIS_REST_TOKEN`             | Prod     | **Yes**     | Redis token. Prod: required.                  |

> **Note:** Make sure `NEXT_PUBLIC_APP_URL` is in your Supabase Redirect URLs allowlist (Supabase Dashboard > Authentication > URL Configuration > Redirect URLs).

## Tech Stack

This project is built with modern web technologies:

- **[Next.js 16.1.6](https://nextjs.org/)** - React framework with App Router
- **[React 19.2.4](https://react.dev/)** - UI library
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript with strict configuration
- **[Supabase](https://supabase.com/)** - Backend-as-a-Service (Database; auth is centralized at [auth.helvety.com](https://auth.helvety.com))
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first CSS framework
- **[shadcn/ui](https://ui.shadcn.com/)** - High-quality React component library
- **[Radix UI](https://www.radix-ui.com/)** - Unstyled, accessible component primitives
- **[Lucide React](https://lucide.dev/)** - Icon library
- **[Zod](https://zod.dev/)** - TypeScript-first schema validation
- **[next-themes](https://github.com/pacocoursey/next-themes)** - Dark mode support
- **[Stripe](https://stripe.com/)** - Payment processing and subscription management

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

Vercel Analytics and Vercel Speed Insights are used across all Helvety apps for privacy-focused, anonymous page view and performance statistics. See our [Privacy Policy](https://helvety.com/privacy) for details.

For questions or inquiries, please contact us at [contact@helvety.com](mailto:contact@helvety.com). To report abuse, contact [contact@helvety.com](mailto:contact@helvety.com).

## License & Usage

> **This is NOT open source software.**

This monorepo is public so users can inspect and verify the application's behavior and security.

**All Rights Reserved.** No license is granted for any use of this code. You may:

- View and inspect the code

You may NOT:

- Copy, use, or reuse the code in any form
- Redistribute, publish, or share the code
- Modify, adapt, or create derivative works
- Sell, sublicense, or commercially exploit the code
- Reverse engineer or decompile the code

**Purchasing a subscription grants access to use the hosted service at [store.helvety.com](https://store.helvety.com) only.** Subscriptions do not grant any rights to the source code.

See [LICENSE](./LICENSE) for full legal terms.
