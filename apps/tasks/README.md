# Helvety Tasks

![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19.2.4-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![License](https://img.shields.io/badge/License-All%20Rights%20Reserved-red?style=flat-square)

A privacy-focused task management app with client-side encryption for sensitive fields. Required structural metadata remains plaintext for app functionality. Engineered & Designed in Switzerland.

**App:** [helvety.com/tasks](https://helvety.com/tasks)

> **Part of the [Helvety monorepo](https://github.com/CasparRubin/helvety).** This app lives in `apps/tasks/`. See the root README for monorepo setup instructions.

## Service Availability

Helvety services are primarily intended for customers in Switzerland. New account creation currently includes a Switzerland location confirmation step for account-based services, but technical access from outside Switzerland may still occur. Mandatory law in other jurisdictions may still apply in specific cases.

Helvety's legal baseline is Swiss data protection law (nDSG). Account-based services ask new users to confirm Switzerland-based usage during account creation on [helvety.com/auth](https://helvety.com/auth) before a new account is created.

## Features

- **End-to-end encryption** - Sensitive task content fields are encrypted client-side using your passkey (see [Encrypted vs. Non-Encrypted Fields](#encrypted-vs-non-encrypted-fields) below)
- **Units, Spaces, and Items** - Hierarchical organization: Units (top-level containers) → Spaces (teams/projects) → Items (tasks)
- **Rich text descriptions** - Rich text editor for item descriptions with formatting toolbar
  - Text formatting (bold, italic, underline, strikethrough)
  - Headings (H1, H2, H3)
  - Bullet and numbered lists
  - Link support
  - Manual save with unsaved-changes feedback in the Save button
  - **Action panel** - View created/modified dates, set start and end date/time, view immutable built-in item stages/labels, and set priority directly from the editor; sections are collapsible (all open by default on desktop; collapsed on mobile except Dates)
- **Priority levels** - Assign priority to items (Low, Normal, High, Urgent) with color-coded indicators
- **Fixed labels** - An immutable built-in item label set is enforced across the app
- **Fixed stages** - Immutable built-in stage sets are enforced for Units, Spaces, and Items
- **Encrypted file attachments** - Upload, download, and manage file attachments on items (images, documents, etc.) with drag-and-drop support; files are losslessly compressed (when beneficial) then encrypted client-side before upload
- **Contact linking** - Link contacts from [Helvety Contacts](https://helvety.com/contacts) to any Unit, Space, or Item
  - **Bidirectional** - Link and unlink from either the Tasks app or the Contacts app for consistent cross-app UX
  - **Searchable picker** - Search your contacts by name or email and link them with one click
  - **Contact display** - Shows name and email; description, phone, and birthday are decrypted but not displayed in the compact link view. A flag indicates whether the contact has notes
  - **Deep links** - Click any contact row to view or edit the full contact details in the Contacts app (opens in a new tab)
  - **Privacy** - Contact notes content is not decrypted in the Tasks app by design; only a has-notes indicator is shown
- **Drag & drop reordering** - Rearrange entries on desktop; mobile uses up/down arrows for ordering controls
- **Self-Service Data Export** - Export all your task data as a decrypted JSON file from the command bar; data is fetched encrypted from the server and decrypted client-side using your passkey (designed to support nDSG Art. 28 data portability requests). Export is only available while your encryption context is unlocked.
- **App Switcher** - Navigate between Helvety ecosystem apps (Home, Auth, Store, PDF, Tasks, Contacts)
- **Dark & Light mode** - Switch between dark and light themes

## Current Usage Limits

- Max **10 Units** per user
- Max **15 Spaces** per Unit
- Max **250 Items** per Space
- Max **2 attachments** per Item

## Environment Variables

Copy `env.template` to `.env.local` and fill in values. All `NEXT_PUBLIC_*` vars are exposed to the client; others are server-only.

| Variable                               | Required | Server-only | Description                                                                                                          |
| -------------------------------------- | -------- | ----------- | -------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Yes      | No          | Supabase project URL                                                                                                 |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes      | No          | Publishable key (RLS applies)                                                                                        |
| `SUPABASE_SECRET_KEY`                  | Yes      | **Yes**     | Service role key for server-side admin operations (including attachment storage); bypasses RLS. Must not be exposed. |
| `UPSTASH_REDIS_REST_URL`               | Yes      | **Yes**     | Redis URL for rate limiting. Required by startup validation in all environments.                                     |
| `UPSTASH_REDIS_REST_TOKEN`             | Yes      | **Yes**     | Redis token for rate limiting. Required by startup validation in all environments.                                   |

> **Note:** App URLs are derived from `NODE_ENV` in `packages/shared/src/config.ts` — no URL env vars needed. Make sure your production URL (`https://helvety.com`) is in your Supabase Redirect URLs allowlist (Supabase Dashboard > Authentication > URL Configuration > Redirect URLs).

## Security & Authentication

### End-to-End Encryption

Helvety Tasks uses end-to-end encryption (E2EE), as does Helvety Contacts. In supported browser flows, task content fields are encrypted and decrypted in your browser using a key derived from your passkey. The server stores encrypted ciphertext plus PRF salt parameters, and does not receive your raw encryption key.

**How it works:**

1. During setup at helvety.com/auth, you create a passkey with the WebAuthn PRF (Pseudo-Random Function) extension
2. The PRF extension produces a deterministic output tied to your passkey
3. Your browser derives an AES-256-GCM encryption key from the PRF output using HKDF
4. In supported flows, encryption and decryption of protected task content happens locally in your browser
5. Additional Authenticated Data (AAD) binds each ciphertext to its specific record, preventing encrypted data from being moved or replayed in a different context
6. Record identifiers for encrypted data are generated on your device, not by the server
7. For encrypted content fields, the server stores encrypted ciphertext and PRF salt values; required structural metadata is stored separately in plaintext for app functionality

**Important:** Your passkey controls decryption access to encrypted content. If you lose access to your passkeys and do not have any synced or backup passkey available, encrypted content may be unrecoverable. To reduce this risk, we recommend saving passkeys in a synced password manager.

#### Encrypted vs. Non-Encrypted Fields

**Encrypted fields** (AES-256-GCM, client-side before storage):

| Entity     | Encrypted Fields                                                                |
| ---------- | ------------------------------------------------------------------------------- |
| Unit       | `title`, `description`                                                          |
| Space      | `title`, `description`                                                          |
| Item       | `title`, `description`, `start_date`, `end_date`                                |
| Attachment | file content (binary), metadata (`filename`, `mime_type`, `size`, `compressed`) |

**Non-encrypted structural metadata** (stored in plaintext to enable application functionality):

| Field                                         | Purpose                                                         |
| --------------------------------------------- | --------------------------------------------------------------- |
| Record identifiers (`id`)                     | Generated client-side; bound to ciphertext via AAD              |
| `user_id`                                     | Row Level Security (RLS)                                        |
| `created_at`, `updated_at`                    | Timestamps                                                      |
| `sort_order`                                  | Display ordering                                                |
| `priority` (Item)                             | Priority level (0-3 numeric)                                    |
| `stage_id`, `label_id`, `space_id`, `unit_id` | Entity relationships                                            |
| `storage_path` (Attachment)                   | Storage location (`{random_prefix}/{user_id}/{attachment_id}`)  |
| Audit logs                                    | Timestamps, IPs, file sizes, user IDs, randomized storage paths |

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

Authentication is handled by the centralized Helvety Auth service (`helvety.com/auth`) using **email + passkey authentication** with no passwords required. **Login is required** because all task content is encrypted and tied to your passkey.

**New Users:**

1. Click "Sign in" → Redirected to helvety.com/auth → Enter email address
2. Enter verification code from email → Verify email ownership → Session established
3. Create passkey with PRF extension → Encryption key derived automatically
4. Redirected back to Tasks app → Data encrypted with your passkey

**Returning Users:**

1. Click "Sign in" → Redirected to helvety.com/auth → Enter email address
2. Sign in with passkey (no email sent; existing users with a passkey skip email verification)
3. Redirected back to Tasks app → In many supported flows, encryption is already unlocked from the auth ceremony; depending on browser/session state, an additional auth-managed step may still be required

Sessions are shared across all Helvety apps via cookie-based SSO (all apps are served under `helvety.com` via path-based routing).

**Privacy Note:** Your email address is used primarily for authentication (verification codes for new users, passkey for returning), account recovery, and essential service communications. We do not share your email with third parties for marketing purposes.

### Security Hardening

This application includes the following security hardening:

- **Session Management** - `proxy.ts` performs lightweight request setup (CSP headers and CSRF bootstrap). Session/auth checks are enforced in page-level/server-side handlers.
- **Server-side Page Guards** - Authentication checks in page-level Server Components via `@helvety/shared/auth-guard` with retry logic for transient failures (aligned with current Next.js security guidance)
- **Redirect URI Validation** - Redirect URIs in auth-related flows are allowlist-validated via `@helvety/shared/redirect-validation` to reduce open-redirect risk
- **CSRF Protection** - Token-based protection for state-changing operations
- **Rate Limiting** - Protection against brute force attacks
- **Attachment Audit Logging** - Structured logging for file attachment upload, download, and deletion events (persisted to `attachment_audit_logs` table; target retention up to 6 months / 183 days under current operational policy, subject to legal hold/dispute requirements)
- **Security Headers** - CSP, HSTS, and other security headers

**Legal Pages:** Privacy Policy, Terms of Service, and Impressum are hosted centrally on [helvety.com](https://helvety.com) and linked in the site footer. Services are primarily intended for customers in Switzerland, and account-based services ask new users to confirm Switzerland-based usage during account creation on [helvety.com/auth](https://helvety.com/auth) (before a new account is created). The legal baseline is Swiss data protection law (nDSG), and where other mandatory law applies in a specific case, Helvety follows those obligations. An informational cookie notice explains essential cookies and privacy-focused telemetry (Vercel Analytics and Speed Insights).

**Abuse Reporting:** Abuse reports can be submitted to [contact@helvety.com](mailto:contact@helvety.com). The Impressum on [helvety.com/impressum](https://helvety.com/impressum#abuse) includes an abuse reporting section with guidance for both users and law enforcement.

**Attachment Audit Logging:** File attachment uploads, downloads, and deletions are logged with non-encrypted metadata (timestamps, file sizes, IP addresses, user IDs, randomized storage paths, and user agent) to the `attachment_audit_logs` database table. This audit trail has a target retention window up to 6 months (183 days) under current operational policy, subject to legal hold, incident handling, and platform constraints. It supports law enforcement cooperation under valid Swiss court orders. After account deletion, direct user references are removed or de-identified where applicable. Encrypted file content and encrypted metadata are not intended to be logged.

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

**Helvety Tasks availability and pricing can change over time.** See [helvety.com/tasks](https://helvety.com/tasks) and related store pages for current terms.

See [LICENSE](./LICENSE) for full legal terms.
