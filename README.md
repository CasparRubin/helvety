# Helvety Store

![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19.2.4-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![License](https://img.shields.io/badge/License-All%20Rights%20Reserved-red?style=flat-square)

Your one-stop shop for Helvety software and subscriptions. Browse and purchase official Helvety products designed in Switzerland.

**Store:** [store.helvety.com](https://store.helvety.com)

## Navigation

The store has four main sections, linked from the store nav bar (below the top navbar) and from the profile dropdown in the top navbar on helvety.com and store.helvety.com (when signed in; shows your email and links to Products, Account, Subscriptions, Tenants, and Sign out):

- **Products** (`/products`) – Product catalog with filters; product detail at `/products/[slug]`
- **Account** (`/account`) – Profile and account settings
- **Subscriptions** (`/subscriptions`) – Compact list of active subscriptions; SPO Explorer rows link to Tenants
- **Tenants** (`/tenants`) – Register and manage SharePoint tenant IDs for SPO Explorer

The root path (`/`) redirects all users to `/products`. No login is required to browse products.

**Legal Pages:** Privacy Policy, Terms of Service, and Impressum are hosted centrally on [helvety.com](https://helvety.com) and linked in the site footer.

## Features

- **Product Catalog** - Browse Helvety software products with detailed descriptions and pricing
- **Stripe Integration** - Secure subscription and one-time payment processing via Stripe Checkout. Before every purchase, a consent dialog is shown with two sections: (1) Terms & policy — links to Terms of Service and Privacy Policy plus a confirmation checkbox; (2) Digital content consent — EU withdrawal notice plus consent checkbox. Both confirmations are required on each purchase and are not saved.
- **Multi-App Support** - One user profile with subscriptions that work across all Helvety apps
- **Account Management** - Profile and account settings (Account page)
- **Subscription Management** - Compact list to view, cancel, or reactivate subscriptions; SPO Explorer subscriptions link to the Tenants page
- **Tenant Management** - Register SharePoint tenant IDs for SPO Explorer (Tenants page: compact subscription summary, Registered Tenants list with Add Tenant above it)
- **Download Management** - Access and download purchased software packages
- **License Validation** - API for validating tenant licenses per product (supports multi-product licensing)
- **Dark & Light mode** - Comfortable viewing in any lighting condition
- **App Switcher** - Navigate between Helvety ecosystem apps (Home, Auth, Store, PDF, Tasks)

## Security & Authentication

### Authentication Flow

Authentication is handled by the centralized Helvety Auth service (`auth.helvety.com`) using **email + passkey authentication** — no passwords required. **Login is optional for browsing** — users can view products without an account. Login is required for purchases, account management, subscriptions, and tenant management.

**New Users (when signing in):**

1. Click "Sign in" → Redirected to auth.helvety.com → Enter email address
2. Click magic link in email → Verify email ownership
3. Scan QR code with phone → Verify with biometrics (Face ID/fingerprint)
4. Passkey created → Verify passkey → Session established → Redirected back to store

**Returning Users (when signing in):**

1. Click "Sign in" → Redirected to auth.helvety.com → Enter email address
2. Sign in with passkey (no email sent; existing users with a passkey skip the magic link)
3. Scan QR code → Verify with biometrics → Session created
4. Redirected back to store

Sessions are shared across all `*.helvety.com` subdomains via cookie-based SSO.

**Privacy Note:** Your email address is used solely for authentication (magic links for new users, passkey for returning) and account recovery. We do not share your email with third parties for marketing purposes.

**Note:** End-to-end encryption is not used in this app. E2EE is only used by [Helvety Tasks](https://tasks.helvety.com).

### Security Hardening

This application implements comprehensive security hardening:

- **Session Management** - Session validation and refresh via `proxy.ts` using `getClaims()` (local JWT validation; Auth API only when refresh is needed)
- **Server Layout Guards** - Authentication checks in Server Components via `lib/auth-guard.ts` (CVE-2025-29927 compliant)
- **Redirect URI Validation** - All redirect URIs validated against allowlist via `lib/redirect-validation.ts` to prevent open redirect attacks
- **CSRF Protection** - Token-based protection for state-changing operations
- **Rate Limiting** - Protection against brute force attacks
- **Idle Timeout** - Automatic session expiration after 30 minutes of inactivity
- **Audit Logging** - Structured logging for authentication and encryption events
- **Security Headers** - CSP, HSTS, and other security headers

## Tech Stack

This project is built with modern web technologies:

- **[Next.js 16.1.6](https://nextjs.org/)** - React framework with App Router
- **[React 19.2.4](https://react.dev/)** - UI library
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript with strict configuration
- **[Supabase](https://supabase.com/)** - Backend-as-a-Service (Auth & Database)
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[shadcn/ui](https://ui.shadcn.com/)** - High-quality React component library
- **[Radix UI](https://www.radix-ui.com/)** - Unstyled, accessible component primitives
- **[Lucide React](https://lucide.dev/)** - Icon library
- **[Zod](https://zod.dev/)** - TypeScript-first schema validation
- **[next-themes](https://github.com/pacocoursey/next-themes)** - Dark mode support
- **[Stripe](https://stripe.com/)** - Payment processing and subscription management

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

**Purchasing a subscription grants access to use the hosted service at [store.helvety.com](https://store.helvety.com) only.** Subscriptions do not grant any rights to the source code.

See [LICENSE](./LICENSE) for full legal terms.
