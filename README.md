# Helvety Tasks

![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19.2.4-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![License](https://img.shields.io/badge/License-All%20Rights%20Reserved-red?style=flat-square)

A private and secure task management app with end-to-end encryption. All your data is encrypted and only you can read it.

**App:** [tasks.helvety.com](https://tasks.helvety.com)

## Service Availability

Helvety services are intended exclusively for customers located in Switzerland. **We are not able to serve customers in the EU/EEA.**

As a Swiss company, Helvety operates solely under the Swiss Federal Act on Data Protection (nDSG). Because we do not target or serve customers in the EU/EEA, the GDPR does not apply. For this reason, new users are asked to confirm during account creation on [auth.helvety.com](https://auth.helvety.com) that they are located in Switzerland before any personal data is stored.

## Features

- **End-to-end encryption** - All task data is encrypted client-side using your passkey; we never see your data
- **Units, Spaces, and Items** - Hierarchical organization: Units (top-level containers) → Spaces (teams/projects) → Items (tasks)
- **Rich text descriptions** - Rich text editor for item descriptions with formatting toolbar
  - Text formatting (bold, italic, underline, strikethrough)
  - Headings (H1, H2, H3)
  - Bullet and numbered lists
  - Link support
  - Auto-save with unsaved changes indicator
  - **Action panel** - View dates and set item stage, label, and priority directly from the editor; sections are collapsible (all open by default on desktop; collapsed on mobile except Dates)
- **Priority levels** - Assign priority to items (Low, Normal, High, Urgent) with color-coded indicators
- **Label management** - Categorize items with labels (e.g., Bug, Feature, Improvement)
  - **Default labels** - Built-in label set applied to every space: Bug, Change Request, Feature, Improvement, Internal Task
  - **Custom label configurations** - Create your own label setups with custom names, colors, and Lucide icons
  - **One label per item** - Each item can have exactly one label assigned
  - **Space-level configuration** - All items within a space share the same label config
- **Stage management** - Create and manage reusable stage configurations for organizing items (e.g., To Do, In Progress, Done)
  - **Default configurations** - Built-in stage setups for Units (Work/Home), Spaces (Upcoming/In Progress/Completed), and Items (full workflow from Backlog to Completed)
  - **Custom configurations** - Create your own stage setups with custom names, colors, and Lucide icons
  - **Color picker** - Choose from preset colors or use the custom color picker for any hex color
  - **Icon support** - Each stage can have a Lucide icon for visual identification
  - **Rows shown by default** - Control how many items are visible per stage (0 = collapsed, N = show N items with "Show all" link)
- **Encrypted file attachments** - Upload, download, and manage file attachments on items (images, documents, etc.) with drag-and-drop support; files are encrypted client-side before upload
- **Contact linking** - Link contacts from [Helvety Contacts](https://contacts.helvety.com) to any Unit, Space, or Item
  - **Bidirectional** - Link and unlink from either the Tasks app or the Contacts app for consistent cross-app UX
  - **Searchable picker** - Search your contacts by name or email and link them with one click
  - **Contact display** - Shows name, email, and a flag indicating whether the contact has notes
  - **Deep links** - Click any contact row to view or edit the full contact details in the Contacts app (opens in a new tab)
  - **Privacy** - Contact notes content is never decrypted in the Tasks app; only a has-notes indicator is shown
- **Drag & drop reordering** - Rearrange items within and between stages on desktop; mobile uses up/down arrows to move items between stages
- **Self-Service Data Export** - Export all your task data as a decrypted JSON file from the profile menu; data is fetched encrypted from the server and decrypted client-side using your passkey (nDSG Art. 28 compliance). Export is only available while your encryption context is unlocked.
- **App Switcher** - Navigate between Helvety ecosystem apps (Home, Auth, Store, PDF, Tasks, Contacts)
- **Dark & Light mode** - Switch between dark and light themes

## Security & Authentication

### End-to-End Encryption

Helvety Tasks uses end-to-end encryption (E2EE), as does Helvety Contacts. Your task data is encrypted and decrypted entirely in your browser using a key derived from your passkey. The server stores only encrypted data and PRF salt parameters. The server never possesses your encryption key.

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

Authentication is handled by the centralized Helvety Auth service (`auth.helvety.com`) using **email + passkey authentication** with no passwords required. **Login is required** because all task data is encrypted and tied to your passkey.

**New Users:**

1. Click "Sign in" → Redirected to auth.helvety.com → Enter email address
2. Enter verification code from email → Verify email ownership
3. Create passkey with PRF extension → Verify passkey → Session established
4. Redirected back to Tasks app → Data encrypted with your passkey

**Returning Users:**

1. Click "Sign in" → Redirected to auth.helvety.com → Enter email address
2. Sign in with passkey (no email sent; existing users with a passkey skip email verification)
3. Redirected back to Tasks app → Unlock encryption with passkey

Sessions are shared across all `*.helvety.com` subdomains via cookie-based SSO.

**Privacy Note:** Your email address is used solely for authentication (verification codes for new users, passkey for returning) and account recovery. We do not share your email with third parties for marketing purposes.

### Security Hardening

This application includes the following security hardening:

- **Session Management** - Session validation and refresh via `proxy.ts` using `getClaims()` (local JWT validation; Auth API only when refresh is needed; wrapped in try/catch for resilience against transient network failures)
- **Server Layout Guards** - Authentication checks in Server Components via `lib/auth-guard.ts` with retry logic for transient failures (CVE-2025-29927 compliant)
- **Redirect URI Validation** - All redirect URIs validated against allowlist via `lib/redirect-validation.ts` to prevent open redirect attacks
- **CSRF Protection** - Token-based protection for state-changing operations
- **Rate Limiting** - Protection against brute force attacks
- **Attachment Audit Logging** - Structured logging for file attachment upload and deletion events (persisted to `attachment_audit_logs` table with 6-month retention)
- **Security Headers** - CSP, HSTS, and other security headers

**Legal Pages:** Privacy Policy, Terms of Service, and Impressum are hosted centrally on [helvety.com](https://helvety.com) and linked in the site footer. Services are exclusively available to customers in Switzerland and are not offered to EU/EEA residents; new users must confirm they are located in Switzerland during account creation on [auth.helvety.com](https://auth.helvety.com) (before any personal data is stored). Only the Swiss Federal Act on Data Protection (nDSG) applies; the GDPR does not apply. An informational cookie notice informs visitors that only essential cookies are used.

**Abuse Reporting:** Abuse reports can be submitted to [contact@helvety.com](mailto:contact@helvety.com). The Impressum on [helvety.com/impressum](https://helvety.com/impressum#abuse) includes an abuse reporting section with guidance for both users and law enforcement.

**Attachment Audit Logging:** File attachment uploads and deletions are logged with non-encrypted metadata (timestamps, file sizes, IP addresses, user IDs) to the `attachment_audit_logs` database table. This audit trail is retained for up to 6 months in accordance with the Privacy Policy and supports law enforcement cooperation under valid Swiss court orders. Encrypted file content and metadata are never logged.

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

Vercel Analytics and Vercel Speed Insights are used across all Helvety apps for privacy-focused, anonymous page view and performance statistics. See our [Privacy Policy](https://helvety.com/privacy) for details.

For questions or inquiries, please contact us at [contact@helvety.com](mailto:contact@helvety.com). To report abuse, contact [contact@helvety.com](mailto:contact@helvety.com).

## License & Usage

> **This is NOT open source software.**

This repository is public so users can inspect and verify the application's behavior and security.

**All Rights Reserved.** No license is granted for any use of this code. You may:

- View and inspect the code

You may NOT:

- Copy, use, or reuse the code in any form
- Redistribute, publish, or share the code
- Modify, adapt, or create derivative works
- Sell, sublicense, or commercially exploit the code
- Reverse engineer or decompile the code

**This is a free task management application accessible at [tasks.helvety.com](https://tasks.helvety.com).** No subscription is required.

See [LICENSE](./LICENSE) for full legal terms.
