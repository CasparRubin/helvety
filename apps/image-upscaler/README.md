# Helvety Image Upscaler

![Next.js](https://img.shields.io/badge/Next.js-16.x-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19.x-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

Privacy-focused, browser-based image upscaler. Upscale PNG/JPG/WebP files directly in your browser with no account required.

**App:** [helvety.com/image-upscaler](https://helvety.com/image-upscaler)

> **Part of the [Helvety monorepo](https://github.com/CasparRubin/helvety).** This app lives in `apps/image-upscaler/`. See the root README for monorepo setup instructions.

**Privacy Approach** - Image processing runs in your browser. Uploaded image contents are not intended to be uploaded to Helvety servers for image conversion. We use Vercel Analytics across Helvety apps for usage metrics and Vercel Speed Insights on [helvety.com](https://helvety.com) for performance telemetry (see [Privacy Policy](https://helvety.com/privacy)).

Helvety Image Upscaler does not require login and is free to use. Operational safeguards are enforced for stability and abuse prevention.

## Service Availability

Helvety services are primarily intended for customers in Switzerland. Sign-in for account-based services includes a confirmation that the user is not located in the EU/EEA before verification-code delivery, but technical access from outside Switzerland may still occur. Mandatory law in other jurisdictions may still apply in specific cases.

Helvety's legal baseline is Swiss data protection law (nDSG). Account-based services collect this non-EU/EEA location-attestation signal during sign-in on [helvety.com/auth](https://helvety.com/auth). Note: Helvety Image Upscaler itself requires no login or account; this confirmation applies to other Helvety apps that require authentication.

## Features

- **WebGPU-first processing** - Prefers accelerated runtime paths when supported, with compatibility fallback
- **Upscale controls** - Scale mode (`2x`, `4x`) and target-dimension mode (`width` or `height`)
- **Batch queue** - Process up to 5 images sequentially with per-item status
- **Per-image export** - Download each processed image individually
- **Dark & Light mode support** - Switch between dark and light themes
- **App Switcher** - Navigate between Helvety ecosystem apps (Home, Auth, Store, PDF, Image Upscaler, Tasks, Contacts, Notes)
- **No login required** - Use the tool without an account

## Limits

- Maximum 5 files per batch
- Supported formats: PNG, JPG/JPEG, WebP
- Maximum file size: 25MB per image
- Maximum pixel count: 32,000,000 pixels per image

## Crawl & Indexing Policy

- `apps/image-upscaler` is publicly indexable.
- `/image-upscaler/robots.txt` allows crawl, disallows non-content operational paths (`/api`, `/auth`), and advertises `/image-upscaler/sitemap.xml`.
- `/image-upscaler/sitemap.xml` lists canonical absolute public URLs for the app.
- Metadata canonical and robots directives are defined in `app/layout.tsx` and kept consistent with the sitemap.

## Security

**Note:** End-to-end encryption is not used in this app. E2EE is used by [Helvety Tasks](https://helvety.com/tasks), [Helvety Contacts](https://helvety.com/contacts), and [Helvety Notes](https://helvety.com/notes).

### Security Hardening

This application includes the following security hardening:

- **Session / request setup** - `proxy.ts` (via `@helvety/shared/proxy`) sets CSP headers, CSRF cookie bootstrap, and Supabase session cookie refresh when auth cookies are present. The app itself stays usable without login.
- **Security Headers** - CSP, HSTS, and other security headers
- **Rate Limiting** - Request-level protections are applied by shared platform controls where relevant
- **Input guards** - File type, size, and pixel-count checks enforce operational limits before processing
- **Auth Redirect Safety** - Redirect URI allowlist validation is enforced by centralized auth flows in `apps/auth`

**Legal Pages:** Privacy Policy, Terms of Service, and Impressum are hosted centrally on [helvety.com](https://helvety.com) and linked in the site footer. Services are primarily intended for customers in Switzerland, and account-based services collect a non-EU/EEA location-attestation signal during sign-in on [helvety.com/auth](https://helvety.com/auth). The legal baseline is Swiss data protection law (nDSG), and where other mandatory law applies in a specific case, Helvety follows those obligations. An informational cookie notice explains essential cookies and privacy-focused telemetry (Vercel Analytics across Helvety apps and Vercel Speed Insights on helvety.com).

**Abuse Reporting:** Abuse reports can be submitted to [contact@helvety.com](mailto:contact@helvety.com). The Impressum on [helvety.com/impressum](https://helvety.com/impressum#abuse) includes an abuse reporting section with guidance for both users and law enforcement.

## Environment Variables

Copy `env.template` to `.env.local` and fill in values. All `NEXT_PUBLIC_*` vars are exposed to the client; others are server-only.

| Variable                               | Required | Server-only | Description                                               |
| -------------------------------------- | -------- | ----------- | --------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Yes      | No          | Supabase project URL for client auth/session integrations |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes      | No          | Publishable key (RLS applies)                             |

> **Note:** App URLs are derived from `NODE_ENV` in `packages/shared/src/config.ts` - no URL env vars needed. Make sure your production URL (`https://helvety.com`) is in your Supabase Redirect URLs allowlist (Supabase Dashboard > Authentication > URL Configuration > Redirect URLs).
>
> **Monorepo CI (`ci:release`):** From the repository root, `bun run ci:release` sets `SKIP_ENV_VALIDATION=1` for the production `build` step so Next.js can compile without a complete local `.env`. `@helvety/shared/env-validation` uses schema-valid placeholders only for missing values and still validates credentials that are present; production Vercel builds set `VERCEL=1` so placeholder mode is off. See the repository root **README** (Automation).

## Tech Stack

This project is built with modern web technologies:

- **[Next.js 16.x](https://nextjs.org/)** - React framework with App Router
- **[React 19.x](https://react.dev/)** - UI library
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[onnxruntime-web](https://www.npmjs.com/package/onnxruntime-web)** - Browser inference runtime
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first CSS framework
- **[shadcn/ui](https://ui.shadcn.com/)** - High-quality React component library
- **[Radix UI](https://www.radix-ui.com/)** - Unstyled, accessible component primitives
- **[Lucide React](https://lucide.dev/)** - Icon library
- **[next-themes](https://github.com/pacocoursey/next-themes)** - Dark mode support

## Testing

Unit tests are written with [Vitest](https://vitest.dev/) and run in a jsdom environment via the shared config from `@helvety/config/vitest`. TypeScript is checked with `bun run type-check`, not inside Vitest.

Run these commands from `apps/image-upscaler`:

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
