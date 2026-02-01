# Helvety Store

![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19.2.4-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![License](https://img.shields.io/badge/License-All%20Rights%20Reserved-red?style=flat-square)

Your one-stop shop for Helvety software, subscriptions, and apparel. Browse and purchase official Helvety products designed in Switzerland.

**Store:** [store.helvety.com](https://store.helvety.com)

## Features

- **Product Catalog** - Browse Helvety software products with detailed descriptions and pricing
- **Stripe Integration** - Secure subscription and one-time payment processing via Stripe Checkout
- **Subscription Management** - Manage active subscriptions, cancel, or reactivate
- **Multi-App Support** - One user profile with subscriptions that work across all Helvety apps
- **Dashboard** - Manage your tenants and software downloads
- **Tenant Management** - Register SharePoint tenant IDs for SPO Explorer licensing
- **Download Management** - Access and download purchased software packages
- **License Validation** - API for validating tenant licenses per product (supports multi-product licensing)
- **Dark & Light mode** - Comfortable viewing in any lighting condition
- **App Switcher** - Navigate between Helvety ecosystem apps

## Security & Authentication

This application uses centralized authentication via [auth.helvety.com](https://auth.helvety.com) with end-to-end encryption:

### Authentication Flow

Authentication is handled by the centralized Helvety Auth service (`auth.helvety.com`) using **passkey-only authentication** — no email or password required:

**New Users:**

1. Redirected to auth.helvety.com → Click "Create Account"
2. Scan QR code with phone → Verify with biometrics (Face ID/fingerprint)
3. Account created → Session established → Redirected back to store
4. Setup encryption passkey (for encrypting sensitive data)

**Returning Users:**

1. Redirected to auth.helvety.com → Click "Sign In"
2. Scan QR code → Verify with biometrics → Session created
3. Redirected back → Unlock encryption with passkey

Sessions are shared across all `*.helvety.com` subdomains via cookie-based SSO.

**Privacy Note:** Helvety accounts do not require an email address. When you make a purchase, your email and billing information is collected by Stripe, not stored by Helvety.

### End-to-End Encryption

User data is protected with client-side encryption using the WebAuthn PRF extension:

- **Passkey-derived keys** - Encryption keys are derived from your passkey using the PRF extension
- **Zero-knowledge** - The server never sees your encryption key; all encryption/decryption happens in the browser
- **Device-bound security** - Your passkey (stored on your phone) is the only way to decrypt your data
- **Cross-subdomain passkeys** - Encryption passkeys work across all Helvety apps (registered to `helvety.com` RP ID)

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

## Project Structure

```
helvety-store/
├── app/                        # Next.js App Router
│   ├── actions/                # Server actions
│   │   ├── auth-actions.ts     # Authentication response types
│   │   ├── download-actions.ts # Software download management
│   │   ├── encryption-actions.ts # Encryption parameter management
│   │   ├── encryption-passkey-actions.ts # Passkey operations for encryption
│   │   ├── subscription-actions.ts # Subscription management
│   │   └── tenant-actions.ts   # Tenant registration for licensing
│   ├── api/                    # API routes
│   │   ├── checkout/           # Stripe Checkout session creation
│   │   ├── downloads/          # Software package downloads
│   │   │   └── [packageId]/    # Dynamic download routes
│   │   ├── license/            # License validation
│   │   │   └── validate/       # Tenant license validation endpoint
│   │   ├── subscriptions/      # User subscription queries
│   │   ├── tenants/            # Tenant management
│   │   │   └── [id]/           # Individual tenant operations
│   │   └── webhooks/stripe/    # Stripe webhook handler
│   ├── auth/                   # Auth routes
│   │   └── callback/           # Session establishment callback
│   ├── dashboard/              # User dashboard
│   │   ├── downloads/          # Download management page
│   │   └── tenants/            # Tenant registration page
│   ├── products/               # Product catalog
│   │   └── [slug]/             # Product detail pages
│   ├── globals.css             # Global styles
│   ├── layout.tsx              # Root layout component
│   └── page.tsx                # Main page (redirects to auth if unauthenticated)
├── components/                 # React components
│   ├── products/               # Product display components
│   ├── ui/                     # shadcn/ui component library
│   ├── app-switcher.tsx        # Helvety ecosystem app switcher
│   ├── encryption-gate.tsx     # Encryption setup/unlock gate
│   ├── encryption-setup.tsx    # Encryption passkey setup
│   ├── encryption-stepper.tsx  # Encryption flow progress indicator
│   ├── encryption-unlock.tsx   # Encryption passkey unlock
│   ├── navbar.tsx              # Navigation bar
│   └── theme-switcher.tsx      # Dark/light mode switcher
├── hooks/                      # Custom React hooks
│   └── use-encryption.ts       # Encryption state hook
├── lib/                        # Utility functions
│   ├── auth-redirect.ts        # Auth service redirect utilities
│   ├── config/                 # Configuration files
│   ├── crypto/                 # Encryption utilities
│   ├── data/                   # Static product data
│   ├── license/                # License validation utilities
│   │   ├── index.ts            # License module exports
│   │   └── validation.ts       # License validation logic
│   ├── packages/               # Software package configuration
│   │   └── config.ts           # Package definitions and metadata
│   ├── stripe/                 # Stripe client and config
│   │   ├── client.ts           # Stripe SDK initialization
│   │   ├── config.ts           # Price IDs and product mappings
│   │   └── index.ts            # Stripe module exports
│   ├── supabase/               # Supabase client utilities
│   ├── types/                  # Type definitions
│   │   ├── entities.ts         # User, subscription, purchase types
│   │   └── products.ts         # Product type definitions
│   └── utils/                  # Utility functions
├── supabase/                   # Database migrations
│   └── migrations/             # SQL migration files
├── public/                     # Static assets
├── scripts/                    # Build scripts
└── [config files]              # Configuration files
```

## Developer

This application is developed and maintained by [Helvety](https://helvety.com), a Swiss company committed to transparency, strong security, and respect for user privacy and data protection.

For questions or inquiries, please contact us at [contact@helvety.com](mailto:contact@helvety.com).

## License & Usage

This repository is public for transparency purposes only. All code is open for inspection so users can verify its behavior.

**All Rights Reserved.** No license is granted. You may view the code, but you may not copy, reuse, redistribute, modify, or sell it without explicit written permission.

Purchasing a subscription grants access to use the hosted service only—subscriptions do not grant any rights to the source code.

See [LICENSE](./LICENSE) for full terms.
