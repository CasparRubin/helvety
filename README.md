# Helvety Contacts

![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19.2.4-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![License](https://img.shields.io/badge/License-All%20Rights%20Reserved-red?style=flat-square)

A private and secure contact management app with end-to-end encryption. All your data is encrypted and only you can read it.

**App:** [contacts.helvety.com](https://contacts.helvety.com)

## Service Availability

Helvety services are intended exclusively for customers located in Switzerland. **We are not able to serve customers in the EU/EEA.**

As a Swiss company, Helvety operates solely under the Swiss Federal Act on Data Protection (nDSG). Because we do not target or serve customers in the EU/EEA, the GDPR does not apply. For this reason, new users are asked to confirm during account creation on [auth.helvety.com](https://auth.helvety.com) that they are located in Switzerland before any personal data is stored.

## Features

- **End-to-end encryption** - All contact data is encrypted client-side using your passkey; we never see your data
- **Contact fields** - Each contact stores First Name(s), Last Name, Email, and Notes
- **Rich text notes** - Rich text editor for contact notes with formatting toolbar
  - Text formatting (bold, italic, underline, strikethrough)
  - Headings (H1, H2, H3)
  - Bullet and numbered lists
  - Link support
  - Unsaved changes detection with confirmation dialog
  - **Comment with Timestamp** - Insert timestamped comments into notes with a single click
  - **Action panel** - View dates and set contact category directly from the editor; sections are collapsible (all open by default on desktop; collapsed on mobile except Dates)
- **Category management** - Organize contacts into categories (e.g., Work, Family, Friends)
  - **Default categories** - Built-in category set: Work, Family, Friends
  - **Custom category configurations** - Create your own category setups with custom names, colors, and Lucide icons
  - **Color picker** - Choose from preset colors or use the custom color picker for any hex color
  - **Icon support** - Each category can have a Lucide icon for visual identification
  - **Rows shown by default** - Control how many contacts are visible per category (0 = collapsed, N = show N contacts with "Show all" link)
- **Drag & drop reordering** - Rearrange contacts within and between categories on desktop; mobile uses up/down arrows to move contacts between categories
- **Task linking** - Link, unlink, and view task entities from [Helvety Tasks](https://tasks.helvety.com) directly on the contact editor page
  - **Bidirectional** - Link and unlink task entities from either the Contacts app or the Tasks app for consistent cross-app UX
  - **Searchable picker** - Search your task entities by title and link them with one click
  - **Deep links** - Click any task row to open the linked Unit, Space, or Item in the Tasks app (opens in a new tab)
  - **Privacy** - Task entity titles are decrypted client-side; the server never sees plaintext
- **App Switcher** - Navigate between Helvety ecosystem apps (Home, Auth, Store, PDF, Tasks, Contacts)
- **Dark & Light mode** - Switch between dark and light themes

## Security & Authentication

### End-to-End Encryption

Helvety Contacts uses end-to-end encryption (E2EE), as does Helvety Tasks. Your contact data is encrypted and decrypted entirely in your browser using a key derived from your passkey. The server stores only encrypted data and PRF salt parameters. The server never possesses your encryption key.

**How it works:**

1. During setup at auth.helvety.com, you create a passkey with the WebAuthn PRF (Pseudo-Random Function) extension
2. The PRF extension produces a deterministic output tied to your passkey
3. Your browser derives an AES-256-GCM encryption key from the PRF output using HKDF
4. All encryption and decryption happens locally in your browser
5. The server stores only encrypted ciphertext and PRF salt values

**Important:** Your passkey is the only way to decrypt your data. If you lose access to your passkey, your encrypted data cannot be recovered.

Browser requirements for end-to-end encryption:

**Desktop:**

- Chrome 128+ or Edge 128+
- Safari 18+ on Mac
- Firefox 139+ (desktop only)

**Mobile:**

- iPhone with iOS 18+
- Android 14+ with Chrome

**Note:** Firefox for Android does not support the PRF extension.

### Authentication Flow

Authentication is handled by the centralized Helvety Auth service (`auth.helvety.com`) using **email + passkey authentication** with no passwords required. **Login is required** because all contact data is encrypted and tied to your passkey.

**New Users:**

1. Click "Sign in" → Redirected to auth.helvety.com → Enter email address
2. Enter verification code from email → Verify email ownership
3. Create passkey with PRF extension → Verify passkey → Session established
4. Redirected back to Contacts app → Data encrypted with your passkey

**Returning Users:**

1. Click "Sign in" → Redirected to auth.helvety.com → Enter email address
2. Sign in with passkey (no email sent; existing users with a passkey skip email verification)
3. Redirected back to Contacts app → Unlock encryption with passkey

Sessions are shared across all `*.helvety.com` subdomains via cookie-based SSO.

**Privacy Note:** Your email address is used solely for authentication (verification codes for new users, passkey for returning) and account recovery. We do not share your email with third parties for marketing purposes.

### Security Hardening

This application includes the following security hardening:

- **Session Management** - Session validation and refresh via `proxy.ts` using `getClaims()` (local JWT validation; Auth API only when refresh is needed; wrapped in try/catch for resilience against transient network failures)
- **Server Layout Guards** - Authentication checks in Server Components via `lib/auth-guard.ts` with retry logic for transient failures (CVE-2025-29927 compliant)
- **Redirect URI Validation** - All redirect URIs validated against allowlist via `lib/redirect-validation.ts` to prevent open redirect attacks
- **CSRF Protection** - Token-based protection for state-changing operations
- **Rate Limiting** - Protection against brute force attacks
- **Idle Timeout** - Automatic session expiration after 30 minutes of inactivity
- **Audit Logging** - Structured logging for authentication and encryption events
- **Security Headers** - CSP, HSTS, and other security headers

**Legal Pages:** Privacy Policy, Terms of Service, and Impressum are hosted centrally on [helvety.com](https://helvety.com) and linked in the site footer. Services are exclusively available to customers in Switzerland and are not offered to EU/EEA residents; new users must confirm they are located in Switzerland during account creation on [auth.helvety.com](https://auth.helvety.com) (before any personal data is stored). Only the Swiss Federal Act on Data Protection (nDSG) applies; the GDPR does not apply. An informational cookie notice informs visitors that only essential cookies are used.

**Abuse Reporting:** Abuse reports can be submitted to [contact@helvety.com](mailto:contact@helvety.com). The Impressum on [helvety.com/impressum](https://helvety.com/impressum#abuse) includes an abuse reporting section with guidance for both users and law enforcement.

## Tech Stack

This project is built with modern web technologies:

- **[Next.js 16.1.6](https://nextjs.org/)** - React framework with App Router
- **[React 19.2.4](https://react.dev/)** - UI library
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Supabase](https://supabase.com/)** - Backend-as-a-Service (Database; auth is centralized at auth.helvety.com)
- **[Tiptap](https://tiptap.dev/)** - Headless WYSIWYG rich text editor
- **[dnd kit](https://dndkit.com/)** - Drag and drop toolkit for React
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first CSS framework
- **[shadcn/ui](https://ui.shadcn.com/)** - High-quality React component library
- **[Radix UI](https://www.radix-ui.com/)** - Unstyled, accessible component primitives
- **[Lucide React](https://lucide.dev/)** - Icon library
- **[Zod](https://zod.dev/)** - TypeScript-first schema validation
- **[next-themes](https://github.com/pacocoursey/next-themes)** - Dark mode support

## Developer

This application is developed and maintained by [Helvety](https://helvety.com), a Swiss company focused on security and user privacy.

Vercel Analytics is used across all Helvety apps for privacy-focused, anonymous page view statistics. Vercel Speed Insights is enabled only on [helvety.com](https://helvety.com). See our [Privacy Policy](https://helvety.com/privacy) for details.

For questions or inquiries, please contact us at [contact@helvety.com](mailto:contact@helvety.com). To report abuse, contact [contact@helvety.com](mailto:contact@helvety.com).

## License & Usage

> **This is NOT open source software.**

This repository is public so users can inspect and verify the application's behavior and security.

**All Rights Reserved.** No license is granted for any use of this code. You may:

- View and inspect the code

You may NOT:

- Clone, copy, or download this code for any purpose
- Modify, adapt, or create derivative works
- Redistribute or share this code
- Use this code in your own projects
- Run this code locally or on your own servers

**This is a free contact management application accessible at [contacts.helvety.com](https://contacts.helvety.com).** No subscription is required.

See [LICENSE](./LICENSE) for full legal terms.
