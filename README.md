# Helvety Store

![Next.js](https://img.shields.io/badge/Next.js-16.1.1-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19.2.4-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![License](https://img.shields.io/badge/License-All%20Rights%20Reserved-red?style=flat-square)

> **Note:** This application is currently in alpha.

A secure, end-to-end encrypted password manager with passkey authentication. Your data stays private with zero-knowledge architecture.

**App:** [store.helvety.com](https://store.helvety.com)

## Features

- **End-to-end encryption (E2EE)** - All sensitive data is encrypted client-side before storage
- **Passkey authentication** - Passwordless login using WebAuthn/FIDO2 standards
- **PRF key derivation** - Encryption keys derived from passkey PRF extension
- **Zero-knowledge architecture** - Server never has access to your unencrypted data
- **Dark & Light mode** - Comfortable viewing in any lighting condition
- **App Switcher** - Navigate between Helvety ecosystem apps

## Tech Stack

This project is built with modern web technologies:

- **[Next.js 16.1.1](https://nextjs.org/)** - React framework with App Router
- **[React 19.2.4](https://react.dev/)** - UI library
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Supabase](https://supabase.com/)** - Backend-as-a-Service (Auth & Database)
- **[SimpleWebAuthn](https://simplewebauthn.dev/)** - WebAuthn/Passkey implementation
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
│   │   └── encryption-actions.ts # Encryption-related actions
│   ├── auth/                   # Auth routes
│   │   └── callback/           # OAuth callback handler
│   ├── login/                  # Login page
│   ├── globals.css             # Global styles
│   ├── icon.svg                # App icon
│   ├── layout.tsx              # Root layout component
│   ├── page.tsx                # Main page component
│   ├── robots.ts               # Robots.txt configuration
│   └── sitemap.ts              # Sitemap configuration
├── components/                 # React components
│   ├── ui/                     # shadcn/ui component library
│   ├── app-switcher.tsx        # Helvety ecosystem app switcher
│   ├── encryption-gate.tsx     # Encryption state gate component
│   ├── encryption-setup.tsx    # Initial encryption setup
│   ├── encryption-unlock.tsx   # Unlock encrypted vault
│   ├── navbar.tsx              # Navigation bar
│   ├── providers.tsx           # App providers wrapper
│   ├── theme-provider.tsx      # Theme context provider
│   └── theme-switcher.tsx      # Dark/light mode switcher
├── hooks/                      # Custom React hooks
│   └── use-encryption.ts       # Encryption state hook
├── lib/                        # Utility functions
│   ├── config/                 # Configuration files
│   │   └── version.ts          # Build version
│   ├── crypto/                 # Cryptography modules
│   │   ├── encoding.ts         # Encoding utilities
│   │   ├── encryption-context.tsx # Encryption React context
│   │   ├── encryption.ts       # Core encryption functions
│   │   ├── key-storage.ts      # Key storage utilities
│   │   ├── passkey.ts          # Passkey/WebAuthn utilities
│   │   ├── prf-key-derivation.ts # PRF key derivation
│   │   └── types.ts            # Crypto type definitions
│   ├── supabase/               # Supabase client utilities
│   │   ├── client-factory.ts   # Client factory
│   │   ├── client.ts           # Browser client
│   │   └── server.ts           # Server client
│   ├── types/                  # Type definitions
│   ├── env-validation.ts       # Environment validation
│   ├── logger.ts               # Logging utilities
│   ├── navigation-helpers.ts   # Navigation utilities
│   └── utils.ts                # General utility functions
├── public/                     # Static assets
│   └── *.svg                   # Logo and branding assets
├── scripts/                    # Build scripts
│   └── generate-version.js     # Version generation script
└── [config files]              # Configuration files (Next.js, TypeScript, etc.)
```

## Security Architecture

The application uses a zero-knowledge security model:

1. **Authentication** - Users authenticate via passkeys (WebAuthn)
2. **Key Derivation** - Encryption keys are derived from the passkey's PRF extension
3. **Client-side Encryption** - All sensitive data is encrypted in the browser before transmission
4. **Secure Storage** - Only encrypted data is stored on the server
5. **Decryption** - Data is decrypted client-side only when the user authenticates

## Developer

This application is developed and maintained by [Helvety](https://helvety.com), a Swiss company committed to transparency, strong security, and respect for user privacy and data protection.

For questions or inquiries, please contact us at [contact@helvety.com](mailto:contact@helvety.com).

## License & Usage

This repository is public for transparency purposes only—all code is open for inspection so users can verify its behavior.

**No license is granted; this is the default "All rights reserved" status.** You may view the code, but you cannot reuse, redistribute, or sell it without explicit permission. All rights are retained by the author.
