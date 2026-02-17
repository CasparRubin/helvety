# Helvety Contacts

![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19.2.4-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![License](https://img.shields.io/badge/License-All%20Rights%20Reserved-red?style=flat-square)

A private and secure contact management app with end-to-end encryption. All your content is encrypted and only you can read it. Engineered & Designed in Switzerland.

**App:** [helvety.com/contacts](https://helvety.com/contacts)

> **Part of the [Helvety monorepo](https://github.com/CasparRubin/helvety).** This app lives in `apps/contacts/`. See the root README for monorepo setup instructions.

## Service Availability

Helvety services are intended exclusively for customers located in Switzerland. **We are not able to serve customers in the EU/EEA.**

As a Swiss company, Helvety operates solely under the Swiss Federal Act on Data Protection (nDSG). Because we do not target or serve customers in the EU/EEA, the GDPR does not apply. For this reason, new users are asked to confirm during account creation on [helvety.com/auth](https://helvety.com/auth) that they are located in Switzerland before any personal data is stored.

## Features

- **End-to-end encryption** - All contact content is encrypted client-side using your passkey; we never see your content (see [Encrypted vs. Non-Encrypted Fields](#encrypted-vs-non-encrypted-fields) below)
- **Contact fields** - Each contact stores First Name(s), Last Name(s), Description, Email, Phone, Birthday, and Notes
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
- **Task linking** - Link, unlink, and view task entities from [Helvety Tasks](https://helvety.com/tasks) directly on the contact editor page
  - **Bidirectional** - Link and unlink task entities from either the Contacts app or the Tasks app for consistent cross-app UX
  - **Searchable picker** - Search your task entities by title and link them with one click
  - **Deep links** - Click any task row to open the linked Unit, Space, or Item in the Tasks app (opens in a new tab)
  - **Privacy** - Task entity titles are decrypted client-side; the server never sees plaintext
- **Self-Service Data Export** - Export all your contact data as a decrypted JSON file from the command bar; data is fetched encrypted from the server and decrypted client-side using your passkey (nDSG Art. 28 compliance). Export is only available while your encryption context is unlocked.
- **App Switcher** - Navigate between Helvety ecosystem apps (Home, Auth, Store, PDF, Tasks, Contacts)
- **Dark & Light mode** - Switch between dark and light themes

## Environment Variables

Copy `env.template` to `.env.local` and fill in values. All `NEXT_PUBLIC_*` vars are exposed to the client; others are server-only.

| Variable                               | Required | Server-only | Description                                  |
| -------------------------------------- | -------- | ----------- | -------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Yes      | No          | Supabase project URL                         |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes      | No          | Anon key (RLS applies)                       |
| `UPSTASH_REDIS_REST_URL`               | Prod     | **Yes**     | Redis URL for rate limiting. Prod: required. |
| `UPSTASH_REDIS_REST_TOKEN`             | Prod     | **Yes**     | Redis token. Prod: required.                 |

> **Note:** App URLs are derived from `NODE_ENV` in `packages/shared/src/config.ts` — no URL env vars needed. Make sure your production URL (`https://helvety.com`) is in your Supabase Redirect URLs allowlist (Supabase Dashboard > Authentication > URL Configuration > Redirect URLs).

## Security & Authentication

### End-to-End Encryption

Helvety Contacts uses end-to-end encryption (E2EE), as does Helvety Tasks. Your contact content is encrypted and decrypted entirely in your browser using a key derived from your passkey. The server stores only encrypted ciphertext and PRF salt parameters. The server never possesses your encryption key.

**How it works:**

1. During setup at helvety.com/auth, you create a passkey with the WebAuthn PRF (Pseudo-Random Function) extension
2. The PRF extension produces a deterministic output tied to your passkey
3. Your browser derives an AES-256-GCM encryption key from the PRF output using HKDF
4. All encryption and decryption happens locally in your browser
5. Additional Authenticated Data (AAD) binds each ciphertext to its specific record, preventing encrypted data from being moved or replayed in a different context
6. Record identifiers for encrypted data are generated on your device, not by the server
7. The server stores only encrypted ciphertext and PRF salt values

**Important:** Your passkey is the only way to decrypt your content. If you lose access to your passkey, your encrypted content cannot be recovered. To protect against device loss, we recommend saving your passkey to your device's built-in password manager (Passwords on iPhone or Google Password Manager on Android), which syncs it automatically to the cloud and allows recovery on a new device.

#### Encrypted vs. Non-Encrypted Fields

**Encrypted fields** (AES-256-GCM, client-side before storage):

| Entity         | Encrypted Fields                                                                |
| -------------- | ------------------------------------------------------------------------------- |
| Contact        | `first_name`, `last_name`, `description`, `email`, `phone`, `birthday`, `notes` |
| CategoryConfig | `name`                                                                          |
| Category       | `name`                                                                          |

**Non-encrypted structural metadata** (stored in plaintext to enable application functionality):

| Field                           | Purpose                                            |
| ------------------------------- | -------------------------------------------------- |
| Record identifiers (`id`)       | Generated client-side; bound to ciphertext via AAD |
| `user_id`                       | Row Level Security (RLS)                           |
| `created_at`, `updated_at`      | Timestamps                                         |
| `sort_order`                    | Display ordering                                   |
| `category_id` (Contact)         | Category assignment                                |
| `color`, `icon` (Category)      | Display preferences                                |
| `default_rows_shown` (Category) | UI preference                                      |
| `config_id` (Category)          | Parent config reference                            |
| Category assignments            | Linking table (all fields plaintext)               |

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

Authentication is handled by the centralized Helvety Auth service (`helvety.com/auth`) using **email + passkey authentication** with no passwords required. **Login is required** because all contact content is encrypted and tied to your passkey.

**New Users:**

1. Click "Sign in" → Redirected to helvety.com/auth → Enter email address
2. Enter verification code from email → Verify email ownership → Session established
3. Create passkey with PRF extension → Encryption key derived automatically
4. Redirected back to Contacts app → Data encrypted with your passkey

**Returning Users:**

1. Click "Sign in" → Redirected to helvety.com/auth → Enter email address
2. Sign in with passkey (no email sent; existing users with a passkey skip email verification)
3. Redirected back to Contacts app → Encryption unlocked automatically (single-touch SSO; the passkey ceremony at helvety.com/auth includes PRF for key derivation, so no second passkey prompt is needed)

Sessions are shared across all Helvety apps via cookie-based SSO (all apps are served under `helvety.com` via path-based routing).

**Privacy Note:** Your email address is used solely for authentication (verification codes for new users, passkey for returning) and account recovery. We do not share your email with third parties for marketing purposes.

### Security Hardening

This application includes the following security hardening:

- **Session Management** - Session validation and refresh via `proxy.ts` using `getClaims()` (local JWT validation; Auth API only when refresh is needed; wrapped in try/catch for resilience against transient network failures)
- **Server Layout Guards** - Authentication checks in Server Components via `@helvety/shared/auth-guard` with retry logic for transient failures (CVE-2025-29927 compliant)
- **Redirect URI Validation** - All redirect URIs validated against allowlist via `@helvety/shared/redirect-validation` to prevent open redirect attacks
- **CSRF Protection** - Token-based protection for state-changing operations
- **Rate Limiting** - Protection against brute force attacks
- **Security Headers** - CSP, HSTS, and other security headers

**Legal Pages:** Privacy Policy, Terms of Service, and Impressum are hosted centrally on [helvety.com](https://helvety.com) and linked in the site footer. Services are exclusively available to customers in Switzerland and are not offered to EU/EEA residents; new users must confirm they are located in Switzerland during account creation on [helvety.com/auth](https://helvety.com/auth) (before any personal data is stored). Only the Swiss Federal Act on Data Protection (nDSG) applies; the GDPR does not apply. An informational cookie notice informs visitors that only essential cookies are used.

**Abuse Reporting:** Abuse reports can be submitted to [contact@helvety.com](mailto:contact@helvety.com). The Impressum on [helvety.com/impressum](https://helvety.com/impressum#abuse) includes an abuse reporting section with guidance for both users and law enforcement.

## Tech Stack

This project is built with modern web technologies:

- **[Next.js 16.1.6](https://nextjs.org/)** - React framework with App Router
- **[React 19.2.4](https://react.dev/)** - UI library
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Supabase](https://supabase.com/)** - Backend-as-a-Service (Database; auth is centralized at helvety.com/auth)
- **[Tiptap](https://tiptap.dev/)** - Headless WYSIWYG rich text editor
- **[dnd kit](https://dndkit.com/)** - Drag and drop toolkit for React
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first CSS framework
- **[shadcn/ui](https://ui.shadcn.com/)** - High-quality React component library
- **[Radix UI](https://www.radix-ui.com/)** - Unstyled, accessible component primitives
- **[Lucide React](https://lucide.dev/)** - Icon library
- **[Zod](https://zod.dev/)** - TypeScript-first schema validation
- **[next-themes](https://github.com/pacocoursey/next-themes)** - Dark mode support

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

This monorepo is public so users can inspect and verify the application's behavior and security.

**All Rights Reserved.** No license is granted for any use of this code. You may:

- View and inspect the code

You may NOT:

- Copy, use, or reuse the code in any form
- Redistribute, publish, or share the code
- Modify, adapt, or create derivative works
- Sell, sublicense, or commercially exploit the code
- Reverse engineer or decompile the code

**This is a free contact management application accessible at [helvety.com/contacts](https://helvety.com/contacts).** No subscription is required.

See [LICENSE](./LICENSE) for full legal terms.
