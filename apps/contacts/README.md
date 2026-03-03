# Helvety Contacts

![Next.js](https://img.shields.io/badge/Next.js-16.x-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19.x-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![License](https://img.shields.io/badge/License-All%20Rights%20Reserved-red?style=flat-square)

A privacy-focused contact management app with client-side encryption for sensitive fields. Required structural metadata remains plaintext for app functionality. Engineered & Designed in Switzerland.

**App:** [helvety.com/contacts](https://helvety.com/contacts)

> **Part of the [Helvety monorepo](https://github.com/CasparRubin/helvety).** This app lives in `apps/contacts/`. See the root README for monorepo setup instructions.

## Service Availability

Helvety services are primarily intended for customers in Switzerland. New account creation includes a Switzerland location confirmation step for account-based services, but technical access from outside Switzerland may still occur. Mandatory law in other jurisdictions may still apply in specific cases.

Helvety's legal baseline is Swiss data protection law (nDSG). Account-based services ask new users to confirm Switzerland-based usage during account creation on [helvety.com/auth](https://helvety.com/auth) before a new account is created.

## Features

- **End-to-end encryption** - Sensitive contact content fields are encrypted client-side using your passkey (see [Encrypted vs. Non-Encrypted Fields](#encrypted-vs-non-encrypted-fields) below)
- **Contact fields** - Each contact stores First Name(s), Last Name(s), Description, Email, Phone, Birthday, and Notes
- **Rich text notes** - Rich text editor for contact notes with formatting toolbar
  - Text formatting (bold, italic, underline, strikethrough)
  - Headings (H1, H2, H3)
  - Bullet and numbered lists
  - Link support
  - Unsaved changes detection with confirmation dialog
  - Manual note editing with unsaved-changes detection
  - **Action panel** - View dates and the immutable built-in contact categories directly from the editor; sections are collapsible (all open by default on desktop; collapsed on mobile except Dates)
- **Fixed categories** - An immutable built-in category set is enforced for all contacts (Work, Family, Friends). New contacts are assigned the first category (Work) when none is specified.
- **Drag & drop reordering** - Rearrange contacts on desktop; mobile uses up/down arrows for ordering controls
- **Task linking** - Link, unlink, and view task entities from [Helvety Tasks](https://helvety.com/tasks) directly on the contact editor page
  - **Bidirectional** - Link and unlink task entities from either the Contacts app or the Tasks app for consistent cross-app UX
  - **Searchable picker** - Search your task entities by title and link them with one click
  - **Deep links** - Click any task row to open the linked Unit, Space, or Item in the Tasks app (opens in a new tab)
  - **Privacy** - Task entity titles are decrypted client-side; plaintext should not be intentionally sent to the server
- **Self-Service Data Export** - Export all your contact data as a decrypted JSON file from the command bar; data is fetched encrypted from the server and decrypted client-side using your passkey (designed to support nDSG Art. 28 data portability requests). Export is only available while your encryption context is unlocked.
- **App Switcher** - Navigate between Helvety ecosystem apps (Home, Auth, Store, PDF, Tasks, Contacts)
- **Dark & Light mode** - Switch between dark and light themes

## Current Usage Limits

- Max **250 contacts** per user

## Environment Variables

Copy `env.template` to `.env.local` and fill in values. All `NEXT_PUBLIC_*` vars are exposed to the client; others are server-only.

| Variable                               | Required | Server-only | Description                                                                            |
| -------------------------------------- | -------- | ----------- | -------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Yes      | No          | Supabase project URL                                                                   |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes      | No          | Publishable key (RLS applies)                                                          |
| `SUPABASE_SECRET_KEY`                  | Yes      | **Yes**     | Service role key for server-side admin operations (bypasses RLS). Must not be exposed. |
| `UPSTASH_REDIS_REST_URL`               | Yes      | **Yes**     | Redis URL for rate limiting. Required by startup validation in all environments.       |
| `UPSTASH_REDIS_REST_TOKEN`             | Yes      | **Yes**     | Redis token for rate limiting. Required by startup validation in all environments.     |

> **Note:** App URLs are derived from `NODE_ENV` in `packages/shared/src/config.ts` — no URL env vars needed. Make sure your production URL (`https://helvety.com`) is in your Supabase Redirect URLs allowlist (Supabase Dashboard > Authentication > URL Configuration > Redirect URLs).

## Security & Authentication

### End-to-End Encryption

Helvety Contacts uses end-to-end encryption (E2EE), as does Helvety Tasks. In supported browser flows, contact content fields are encrypted and decrypted in your browser using a key derived from your passkey. The server stores encrypted ciphertext plus PRF salt parameters, and does not receive your raw encryption key.

**How it works:**

1. During setup at helvety.com/auth, you create a passkey with the WebAuthn PRF (Pseudo-Random Function) extension
2. The PRF extension produces a deterministic output tied to your passkey
3. Your browser derives an AES-256-GCM encryption key from the PRF output using HKDF
4. In supported flows, encryption and decryption of protected contact content happens locally in your browser
5. Additional Authenticated Data (AAD) binds each ciphertext to its specific record, preventing encrypted data from being moved or replayed in a different context
6. Record identifiers for encrypted data are generated on your device, not by the server
7. For encrypted content fields, the server stores encrypted ciphertext and PRF salt values; required structural metadata is stored separately in plaintext for app functionality

**Important:** Your passkey controls decryption access to encrypted content. If you lose access to all passkeys for your account, encrypted content cannot be recovered by Helvety. To reduce this risk, save passkeys in your platform's built-in password app with cloud sync enabled.

#### Encrypted vs. Non-Encrypted Fields

**Encrypted fields** (AES-256-GCM, client-side before storage):

| Entity  | Encrypted Fields                                                                |
| ------- | ------------------------------------------------------------------------------- |
| Contact | `first_name`, `last_name`, `description`, `email`, `phone`, `birthday`, `notes` |

**Non-encrypted structural metadata** (stored in plaintext to enable application functionality):

| Field                      | Purpose                                            |
| -------------------------- | -------------------------------------------------- |
| Record identifiers (`id`)  | Generated client-side; bound to ciphertext via AAD |
| `user_id`                  | Row Level Security (RLS)                           |
| `created_at`, `updated_at` | Timestamps                                         |
| `sort_order`               | Display ordering                                   |
| `category_id` (Contact)    | Immutable built-in category reference              |

Browser compatibility for end-to-end encryption depends on WebAuthn PRF support and can evolve over time:

**Desktop:**

- Chrome/Edge (recent versions)
- Safari on macOS (recent versions)
- Firefox desktop (recent versions)

**Mobile:**

- iPhone/iPad (recent iOS/iPadOS versions)
- Android (recent versions) with Chrome

**Note:** Firefox on Android may not support the PRF extension in current tested flows.

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
3. Redirected back to Contacts app → In many supported flows, encryption is already unlocked from the auth ceremony; depending on browser/session state, an additional auth-managed step may still be required

Sessions are shared across all Helvety apps via cookie-based SSO (all apps are served under `helvety.com` via path-based routing).

**Privacy Note:** Your email address is used primarily for authentication (verification codes for new users, passkey for returning), account recovery, and essential service communications. We do not share your email with third parties for marketing purposes.

### Security Hardening

This application includes the following security hardening:

- **Session Management** - `proxy.ts` performs lightweight request setup (CSP headers and CSRF bootstrap). Session/auth checks are enforced in page-level/server-side handlers.
- **Server-side Page Guards** - Authentication checks in page-level Server Components via `@helvety/shared/auth-guard` with retry logic for transient failures (aligned with current Next.js security guidance)
- **Redirect URI Validation** - Redirect URIs in auth-related flows are allowlist-validated via `@helvety/shared/redirect-validation` to reduce open-redirect risk
- **CSRF Protection** - Token-based protection for state-changing operations
- **Rate Limiting** - Protection against brute force attacks
- **Security Headers** - CSP, HSTS, and other security headers

**Legal Pages:** Privacy Policy, Terms of Service, and Impressum are hosted centrally on [helvety.com](https://helvety.com) and linked in the site footer. Services are primarily intended for customers in Switzerland, and account-based services ask new users to confirm Switzerland-based usage during account creation on [helvety.com/auth](https://helvety.com/auth) (before a new account is created). The legal baseline is Swiss data protection law (nDSG), and where other mandatory law applies in a specific case, Helvety follows those obligations. An informational cookie notice explains essential cookies and privacy-focused telemetry (Vercel Analytics and Speed Insights).

**Abuse Reporting:** Abuse reports can be submitted to [contact@helvety.com](mailto:contact@helvety.com). The Impressum on [helvety.com/impressum](https://helvety.com/impressum#abuse) includes an abuse reporting section with guidance for both users and law enforcement.

## Tech Stack

This project is built with modern web technologies:

- **[Next.js 16.x](https://nextjs.org/)** - React framework with App Router
- **[React 19.x](https://react.dev/)** - UI library
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Supabase](https://supabase.com/)** - Backend-as-a-Service (Database; auth is centralized at helvety.com/auth)
- **[Tiptap](https://tiptap.dev/)** - Headless WYSIWYG rich text editor
- **[dnd kit](https://dndkit.com/)** - Drag and drop toolkit for React
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first CSS framework
- **[shadcn/ui](https://ui.shadcn.com/)** - High-quality React component library
- **[Radix UI](https://www.radix-ui.com/)** - Unstyled, accessible component primitives
- **[Lucide React](https://lucide.dev/)** - Icon library
- **[Zod 4](https://zod.dev/)** - TypeScript-first schema validation
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

Vercel Analytics and Vercel Speed Insights are used across Helvety apps for privacy-oriented, aggregated/pseudonymized page-view and performance metrics. See our [Privacy Policy](https://helvety.com/privacy) for details.

For questions or inquiries, please contact us at [contact@helvety.com](mailto:contact@helvety.com). To report abuse, contact [contact@helvety.com](mailto:contact@helvety.com).

## License & Usage

> **This is NOT open source software.**

This monorepo is public so users can inspect the code and independently assess application behavior and security posture.

**All Rights Reserved.** No license is granted for any use of this code. You may:

- View and inspect the code

You may NOT:

- Copy, use, or reuse the code in any form
- Redistribute, publish, or share the code
- Modify, adapt, or create derivative works
- Sell, sublicense, or commercially exploit the code
- Reverse engineer or decompile the code

**Helvety Contacts availability and pricing can change over time.** See [helvety.com/contacts](https://helvety.com/contacts) and related store pages for current terms.

See [LICENSE](./LICENSE) for full legal terms.
