# Helvety Contacts

![Next.js](https://img.shields.io/badge/Next.js-16.x-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19.x-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

A privacy-focused contact management app with client-side encryption for sensitive fields. Required structural metadata remains plaintext for app functionality. Engineered, Designed & Made in Switzerland.

**App:** [helvety.com/contacts](https://helvety.com/contacts)

> **Part of the [Helvety monorepo](https://github.com/CasparRubin/helvety).** This app lives in `apps/contacts/`. See the root README for monorepo setup instructions.

## Service Availability

Helvety services are primarily intended for customers in Switzerland. Sign-in for account-based services includes a confirmation that the user is not located in the EU/EEA before verification-code delivery, but technical access from outside Switzerland may still occur. Mandatory law in other jurisdictions may still apply in specific cases.

Helvety's legal baseline is Swiss data protection law (nDSG). Account-based services collect this non-EU/EEA location-attestation signal during sign-in on [helvety.com/auth](https://helvety.com/auth).

## Features

- **End-to-end encryption** - Sensitive contact content fields are encrypted client-side using your passkey (see [Encrypted vs. Non-Encrypted Fields](#encrypted-vs-non-encrypted-fields) below)
- **Category-grouped contacts** - `/contacts` opens into your contact list grouped by fixed categories (category headers and drop targets stay visible even when you have no contacts, consistent with stage columns in Tasks); contact details open in a large sheet
- **Main list search (client-side)** - After unlock, filter contacts in the browser by **name** (first + last), **email**, **description**, and **notes** content. Phone, birthday, and category are **not** searched. Search is local only (not sent to the server; not in the URL). While the search field has text, **drag-and-drop reorder and category up/down arrows are disabled**
- **Contact fields** - Each contact stores First Name(s), Last Name(s), Description, Email, Phone, Birthday, and Notes
- **Rich text notes** - Rich text editor for contact notes with formatting toolbar
  - Text formatting (bold, italic, underline, strikethrough)
  - Headings (H1, H2, H3)
  - Bullet and numbered lists
  - Link support
  - Unsaved changes detection with confirmation dialog
  - Manual note editing with unsaved-changes detection; editor toolbar uses icon buttons on desktop, with an orange **Save Changes** label when edits are pending
  - **Action panel** - View contact metadata dates and set category directly from the editor
- **Category movement controls** - Move contacts between categories via drag/drop and row-level up/down arrows when the main-list search field is empty
- **Controlled row-link prefetching** - Dense contact lists disable automatic `next/link` prefetch to prevent repeated background Flight (`?_rsc=...`) 404 noise from stale IDs while keeping click navigation fast
- **Consistency safeguards for list updates** - UI keeps optimistic interactions fast while ignoring stale in-flight refresh responses; category moves patch local list state immediately, and route revalidation runs after create/update/delete/reorder mutations to keep prefetched pages aligned
- **Task linking** - Link, unlink, and view task items from [Helvety Tasks](https://helvety.com/tasks) directly on the contact editor page
- **Note linking** - Link, unlink, and view notes from [Helvety Notes](https://helvety.com/notes) directly on the contact editor page
  - **Bidirectional** - Link and unlink notes from either the Contacts app or the Notes app for consistent cross-app UX
  - **Searchable picker** - Search your notes by decrypted title and link them with one click
  - **Deep links** - Click any linked note row to open the note detail view in the Notes app (opens in a new tab)
  - **Privacy** - Note titles are decrypted client-side for display in Contacts. Plaintext should not be intentionally sent to the server.
- **Self-Service Data Export** - Export all your contact data as a decrypted JSON file from the command bar; data is fetched **encrypted** from the server (per-account export rate limits apply) and decrypted **client-side** using your passkey (designed to support nDSG Art. 28 data portability requests). Export is only available while your encryption context is unlocked.
- **App Switcher** - Navigate between Helvety ecosystem apps (Home, Auth, Store, PDF, Tasks, Contacts, Notes)
- **Dark & Light mode** - Switch between dark and light themes

## Access Model

- 100% free to use
- No business/account quotas
- Technical and security safeguards may still apply for abuse prevention and platform reliability

## Crawl & Indexing Policy

- `apps/contacts` is intentionally non-indexable (authenticated E2EE workspace).
- `app/layout.tsx` sets `robots` to `noindex, nofollow`.
- `/contacts/robots.txt` disallows all crawling.
- `/contacts/sitemap.xml` is intentionally empty.

## Environment Variables

Copy `env.template` to `.env.local` and fill in values. All `NEXT_PUBLIC_*` vars are exposed to the client; others are server-only.

| Variable                               | Required | Server-only | Description                                                                                                                                                                                                                                        |
| -------------------------------------- | -------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Yes      | No          | Supabase project URL                                                                                                                                                                                                                               |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes      | No          | Publishable key (RLS applies)                                                                                                                                                                                                                      |
| `SUPABASE_SECRET_KEY`                  | Yes      | **Yes**     | Supabase secret key (recommended format: `sb_secret_...`; legacy `service_role` keys may still exist in older setups) for trusted server-side admin operations. It can bypass RLS where object privileges allow; must never be exposed to clients. |
| `UPSTASH_REDIS_REST_URL`               | Yes      | **Yes**     | Redis URL for rate limiting. Required by startup validation in all environments.                                                                                                                                                                   |
| `UPSTASH_REDIS_REST_TOKEN`             | Yes      | **Yes**     | Redis token for rate limiting. Required by startup validation in all environments.                                                                                                                                                                 |

> **Note:** App URLs are derived from `NODE_ENV` in `packages/shared/src/config.ts` — no URL env vars needed. Make sure your production URL (`https://helvety.com`) is in your Supabase Redirect URLs allowlist (Supabase Dashboard > Authentication > URL Configuration > Redirect URLs).
>
> **Monorepo CI (`ci:release`):** From the repository root, `bun run ci:release` sets `SKIP_ENV_VALIDATION=1` for the production `build` step so Next.js can compile without a complete local `.env`. `@helvety/shared/env-validation` uses schema-valid placeholders only for missing values and still validates credentials that are present; production Vercel builds set `VERCEL=1` so placeholder mode is off. See the repository root **README** (Automation).

## Security & Authentication

### End-to-End Encryption

Helvety Contacts uses end-to-end encryption (E2EE), as do Helvety Tasks and Helvety Notes. In supported browser flows, contact content fields are encrypted and decrypted in your browser using a key derived from your passkey. The server stores encrypted ciphertext plus non-secret key-derivation metadata (for example PRF salt and key-check value), and does not receive your raw encryption key.

**How it works:**

1. During setup at helvety.com/auth, you create a passkey with the WebAuthn PRF (Pseudo-Random Function) extension
2. The PRF extension produces a deterministic output tied to your passkey
3. Your browser derives an AES-256-GCM encryption key from the PRF output using HKDF
4. In supported flows, encryption and decryption of protected contact content happens locally in your browser
5. Additional Authenticated Data (AAD) binds each ciphertext to its specific record, preventing encrypted data from being moved or replayed in a different context
6. Record identifiers for encrypted data are generated on your device, not by the server
7. For encrypted content fields, the server stores encrypted ciphertext and key-derivation metadata (for example PRF salt and key-check value); required structural metadata is stored separately in plaintext for app functionality

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
| `category_id`              | Fixed category grouping                            |

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
2. Enter verification code from email → Continue to passkey sign-in
3. Redirected back to Contacts app → In many supported flows, encryption is already unlocked from the auth ceremony; depending on browser/session state, an additional auth-managed step may still be required

Sessions are shared across Helvety apps on `helvety.com` via path-based routing and the same session cookie (central sign-in at helvety.com/auth).

**Privacy Note:** Your email address is used primarily for authentication (verification codes and passkey-bound sign-in), account recovery, and essential service communications. We do not share your email with third parties for marketing purposes.

### Security Hardening

This application includes the following security hardening:

- **Session Management** - `proxy.ts` performs lightweight request setup (CSP, CSRF bootstrap, and Supabase session cookie refresh when auth cookies are present). Session/auth checks are enforced in page-level/server-side handlers.
- **Server-side page guards** - Protected routes await `requireE2eeAppPageAuth("/contacts")` from `@helvety/shared/e2ee-page-auth` (wraps `requireAuth` from `@helvety/shared/auth-guard`: fail-closed redirect when there is no session)
- **Shared E2EE app shell** - Contacts, Notes, and Tasks reuse `@helvety/ui` `E2eeAppRootLayout` and `E2eeAppNavbar` so session recovery, CSRF, encryption gate wiring, JSON-LD, and top navigation stay aligned across the three apps. Root layout errors use `@helvety/ui` `RootGlobalError`.
- **Redirect URI Validation** - Redirect URIs in auth-related flows are allowlist-validated via `@helvety/shared/redirect-validation` to reduce open-redirect risk
- **CSRF protection** - Token validation for **state-changing server actions**. Read paths (including contacts route handlers under the app base path, e.g. `/contacts/api/contacts` and `/contacts/api/contacts/[id]`, plus read-only server actions like export/link lookups) require an authenticated session and apply read-style rate limiting via shared auth helpers. Contacts write actions also reuse shared primitives for consistent validation/error handling, ownership-scoped reorder checks, capped export handling, and canonical link orchestration.
- **Rate limiting** - Mutations, reads, and encrypted **bulk export** are rate-limited (export uses the tighter `RATE_LIMITS.EXPORT` preset in shared rate limits)
- **Security Headers** - CSP, HSTS, and other security headers

**Legal Pages:** Privacy Policy, Terms of Service, and Impressum are hosted centrally on [helvety.com](https://helvety.com) and linked in the site footer. Services are primarily intended for customers in Switzerland, and account-based services collect a non-EU/EEA location-attestation signal during sign-in on [helvety.com/auth](https://helvety.com/auth). The legal baseline is Swiss data protection law (nDSG), and where other mandatory law applies in a specific case, Helvety follows those obligations. An informational cookie notice explains essential cookies and privacy-focused telemetry (Vercel Analytics across Helvety apps and Vercel Speed Insights on helvety.com).

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
- **[next-themes](https://github.com/pacocoursey/next-themes)** - Dark mode support (via shared `@helvety/ui` theme provider)

## Testing

Unit tests are written with [Vitest](https://vitest.dev/) and run in a jsdom environment via the shared config from `@helvety/config/vitest`. TypeScript is checked with `bun run type-check`, not inside Vitest.

Run these commands from `apps/contacts`:

| Script                  | Description                       |
| ----------------------- | --------------------------------- |
| `bun run test`          | Run all tests once                |
| `bun run test:watch`    | Run tests in watch mode           |
| `bun run test:coverage` | Run tests with v8 coverage report |

Test files follow the `**/*.test.{ts,tsx}` pattern and live next to the source they test. List behavior (`ContactList`) is covered for empty address books with fixed categories, the global empty state when no categories are configured, the flat list fallback, the **client-side search no-match** message (`emptySearchMessage`) instead of empty category shells, and the non-blocking refresh indicator while rows remain visible.

## Developer

This application is developed and maintained by [Helvety](https://helvety.com), a Swiss sole proprietorship (Einzelfirma) focused on security and user privacy.

Vercel Analytics is used across Helvety apps for privacy-oriented, aggregated/pseudonymized usage metrics. Vercel Speed Insights is currently enabled on [helvety.com](https://helvety.com) for performance telemetry. See our [Privacy Policy](https://helvety.com/privacy) for details.

For questions or inquiries, please contact us at [contact@helvety.com](mailto:contact@helvety.com). To report abuse, contact [contact@helvety.com](mailto:contact@helvety.com).

## License & Usage

This app is open source under the [MIT License](./LICENSE).

You may use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of this software, provided the copyright and permission notice are
included in substantial portions of the software.

The software is provided "as is", without warranty of any kind. See
[LICENSE](./LICENSE) for full legal terms.

**Helvety Contacts is free to use with no paid tiers or subscriptions.** Source code is available under the MIT License, and the software is provided "as is" without warranty.
