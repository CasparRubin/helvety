# Cookies and Site Footer

Canonical developer reference for Helvety web zones on `helvety.com`. User-facing legal text lives on the [Privacy Policy](https://helvety.com/privacy) (Section 8).

## Site footer (`@helvety/ui/footer`)

Mounted by `HelvetyPublicShellRootLayout` on every Next.js zone.

The footer states that the site uses essential cookies and similar storage for security and core functionality (for example theme preference). It links to **Privacy** for storage details (not a separate cookie banner).

- Gateway (`apps/web`): relative `/privacy` link (`footerExternal: false`).
- Sub-zones: absolute `https://helvety.com/privacy` with `target="_blank"`.

**Five zones:** `web`, `store`, `pdf`, `image-editor`, `ocr`.

We do not mount third-party analytics or advertising trackers in shared root layouts.

## First-party HTTP cookies (summary)

`apps/web` uses the `public-marketing` proxy profile (CSP only).

Production cookie domain (when cookies are set): `.helvety.com` (`packages/shared/src/config.ts`).

## Browser storage (not cookies)

Documented in Privacy §8 table (SSOT: `apps/web/lib/legal-cookies-disclosure.ts`):

| Storage                                | Apps      | Purpose                           |
| -------------------------------------- | --------- | --------------------------------- |
| Theme preference (`localStorage`)      | All zones | Remember dark/light mode          |
| `helvety-pdf-columns` (`localStorage`) | `pdf`     | Remember PDF viewer column layout |

## When to update legal copy

See [`docs/legal-change-guardrails.md`](./legal-change-guardrails.md). Any change to new cookies/storage keys or footer disclosure requires updating:

- `apps/web/app/privacy/page.tsx` (and usually terms/impressum `lastReviewed` in sync)
- `apps/web/lib/legal-cookies-disclosure.ts` + `apps/web/app/legal-cookies-disclosure.test.ts`
- This document if operational facts change

Regression tests: `bun run test` in `apps/web` (`legal-cookies-disclosure.test.ts`, `legal-metadata.test.ts`, `legal-privacy-tables.test.ts`, `legal-public-tools.test.ts`).
