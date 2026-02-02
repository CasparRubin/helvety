# Helvety Store

![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19.2.4-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![License](https://img.shields.io/badge/License-All%20Rights%20Reserved-red?style=flat-square)

Your one-stop shop for Helvety software and subscriptions. Browse and purchase official Helvety products designed in Switzerland.

**Store:** [store.helvety.com](https://store.helvety.com)

## Features

- **Product Catalog** - Browse Helvety software products with detailed descriptions and pricing
- **Stripe Integration** - Secure subscription and one-time payment processing via Stripe Checkout
- **Subscription Management** - Manage active subscriptions, cancel, or reactivate
- **Multi-App Support** - One user profile with subscriptions that work across all Helvety apps
- **Account Management** - Manage your tenants, software downloads, and profile settings
- **Tenant Management** - Register SharePoint tenant IDs for SPO Explorer licensing
- **Download Management** - Access and download purchased software packages
- **License Validation** - API for validating tenant licenses per product (supports multi-product licensing)
- **Dark & Light mode** - Comfortable viewing in any lighting condition
- **App Switcher** - Navigate between Helvety ecosystem apps

**Legal Pages:** Privacy Policy, Terms of Service, and Impressum are hosted centrally on [helvety.com](https://helvety.com) and linked from the navbar.

## Security & Authentication

This application uses centralized authentication via [auth.helvety.com](https://auth.helvety.com) with end-to-end encryption:

### Authentication Flow

Authentication is handled by the centralized Helvety Auth service (`auth.helvety.com`) using **email + passkey authentication** — no passwords required:

**New Users:**

1. Redirected to auth.helvety.com → Enter email address
2. Click magic link in email → Verify email ownership
3. Scan QR code with phone → Verify with biometrics (Face ID/fingerprint)
4. Passkey created → Verify passkey → Session established → Redirected back to store
5. Setup encryption passkey (for encrypting sensitive data)

**Returning Users:**

1. Redirected to auth.helvety.com → Enter email address
2. Click magic link in email → Verify email ownership
3. Scan QR code → Verify with biometrics → Session created
4. Redirected back → Unlock encryption with passkey

Sessions are shared across all `*.helvety.com` subdomains via cookie-based SSO.

**Privacy Note:** Your email address is used solely for authentication (magic links) and account recovery. We do not share your email with third parties for marketing purposes.

### End-to-End Encryption

User data is protected with client-side encryption using the WebAuthn PRF extension:

- **Centralized Setup** - Encryption is set up once via `auth.helvety.com` after initial passkey registration
- **Passkey-derived keys** - Encryption keys are derived from your passkey using the PRF extension
- **Zero-knowledge** - The server never sees your encryption key; all encryption/decryption happens in the browser
- **Device-bound security** - Your passkey (stored on your phone) is the only way to decrypt your data
- **Cross-subdomain passkeys** - Encryption passkeys work across all Helvety apps (registered to `helvety.com` RP ID)
- **Unlock Flow** - When returning, users unlock encryption with their existing passkey

Browser requirements for encryption:

- Chrome 128+
- Edge 128+
- Safari 18+
- Firefox 139+ (desktop only)

**Note:** Firefox for Android does not support the PRF extension.

### Security Hardening

This application implements comprehensive security hardening:

- **Session Management** - Automatic session refresh via `proxy.ts` (Next.js 16 pattern)
- **Server Layout Guards** - Authentication checks in Server Components (CVE-2025-29927 compliant)
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
- **[SimpleWebAuthn](https://simplewebauthn.dev/)** - WebAuthn/passkey implementation
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[shadcn/ui](https://ui.shadcn.com/)** - High-quality React component library
- **[Radix UI](https://www.radix-ui.com/)** - Unstyled, accessible component primitives
- **[Lucide React](https://lucide.dev/)** - Icon library
- **[Zod](https://zod.dev/)** - TypeScript-first schema validation
- **[next-themes](https://github.com/pacocoursey/next-themes)** - Dark mode support
- **[Stripe](https://stripe.com/)** - Payment processing and subscription management
- **[Vitest](https://vitest.dev/)** - Unit and integration testing
- **[Playwright](https://playwright.dev/)** - End-to-end testing

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

**Purchasing a subscription grants access to use the hosted service at [store.helvety.com](https://store.helvety.com) only.** Subscriptions do not grant any rights to the source code.

See [LICENSE](./LICENSE) for full legal terms.
