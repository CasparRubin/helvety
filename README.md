# Helvety Store

![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19.2.4-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![License](https://img.shields.io/badge/License-All%20Rights%20Reserved-red?style=flat-square)

> **Note:** This application is currently in alpha.

Your one-stop shop for Helvety software, subscriptions, and apparel. Browse and purchase official Helvety products designed in Switzerland.

**Store:** [store.helvety.com](https://store.helvety.com)

## Features

- **Software & Subscriptions** - Purchase and manage Helvety software licenses and subscriptions
- **Apparel** - Browse and order official Helvety merchandise
- **Secure checkout** - Safe and secure payment processing
- **Account management** - Manage your purchases and subscriptions
- **Dark & Light mode** - Comfortable viewing in any lighting condition
- **App Switcher** - Navigate between Helvety ecosystem apps

## Security & Authentication

This application implements a modern, passwordless authentication system with end-to-end encryption:

### Authentication Flow

- **Magic Links** - Passwordless sign-in via email (rate-limited to 2 requests/minute)
- **Passkey Authentication** - Sign in using your phone with Face ID, Touch ID, or fingerprint via WebAuthn
- **Unified Stepper UI** - Clear progress indicator through the authentication flow

### End-to-End Encryption

User data is protected with client-side encryption using the WebAuthn PRF extension:

- **Passkey-derived keys** - Encryption keys are derived from your passkey using the PRF extension
- **Zero-knowledge** - The server never sees your encryption key; all encryption/decryption happens in the browser
- **Device-bound security** - Your passkey (stored on your phone) is the only way to decrypt your data

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

## Project Structure

```
helvety-store/
├── app/                        # Next.js App Router
│   ├── actions/                # Server actions
│   │   ├── auth-actions.ts     # Authentication actions
│   │   ├── encryption-actions.ts # Encryption parameter management
│   │   └── passkey-auth-actions.ts # WebAuthn passkey operations
│   ├── auth/                   # Auth routes
│   │   └── callback/           # Magic link & OAuth callback
│   ├── login/                  # Login page with passkey support
│   ├── globals.css             # Global styles
│   ├── layout.tsx              # Root layout component
│   └── page.tsx                # Main page (with encryption gate)
├── components/                 # React components
│   ├── ui/                     # shadcn/ui component library
│   ├── auth-stepper.tsx        # Unified auth flow progress indicator
│   ├── encryption-gate.tsx     # Ensures encryption is set up/unlocked
│   ├── encryption-setup.tsx    # Passkey & encryption setup wizard
│   ├── encryption-unlock.tsx   # Unlock encryption with passkey
│   ├── app-switcher.tsx        # Helvety ecosystem app switcher
│   ├── navbar.tsx              # Navigation bar
│   ├── providers.tsx           # App providers wrapper
│   ├── theme-provider.tsx      # Theme context provider
│   └── theme-switcher.tsx      # Dark/light mode switcher
├── hooks/                      # Custom React hooks
│   └── use-encryption.ts       # Encryption state hook
├── lib/                        # Utility functions
│   ├── config/                 # Configuration files
│   ├── crypto/                 # Encryption utilities
│   │   ├── encoding.ts         # Base64 encoding utilities
│   │   ├── encryption.ts       # Core encryption functions
│   │   ├── encryption-context.tsx # Encryption React context
│   │   ├── index.ts            # Crypto module exports
│   │   ├── key-storage.ts      # Secure key caching
│   │   ├── passkey.ts          # WebAuthn passkey helpers
│   │   ├── prf-key-derivation.ts # PRF-based key derivation
│   │   └── types.ts            # Crypto type definitions
│   ├── supabase/               # Supabase client utilities
│   │   ├── admin.ts            # Admin client (server-side)
│   │   ├── client-factory.ts   # Supabase client factory
│   │   ├── client.ts           # Browser client
│   │   └── server.ts           # Server client
│   ├── types/                  # Type definitions
│   ├── env-validation.ts       # Environment variable validation
│   ├── logger.ts               # Logging utilities
│   ├── navigation-helpers.ts   # Navigation utility functions
│   └── utils.ts                # General utility functions
├── public/                     # Static assets
├── scripts/                    # Build scripts
└── [config files]              # Configuration files
```

## Developer

This application is developed and maintained by [Helvety](https://helvety.com), a Swiss company committed to transparency, strong security, and respect for user privacy and data protection.

For questions or inquiries, please contact us at [contact@helvety.com](mailto:contact@helvety.com).

## License & Usage

This repository is public for transparency purposes only—all code is open for inspection so users can verify its behavior.

**No license is granted; this is the default "All rights reserved" status.** You may view the code, but you cannot reuse, redistribute, or sell it without explicit permission. All rights are retained by the author.
