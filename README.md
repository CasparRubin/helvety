# Helvety.com

![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19.2.4-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![License](https://img.shields.io/badge/License-All%20Rights%20Reserved-red?style=flat-square)

The main Helvety website. Swiss Engineering.

**Website:** [helvety.com](https://helvety.com)

## Features

- **App Switcher** - Navigate between Helvety ecosystem apps (PDF, Store, and more)
- **Dark & Light mode** - Comfortable viewing in any lighting condition
- **Legal pages** - Impressum, Privacy Policy, and Terms of Service
- **SEO optimized** - Sitemap and robots.txt for search engine visibility
- **Animated logo** - Subtle glow effect on the main logo
- **End-to-End Encryption** - Client-side encryption using WebAuthn PRF extension
- **Encryption Gate** - Secure access control requiring passkey-based decryption

## Tech Stack

This project is built with modern web technologies:

- **[Next.js 16.1.6](https://nextjs.org/)** - React framework with App Router
- **[React 19.2.4](https://react.dev/)** - UI library
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[shadcn/ui](https://ui.shadcn.com/)** - High-quality React component library
- **[Radix UI](https://www.radix-ui.com/)** - Unstyled, accessible component primitives
- **[Lucide React](https://lucide.dev/)** - Icon library
- **[Framer Motion](https://www.framer.com/motion/)** - Animation library
- **[next-themes](https://github.com/pacocoursey/next-themes)** - Dark mode support
- **[Vitest](https://vitest.dev/)** - Unit and integration testing
- **[Playwright](https://playwright.dev/)** - End-to-end testing

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm 9 or later
- A Supabase project (optional, for authentication features)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/helvety/helvety.com.git
   cd helvety.com
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

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

Copy `env.template` to `.env.local` (if available) and fill in the required values:

### Optional Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_PROJECT_URL` | Your Supabase project URL (for authentication features) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/publishable key (safe for browser) |
| `SUPABASE_SECRET_KEY` | Supabase service role key (server-only, for server actions) |

The website functions without Supabase credentials, but authentication and encryption features will be disabled.

## Configuration

### Authentication

Authentication is handled by the centralized Helvety Auth service (`auth.helvety.com`). The main website uses cross-subdomain session cookies for SSO with other Helvety apps.

## Project Structure

```
helvety.com/
├── __tests__/                  # Unit and integration tests
│   ├── components/             # Component tests
│   ├── lib/                    # Library tests
│   └── utils/                  # Test utilities
├── .github/
│   └── workflows/              # CI/CD workflows
│       └── test.yml            # Automated testing
├── app/                        # Next.js App Router
│   ├── actions/                # Server actions
│   │   └── encryption-actions.ts # Encryption parameter management
│   ├── globals.css             # Global styles
│   ├── icon.svg                # App icon
│   ├── layout.tsx              # Root layout component
│   ├── page.tsx                # Main page component
│   ├── error.tsx               # Error boundary
│   ├── impressum/              # Impressum page
│   ├── privacy/                # Privacy policy page
│   ├── terms/                  # Terms of service page
│   ├── robots.ts               # Robots.txt configuration
│   └── sitemap.ts              # Sitemap configuration
├── components/                 # React components
│   ├── ui/                     # shadcn/ui component library
│   │   └── index.ts            # Barrel exports
│   ├── app-switcher.tsx        # Helvety ecosystem app switcher
│   ├── encryption-gate.tsx     # Encryption setup/unlock gate
│   ├── encryption-unlock.tsx   # Encryption passkey unlock
│   ├── navbar.tsx              # Navigation bar
│   ├── theme-provider.tsx      # Theme context provider
│   └── theme-switcher.tsx      # Dark/light mode switcher
├── lib/                        # Utility functions
│   ├── config/                 # Configuration files
│   │   └── version.ts          # Build version
│   ├── crypto/                 # Encryption utilities
│   ├── types/                  # Type definitions
│   └── utils.ts                # General utility functions
├── e2e/                        # End-to-end tests (Playwright)
├── public/                     # Static assets
│   └── *.svg                   # Logo and branding assets
├── scripts/                    # Build scripts
│   └── generate-version.js    # Version generation script
├── vitest.config.ts            # Vitest configuration
├── vitest.setup.ts             # Test setup
├── playwright.config.ts        # Playwright E2E configuration
└── [config files]              # Other configuration files
```

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

See [LICENSE](./LICENSE) for full terms.
