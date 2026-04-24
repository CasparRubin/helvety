# Helvety PDF

![Next.js](https://img.shields.io/badge/Next.js-16.x-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19.x-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

A privacy-focused, browser-based PDF toolkit. Merge, reorder, rotate, and extract pages from PDF files and images. In this architecture, file contents are processed in your browser for supported operations and are not intended to be uploaded to Helvety servers for file conversion. Engineered, Designed & Made in Switzerland.

**App:** [helvety.com/pdf](https://helvety.com/pdf)

> **Part of the [Helvety monorepo](https://github.com/CasparRubin/helvety).** This app lives in `apps/pdf/`. See the root README for monorepo setup instructions.

**Privacy Approach** - File contents are processed in your browser and are not intended to be uploaded to Helvety servers for file conversion. We use Vercel Analytics across Helvety apps for usage metrics and Vercel Speed Insights on [helvety.com](https://helvety.com) for performance telemetry (see [Privacy Policy](https://helvety.com/privacy)).

Helvety PDF does not require login and is free to use. The app does not enforce a page-count cap. A 100MB per-file validation remains in place as an operational safeguard for browser stability and abuse prevention.

## Service Availability

Helvety services are primarily intended for customers in Switzerland. Sign-in for account-based services includes a confirmation that the user is not located in the EU/EEA before verification-code delivery, but technical access from outside Switzerland may still occur. Mandatory law in other jurisdictions may still apply in specific cases.

Helvety's legal baseline is Swiss data protection law (nDSG). Account-based services collect this non-EU/EEA location-attestation signal during sign-in on [helvety.com/auth](https://helvety.com/auth). Note: Helvety PDF itself requires no login or account; this confirmation applies to other Helvety apps that require authentication.

## Features

- **Browser-based file processing** - Core operations run in your browser
- **PDF and image support** - Upload PDF files and images (PNG, JPEG, WebP, GIF, etc.)
- **Page thumbnails preview** - Visual preview of all pages before processing
- **Drag & drop reordering** - Rearrange pages by dragging thumbnails
- **Page rotation** - Rotate individual pages by 90° increments
- **Page deletion** - Remove unwanted pages from your documents
- **Page extraction** - Extract individual pages as separate PDF files
- **Multi-file merging** - Combine multiple PDF files and images into one PDF
- **Drag & drop upload** - Simple file upload interface
- **Customizable grid layout** - Adjust pages per row to accommodate different page sizes
- **Dark & Light mode support** - Switch between dark and light themes
- **App Switcher** - Navigate between Helvety ecosystem apps (Home, Auth, Store, PDF, Tasks, Contacts, Notes)
- **Operational safeguards** - 100MB per-file validation for stability; no business/account quotas and no app-enforced page-count cap. Practical throughput depends on browser/device memory and performance
- **No login required** - Use the tool without an account

## How It Works

1. **Upload Files** - Drag and drop or click to browse and select multiple PDF files and/or images
2. **Preview & Manage** - See thumbnails of all pages, reorder by dragging, rotate, or delete pages as needed
3. **Download** - Your processed PDF downloads automatically with a timestamped filename

## Security

**Note:** End-to-end encryption is not used in this app. E2EE is used by [Helvety Tasks](https://helvety.com/tasks), [Helvety Contacts](https://helvety.com/contacts), and [Helvety Notes](https://helvety.com/notes).

### Security Hardening

This application includes the following security hardening:

- **Session / request setup** - `proxy.ts` (via `@helvety/shared/proxy`) sets CSP headers (including `worker-src`/`img-src` allowances needed for PDF.js), CSRF cookie bootstrap, and Supabase session cookie refresh when auth cookies are present. It is not the primary auth boundary for other apps; PDF itself stays usable without login.
- **Security Headers** - CSP, HSTS, and other security headers
- **Rate Limiting** - Request-level protections are applied by shared platform controls where relevant
- **File Size Validation** - Maximum 100MB per file enforced client-side
- **Auth Redirect Safety** - Redirect URI allowlist validation is enforced by centralized auth flows in `apps/auth`

**Legal Pages:** Privacy Policy, Terms of Service, and Impressum are hosted centrally on [helvety.com](https://helvety.com) and linked in the site footer. Services are primarily intended for customers in Switzerland, and account-based services collect a non-EU/EEA location-attestation signal during sign-in on [helvety.com/auth](https://helvety.com/auth). The legal baseline is Swiss data protection law (nDSG), and where other mandatory law applies in a specific case, Helvety follows those obligations. An informational cookie notice explains essential cookies and privacy-focused telemetry (Vercel Analytics across Helvety apps and Vercel Speed Insights on helvety.com).

**Abuse Reporting:** Abuse reports can be submitted to [contact@helvety.com](mailto:contact@helvety.com). The Impressum on [helvety.com/impressum](https://helvety.com/impressum#abuse) includes an abuse reporting section with guidance for both users and law enforcement.

## Environment Variables

Copy `env.template` to `.env.local` and fill in values. All `NEXT_PUBLIC_*` vars are exposed to the client; others are server-only.

| Variable                               | Required | Server-only | Description                                               |
| -------------------------------------- | -------- | ----------- | --------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Yes      | No          | Supabase project URL for client auth/session integrations |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes      | No          | Publishable key (RLS applies)                             |

> **Note:** App URLs are derived from `NODE_ENV` in `packages/shared/src/config.ts` — no URL env vars needed. Make sure your production URL (`https://helvety.com`) is in your Supabase Redirect URLs allowlist (Supabase Dashboard > Authentication > URL Configuration > Redirect URLs).

## Tech Stack

This project is built with modern web technologies:

- **[Next.js 16.x](https://nextjs.org/)** - React framework with App Router
- **[React 19.x](https://react.dev/)** - UI library
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[pdf-lib](https://pdf-lib.js.org/)** - PDF manipulation and creation
- **[react-pdf](https://www.npmjs.com/package/react-pdf)** - React components for PDF display
- **[pdfjs-dist](https://mozilla.github.io/pdf.js/)** - PDF rendering engine (used by react-pdf)
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first CSS framework
- **[shadcn/ui](https://ui.shadcn.com/)** - High-quality React component library
- **[Radix UI](https://www.radix-ui.com/)** - Unstyled, accessible component primitives
- **[Lucide React](https://lucide.dev/)** - Icon library
- **[next-themes](https://github.com/pacocoursey/next-themes)** - Dark mode support

## Architecture & Performance

This application is built with performance and code quality in mind:

- **LRU Cache Strategy** - Uses Least Recently Used (LRU) cache eviction for optimal memory management
- **Adaptive Processing** - Uses worker execution for heavy extract/merge operations with main-thread adaptive batching as deterministic fallback
- **PDF.js Worker Delivery** - Uses a local, basePath-aware worker URL (`/pdf/pdf.worker.min.mjs`) sourced from `react-pdf`'s resolved `pdfjs-dist` dependency to keep API and worker versions aligned in multi-zone routing
- **Optimized Memoization** - Memoization with early short-circuiting to reduce re-renders
- **Strict TypeScript** - Strict type safety with `noUncheckedIndexedAccess`, `noImplicitReturns`, `noUnusedLocals`, and other strict compiler options
- **Error Handling** - Centralized error handling with detailed context and recovery strategies
- **Code Organization** - Modular architecture with extracted utilities and reusable components

### Processing Pipeline (Capability-Driven)

The PDF app uses a capability-driven router for heavy operations (extract/merge):

- `gpu-worker` -> Dedicated worker + OffscreenCanvas/WebGL-assisted image preprocessing (preferred default when supported)
- `worker` -> Dedicated worker without GPU preference
- `main-thread` -> Deterministic fallback path (existing behavior)

Runtime routing is capability-based, with automatic downgrade to `main-thread` when worker/GPU paths fail.

### Benchmark Matrix (Execution Checklist)

Run the same workload in each mode (`main-thread`, `worker`, `gpu-worker`) and capture:

- UI responsiveness (input/scroll lag while processing)
- Total completion time
- Peak memory usage
- Error rate and fallback frequency

Suggested scenarios:

- Small: 1-2 files, <=20 pages
- Medium: 3-6 files, 50-150 pages
- Large: mixed PDFs/images, >=300 pages

## Testing

Unit tests are written with [Vitest](https://vitest.dev/) and run in a jsdom environment via the shared config from `@helvety/config/vitest`. TypeScript is checked with `bun run type-check`, not inside Vitest.

Run these commands from `apps/pdf`:

| Script                  | Description                       |
| ----------------------- | --------------------------------- |
| `bun run test`          | Run all tests once                |
| `bun run test:watch`    | Run tests in watch mode           |
| `bun run test:coverage` | Run tests with v8 coverage report |

Test files follow the `**/*.test.{ts,tsx}` pattern and live next to the source they test.

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
