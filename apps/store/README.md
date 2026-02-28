# Helvety Store

![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19.2.4-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![License](https://img.shields.io/badge/License-All%20Rights%20Reserved-red?style=flat-square)

Official Helvety Store. Products and services engineered & designed in Switzerland.

**Store:** [helvety.com/store](https://helvety.com/store)

> **Part of the [Helvety monorepo](https://github.com/CasparRubin/helvety).** This app lives in `apps/store/`. See the root README for monorepo setup instructions.

## Service Availability

Helvety services are currently focused on customers located in Switzerland. We do not actively market services to users in the EU/EEA.

Helvety's legal baseline is Swiss data protection law (nDSG). Account-based services ask new users to confirm Switzerland-based usage during account creation on [helvety.com/auth](https://helvety.com/auth) before a new account is created.

## Navigation

The store has four main sections, linked from the store nav bar (below the top navbar). The profile dropdown in the top navbar (when signed in) shows your email and links to Account, Subscriptions, and Sign out:

- **Products** (`/products`) - Product catalog with filters (All, SaaS, Software); product detail at `/products/[slug]`. Lists both free products (Helvety PDF, Helvety Tasks, Helvety Contacts) and paid subscriptions (Helvety SPO Explorer)
- **Account** (`/account`) - Profile and account settings
- **Subscriptions** (`/subscriptions`) - Compact list of active subscriptions; SPO Explorer rows link to Tenants
- **Tenants** (`/tenants`) - Register and manage SharePoint tenant IDs for SPO Explorer

The root path (`/`) redirects all users to `/products`. No login is required to browse products.

**Legal Pages:** Privacy Policy, Terms of Service, and Impressum are hosted centrally on [helvety.com](https://helvety.com) and linked in the site footer. Services are primarily intended for customers in Switzerland, and account-based services ask new users to confirm Switzerland-based usage during account creation on [helvety.com/auth](https://helvety.com/auth) (before a new account is created). The legal baseline is Swiss data protection law (nDSG), and where other mandatory law applies in a specific case, Helvety follows those obligations. An informational cookie notice explains essential cookies and privacy-focused telemetry (Vercel Analytics and Speed Insights). A pre-checkout consent dialog records acceptance of the Terms of Service and Privacy Policy.

**Abuse Reporting:** Abuse reports can be submitted to [contact@helvety.com](mailto:contact@helvety.com). The Impressum on [helvety.com/impressum](https://helvety.com/impressum#abuse) includes an abuse reporting section with guidance for both users and law enforcement.

## Features

- **Product Catalog** - Browse all Helvety products: currently free tools (Helvety PDF), early-access SaaS offers (Helvety Tasks, Helvety Contacts), and paid subscriptions (Helvety SPO Explorer)
- **Stripe Integration** - Subscription and one-time payment processing via Stripe Checkout (currently CHF). Before each purchase, a consent dialog requires acceptance of the Terms of Service and Privacy Policy. Consent is requested for each purchase and is not persisted in the checkout dialog state.
- **Multi-App Support** - One user profile with subscriptions that work across all Helvety apps
- **Account Management** - Profile and account settings (Account page)
- **Subscription Management** - Compact list to view, cancel, or reactivate subscriptions; SPO Explorer subscriptions link to the Tenants page
- **Tenant Management** - Register SharePoint tenant IDs for SPO Explorer (Tenants page: compact subscription summary, Registered Tenants list with Add Tenant above it)
- **Download Management** - Access and download purchased software packages
- **License Validation** - API for validating tenant licenses per product (supports multi-product licensing; optional HMAC-signed machine-to-machine mode available)
- **Self-Service Account Deletion** - Delete your account from the Account page with a confirmation dialog; active Stripe subscriptions are canceled, account-linked data is removed across services, and storage cleanup includes orphan-path sweeps plus post-delete verification checks (target completion within 30 days, subject to legal retention)
- **Self-Service Data Export** - Export your profile, subscription history, purchase history, and tenant registrations as a JSON file from the Account page (designed to support nDSG Art. 28 data portability requests)
- **Consent Audit Trail** - For completed checkout sessions, pre-checkout consent (Terms of Service & Privacy Policy acceptance) is recorded in Stripe session metadata; for signed-in checkouts, consent is also recorded in a dedicated `consent_events` database table. Consent/contract evidence may be retained up to 10 years where legally required, with direct user linkage minimized after account deletion where applicable
- **Dark & Light mode** - Switch between dark and light themes
- **App Switcher** - Navigate between Helvety ecosystem apps (Home, Auth, Store, PDF, Tasks, Contacts)

## Security & Authentication

### Authentication Flow

Authentication is handled by the centralized Helvety Auth service (`helvety.com/auth`) using **email + passkey authentication** with no passwords required. **Login is optional for browsing** and users can view products without an account. Login is required for purchases, account management, subscriptions, and tenant management.

**New Users (when signing in):**

1. Click "Sign in" → Redirected to helvety.com/auth → Enter email address
2. Enter verification code from email → Verify email ownership → Session established
3. Complete passkey setup with biometrics (on mobile: on this device; on desktop: scan QR code with your phone)
4. Passkey created → Redirected back to store

**Returning Users (when signing in):**

1. Click "Sign in" → Redirected to helvety.com/auth → Enter email address
2. Sign in with passkey (no email sent; existing users with a passkey skip email verification)
3. Sign in with biometrics (on mobile: on this device; on desktop: scan QR code with your phone) → Session created
4. Redirected back to store

Sessions are shared across all Helvety apps via cookie-based SSO (all apps are served under `helvety.com` via path-based routing).

**Privacy Note:** Your email address is used primarily for authentication (verification codes for new users, passkey for returning), account recovery, and essential service communications. We do not share your email with third parties for marketing purposes, except where required by law or described in our Privacy Policy.

### Security Hardening

This application includes the following security hardening:

- **Session Management** - Session validation and refresh via `proxy.ts` using `getClaims()` (local JWT validation; Auth API only when refresh is needed; wrapped in try/catch for resilience against transient network failures)
- **Server-side Page Guards** - Authentication checks in page-level Server Components via `@helvety/shared/auth-guard` with retry logic for transient failures (aligned with published CVE-2025-29927 mitigation guidance)
- **Redirect URI Validation** - All redirect URIs validated against allowlist via `@helvety/shared/redirect-validation` to prevent open redirect attacks
- **CSRF Protection** - Token-based protection is enforced on high-impact browser-initiated mutations; server-to-server webhook endpoints use Stripe signature verification instead of CSRF tokens
- **Rate Limiting** - Protection against brute force attacks
- **Security Headers** - CSP, HSTS, and other security headers
- **RLS Write Boundaries (Billing Data)** - `public.purchases` allows user-scoped `SELECT` only; direct authenticated `INSERT/UPDATE/DELETE` are denied by active RLS policies. Any purchase writes must run through privileged server-side flows using the Supabase service-role client.
- **RLS Delete Boundaries (Profiles)** - `public.user_profiles` direct authenticated `DELETE` is explicitly denied. Profile row removal is handled by `ON DELETE CASCADE` from `auth.users` during account deletion flows.

## Environment Variables

Copy `env.template` to `.env.local` and fill in values. All `NEXT_PUBLIC_*` vars are exposed to the client; others are server-only.

| Variable                                                 | Required | Server-only | Description                                                                            |
| -------------------------------------------------------- | -------- | ----------- | -------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`                               | Yes      | No          | Supabase project URL                                                                   |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`                   | Yes      | No          | Publishable key (RLS applies)                                                          |
| `SUPABASE_SECRET_KEY`                                    | Yes      | **Yes**     | Service role key for server-side admin operations (bypasses RLS). Must not be exposed. |
| `STRIPE_SECRET_KEY`                                      | Yes      | **Yes**     | Stripe API key. Must not be exposed.                                                   |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`                     | Yes      | No          | Stripe publishable key (client-side)                                                   |
| `STRIPE_WEBHOOK_SECRET`                                  | Yes      | **Yes**     | Webhook signature verification. Must not be exposed.                                   |
| `STRIPE_HELVETY_SPO_EXPLORER_SOLO_MONTHLY_PRICE_ID`      | Yes      | **Yes**     | Stripe Price ID for SPO Explorer Solo monthly tier (`price_*`).                        |
| `STRIPE_HELVETY_SPO_EXPLORER_SUPPORTED_MONTHLY_PRICE_ID` | Yes      | **Yes**     | Stripe Price ID for SPO Explorer Supported monthly tier (`price_*`).                   |
| `LICENSE_VALIDATION_SHARED_SECRET`                       | No       | **Yes**     | Optional shared secret for signed server-to-server license validation calls.           |
| `UPSTASH_REDIS_REST_URL`                                 | Yes      | **Yes**     | Redis URL for rate limiting. Required by startup validation in all environments.       |
| `UPSTASH_REDIS_REST_TOKEN`                               | Yes      | **Yes**     | Redis token for rate limiting. Required by startup validation in all environments.     |

> **Note:** App URLs are derived from `NODE_ENV` in `packages/shared/src/config.ts` — no URL env vars needed. Make sure your production URL (`https://helvety.com`) is in your Supabase Redirect URLs allowlist (Supabase Dashboard > Authentication > URL Configuration > Redirect URLs).
>
> **Auth stack note:** This app does not use NextAuth/Auth.js; do not set `NEXTAUTH_SECRET`/`AUTH_SECRET` for this project.
>
> **License signing note:** Browser clients (including the SPO Explorer SPFx extension) call `/api/license/validate` without a shared secret. `LICENSE_VALIDATION_SHARED_SECRET` should only be configured when a trusted backend signs requests.

## Tech Stack

This project is built with modern web technologies:

- **[Next.js 16.x](https://nextjs.org/)** - React framework with App Router
- **[React 19.x](https://react.dev/)** - UI library
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript with strict configuration
- **[Supabase](https://supabase.com/)** - Backend-as-a-Service (Database; auth is centralized at [helvety.com/auth](https://helvety.com/auth))
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first CSS framework
- **[shadcn/ui](https://ui.shadcn.com/)** - High-quality React component library
- **[Radix UI](https://www.radix-ui.com/)** - Unstyled, accessible component primitives
- **[Lucide React](https://lucide.dev/)** - Icon library
- **[Zod 4](https://zod.dev/)** - TypeScript-first schema validation
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

This monorepo is public so users can inspect the code and independently assess application behavior and security posture.

**All Rights Reserved.** No license is granted for any use of this code. You may:

- View and inspect the code

You may NOT:

- Copy, use, or reuse the code in any form
- Redistribute, publish, or share the code
- Modify, adapt, or create derivative works
- Sell, sublicense, or commercially exploit the code
- Reverse engineer or decompile the code

**Using Helvety products (whether free or via subscription) grants access to the hosted service at [helvety.com](https://helvety.com) only.** Neither free access nor paid subscriptions grant any rights to the source code.

See [LICENSE](./LICENSE) for full legal terms.
