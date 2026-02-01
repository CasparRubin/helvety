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
- **Account Management** - Manage your tenants, software downloads, and profile settings
- **Tenant Management** - Register SharePoint tenant IDs for SPO Explorer licensing
- **Download Management** - Access and download purchased software packages
- **License Validation** - API for validating tenant licenses per product (supports multi-product licensing)
- **Dark & Light mode** - Comfortable viewing in any lighting condition
- **App Switcher** - Navigate between Helvety ecosystem apps

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

## Project Structure

```
helvety-store/
├── __tests__/                  # Unit and integration tests
├── .github/
│   └── workflows/              # CI/CD workflows
│       └── test.yml            # Automated testing
├── app/                        # Next.js App Router
│   ├── actions/                # Server actions
│   │   ├── account-actions.ts  # User profile management
│   │   ├── auth-actions.ts     # Authentication response types
│   │   ├── download-actions.ts # Software download management
│   │   ├── encryption-actions.ts # Encryption parameter management
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
│   ├── account/                # User account management
│   │   ├── account-client.tsx  # Account dashboard client component
│   │   └── page.tsx            # Account page (profile, tenants, downloads)
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
├── e2e/                        # End-to-end tests (Playwright)
├── supabase/                   # Database migrations
│   └── migrations/             # SQL migration files
├── public/                     # Static assets
├── scripts/                    # Build scripts
├── vitest.config.ts            # Vitest configuration
├── vitest.setup.ts             # Test setup
├── playwright.config.ts        # Playwright E2E configuration
└── [config files]              # Other configuration files
```

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm 9 or later
- A Supabase project (for authentication and database)
- A Stripe account (for payment processing)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/helvety/helvety-store.git
   cd helvety-store
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables (see [Environment Variables](#environment-variables) below)

4. Run the development server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Environment Variables

Copy `env.template` to `.env.local` and fill in the required values:

```bash
cp env.template .env.local
```

### Required Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_PROJECT_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/publishable key (safe for browser) |
| `SUPABASE_SECRET_KEY` | Supabase service role key (server-only, never expose to client) |
| `NEXT_PUBLIC_APP_URL` | Public URL of the app (e.g., `http://localhost:3000`) |
| `STRIPE_SECRET_KEY` | Stripe secret key (server-only) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (safe for browser) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `STRIPE_HELVETY_PDF_PRO_MONTHLY_PRICE_ID` | Stripe price ID for Helvety PDF Pro |
| `STRIPE_HELVETY_SPO_EXPLORER_*_PRICE_ID` | Stripe price IDs for SPO Explorer tiers |

See `env.template` for the full list with descriptions.

## Configuration

### Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the database migrations from `supabase/migrations/`
3. Configure Row Level Security (RLS) policies for all tables
4. Enable the required auth providers

### Stripe Setup

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Create products and prices in the Stripe Dashboard
3. Configure the webhook endpoint: `https://your-domain.com/api/webhooks/stripe`
4. Add the price IDs to your environment variables

### Authentication

Authentication is handled by the centralized Helvety Auth service. Ensure `auth.helvety.com` is configured and running.

## Testing

This project uses Vitest for unit tests and Playwright for end-to-end tests.

```bash
# Run unit tests in watch mode
npm run test

# Run unit tests once
npm run test:run

# Run with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui
```

See `__tests__/README.md` for testing patterns and conventions.

## Developer

This application is developed and maintained by [Helvety](https://helvety.com), a Swiss company committed to transparency, strong security, and respect for user privacy and data protection.

For questions or inquiries, please contact us at [contact@helvety.com](mailto:contact@helvety.com).

## License & Usage

This repository is public for transparency purposes only. All code is open for inspection so users can verify its behavior.

**All Rights Reserved.** No license is granted. You may view the code, but you may not copy, reuse, redistribute, modify, or sell it without explicit written permission.

Purchasing a subscription grants access to use the hosted service only—subscriptions do not grant any rights to the source code.

See [LICENSE](./LICENSE) for full terms.
