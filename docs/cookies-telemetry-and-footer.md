# Cookies, storage, and site footer

Canonical developer reference for Helvety web zones on `helvety.com`. User-facing legal text lives on the [Privacy Policy](https://helvety.com/privacy) (Section 8).

## Site footer (`@helvety/ui/footer`)

Mounted by `HelvetyPublicShellRootLayout` on every Next.js zone.

The footer shows a centered row: copyright plus **Impressum** / Privacy / Terms (middots between the legal links). On narrow widths, copyright wraps alone onto the first row and the three legal links stay together on the second. Contact is in the navbar About dialog. Storage disclosure lives on Privacy §8 only (no cookie banner or inline storage blurb in the footer).

- Gateway (`apps/web`): relative `/privacy` link (`footerExternal: false`).
- Sub-zones: absolute `https://helvety.com/privacy` with `target="_blank"`.

**Five zones:** `web`, `store`, `pdf`, `image-editor`, `ocr`.

We do not mount third-party analytics or advertising trackers in shared root layouts.

## HTTP cookies

These public zones do not set first-party HTTP cookies for auth, analytics, or preferences. Preference storage uses `localStorage` only (see below).

## Browser storage (localStorage)

Documented in Privacy §8 table (SSOT: `apps/web/lib/legal-cookies-disclosure.ts`):

| Storage                                | Apps                  | Purpose                                                       |
| -------------------------------------- | --------------------- | ------------------------------------------------------------- |
| Theme preference (`localStorage`)      | All zones             | Remember dark/light mode                                      |
| `helvety-pdf-columns` (`localStorage`) | `pdf`                 | Remember PDF viewer column layout                             |
| Supabase Auth session                  | helvety.cloud (Cloud) | Signed-in session after OTP (required; not encryption unlock) |

No consent modal is required for strictly local preference storage with no analytics. Cloud auth session storage is disclosed on Privacy §8; it is necessary for the authenticated service.

## When to update legal copy

See [`docs/legal-change-guardrails.md`](./legal-change-guardrails.md). Any change to new storage keys requires updating:

- `apps/web/app/privacy/page.tsx` (and usually terms/impressum `lastReviewed` in sync)
- `apps/web/lib/legal-cookies-disclosure.ts` + `apps/web/app/legal-cookies-disclosure.test.ts`
- This document if operational facts change

Regression tests: `bun run test` in `apps/web` (`legal-cookies-disclosure.test.ts`, `legal-metadata.test.ts`, `legal-privacy-tables.test.ts`, `legal-public-tools.test.ts`).
