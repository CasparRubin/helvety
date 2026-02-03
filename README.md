# Helvety PDF

![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19.2.4-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![License](https://img.shields.io/badge/License-All%20Rights%20Reserved-red?style=flat-square)

## Demo

![Demo](./public/screencapture/demo.gif)

## Screenshots

<table>
  <tr>
    <td align="center"><strong>Dark Mode</strong></td>
    <td align="center"><strong>Light Mode</strong></td>
    <td align="center"><strong>Dark Mode - Editor</strong></td>
    <td align="center"><strong>Light Mode - Editor</strong></td>
    <td align="center"><strong>Mobile - Editor</strong></td>
  </tr>
  <tr>
    <td><img src="./public/screenshots/Dark%20mode.png" alt="Desktop upload interface in dark mode" width="200"/></td>
    <td><img src="./public/screenshots/Light%20mode.png" alt="Desktop upload interface in light mode" width="200"/></td>
    <td><img src="./public/screenshots/Dark%20mode%20Functionality.png" alt="Desktop PDF editor in dark mode" width="200"/></td>
    <td><img src="./public/screenshots/Light%20mode%20Functionality.png" alt="Desktop PDF editor in light mode" width="200"/></td>
    <td><img src="./public/screenshots/Dark%20mode%20Mobile%20Functionality.png" alt="Mobile PDF editor" width="100"/></td>
  </tr>
</table>

A privacy-focused, client-side PDF toolkit. Merge, reorder, rotate, and extract pages from PDF files and images with client-side processing (hosting provider may collect connection metadata). All file processing happens entirely in your browser.

**App:** [pdf.helvety.com](https://pdf.helvety.com) | **Subscribe:** [store.helvety.com](https://store.helvety.com/products/helvety-pdf)

**Privacy First** - 100% Client-Side Processing. All file processing happens entirely in your browser. The application does not collect or transmit your file data (hosting provider may collect connection metadata - see Privacy Policy).

Helvety PDF offers a free Basic tier with essential features, and a Pro subscription for unlimited usage and advanced features like page rotation.

## Features

- **Client-side file processing** - All operations happen in your browser
- **PDF and image support** - Upload PDF files and images (PNG, JPEG, WebP, GIF, etc.)
- **Page thumbnails preview** - Visual preview of all pages before processing
- **Drag & drop reordering** - Easily rearrange pages by dragging thumbnails
- **Page rotation** - Rotate individual pages by 90° increments _(Pro)_
- **Page deletion** - Remove unwanted pages from your documents
- **Page extraction** - Extract individual pages as separate PDF files
- **Multi-file merging** - Combine multiple PDF files and images into one PDF
- **Drag & drop upload** - Intuitive file upload interface
- **Customizable grid layout** - Adjust pages per row to accommodate different page sizes
- **Dark & Light mode support** - Comfortable viewing in any lighting condition

## Pricing

Helvety PDF offers a free Basic tier and a paid Pro subscription:

| Feature                | Basic (Free) | Pro (CHF 4.95/month) |
| ---------------------- | ------------ | -------------------- |
| Files                  | Max 2 files  | Unlimited            |
| Pages                  | Max 5 pages  | Unlimited            |
| Merge files            | Yes          | Yes                  |
| Split files            | Yes          | Yes                  |
| Reorder pages          | Yes          | Yes                  |
| Delete pages           | Yes          | Yes                  |
| Extract pages          | Yes          | Yes                  |
| Rotate pages           | -            | Yes                  |
| Client-side processing | Yes          | Yes                  |

Subscribe at [store.helvety.com](https://store.helvety.com/products/helvety-pdf)

## How It Works

1. **Upload Files** - Drag and drop or click to browse and select multiple PDF files and/or images
2. **Preview & Manage** - See thumbnails of all pages, reorder by dragging, rotate, or delete pages as needed
3. **Download** - Your processed PDF downloads automatically with a timestamped filename

## Security & Authentication

This application uses centralized authentication via [auth.helvety.com](https://auth.helvety.com) with end-to-end encryption:

### Authentication Flow

Authentication is handled by the centralized Helvety Auth service (`auth.helvety.com`) using **email + passkey authentication** — no passwords required:

**New Users:**

1. Redirected to auth.helvety.com → Enter email address
2. Click magic link in email → Verify email ownership
3. Scan QR code with phone → Verify with biometrics (Face ID/fingerprint)
4. Passkey created → Verify passkey → Session established → Redirected back to PDF app
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

### Browser Requirements

Passkey encryption requires a modern browser with WebAuthn PRF support:

**Desktop:**

- Chrome 128+ or Edge 128+
- Safari 18+ on Mac
- Firefox 139+ (desktop only)

**Mobile:**

- iPhone with iOS 18+
- Android 14+ with Chrome

**Note:** Firefox for Android does not support the PRF extension.

### Security Hardening

This application implements comprehensive security hardening:

- **Session Management** - Session validation and refresh via `proxy.ts` using `getClaims()` (local JWT validation; Auth API only when refresh is needed)
- **Server Layout Guards** - Authentication checks in Server Components (CVE-2025-29927 compliant)
- **CSRF Protection** - Token-based protection for state-changing operations
- **Rate Limiting** - Protection against brute force attacks
- **Idle Timeout** - Automatic session expiration after 30 minutes of inactivity
- **Audit Logging** - Structured logging for authentication and encryption events
- **Security Headers** - CSP, HSTS, and other security headers

**Legal Pages:** Privacy Policy, Terms of Service, and Impressum are hosted centrally on [helvety.com](https://helvety.com) and linked in the site footer.

**Pre-deployment:** Run `npm run predeploy` to run format check, type check, lint, tests, and production build.

## Tech Stack

This project is built with modern web technologies:

- **[Next.js 16.1.6](https://nextjs.org/)** - React framework with App Router
- **[React 19.2.4](https://react.dev/)** - UI library
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Supabase](https://supabase.com/)** - Backend-as-a-Service (Auth & Database)
- **[SimpleWebAuthn](https://simplewebauthn.dev/)** - WebAuthn/passkey authentication
- **[pdf-lib](https://pdf-lib.js.org/)** - PDF manipulation and creation
- **[react-pdf](https://www.npmjs.com/package/react-pdf)** - React components for PDF display
- **[pdfjs-dist](https://mozilla.github.io/pdf.js/)** - PDF rendering engine (used by react-pdf)
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[shadcn/ui](https://ui.shadcn.com/)** - High-quality React component library
- **[Radix UI](https://www.radix-ui.com/)** - Unstyled, accessible component primitives
- **[Lucide React](https://lucide.dev/)** - Icon library
- **[next-themes](https://github.com/pacocoursey/next-themes)** - Dark mode support
- **[Vitest](https://vitest.dev/)** - Unit and integration testing

**Environment:** Copy `env.template` to `.env.local` and set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and (for server-side admin) `SUPABASE_SECRET_KEY`. Node.js 20.9+ required.

## Architecture & Performance

This application is built with performance and code quality in mind:

- **LRU Cache Strategy** - Uses Least Recently Used (LRU) cache eviction for optimal memory management
- **Batch Processing** - Processes PDF pages in adaptive batches (3-10 pages) to prevent UI blocking
- **Optimized Memoization** - Smart memoization with early short-circuiting for efficient re-renders
- **Strict TypeScript** - Comprehensive type safety with `noUncheckedIndexedAccess`, `noImplicitReturns`, `noUnusedLocals`, and other strict compiler options
- **Error Handling** - Centralized error handling with detailed context and recovery strategies
- **Code Organization** - Modular architecture with extracted utilities and reusable components

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

**Purchasing a subscription grants access to use the hosted service at [pdf.helvety.com](https://pdf.helvety.com) only.** Subscriptions do not grant any rights to the source code.

See [LICENSE](./LICENSE) for full legal terms.
