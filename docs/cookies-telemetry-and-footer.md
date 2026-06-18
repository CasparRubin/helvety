# Cookies and Site Footer

Canonical developer reference for Helvety web zones on `helvety.com`. User-facing legal text lives on the [Privacy Policy](https://helvety.com/privacy) (Section 9).

## Site footer (`@helvety/ui/footer`)

Mounted by `HelvetyPublicShellRootLayout` and `E2eeAppRootLayout` on every Next.js zone except the Chromium extension (no shared footer there).

The footer states that the site uses essential cookies and similar storage for security and core functionality; signed-in services also use authentication cookies. It links to **Privacy** for storage details (not a separate cookie banner).

- Gateway (`apps/web`): relative `/privacy` link (`footerExternal: false`).
- Sub-zones: absolute `https://helvety.com/privacy` with `target="_blank"`.

**Ten zones:** `web`, `auth`, `store`, `pdf`, `docs`, `image-upscaler`, `tasks`, `contacts`, `notes`, `links`.

We do not mount third-party analytics or advertising trackers in shared root layouts.

## First-party HTTP cookies (summary)

| Cookie                 | Apps                                   | Purpose                                                                                                                                                                                                                                                                                   |
| ---------------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sb-*-auth-token`      | Any zone when signed in                | Supabase session (httpOnly)                                                                                                                                                                                                                                                               |
| `csrf_token`           | All except `apps/web` gateway          | CSRF double-submit (signed, httpOnly)                                                                                                                                                                                                                                                     |
| `webauthn_challenge`   | `auth`                                 | Web passkey ceremony on helvety.com (3 min, signed httpOnly cookie)                                                                                                                                                                                                                       |
| `helvety_device_trust` | `auth` (+ verified on E2EE/docs zones) | Weekly email-proof marker on **helvety.com** (httpOnly); passkey-first sign-in on `/auth/login` when trusted; required for continuing E2EE API access (signed). **Not** used by the Chromium extension (extension uses `helvety_extension_last_email_verified` in `chrome.storage.local`) |

**Extension auth API** (`/api/extension/otp/*`, `/api/extension/passkey/*`): OTP send/verify and passkey challenges are signed server-side values (passkey `challengeEnvelope` consumed once per ceremony via Upstash `consumeSingleUseKey`, 3 min TTL; in-memory fallback in dev). They are **not** browser cookies.

`apps/web` uses the `public-marketing` proxy profile: **no** CSRF cookie bootstrap (no `HELVETY_COOKIE_SIGNING_SECRET` on the gateway).

Production cookie domain: `.helvety.com` (`packages/shared/src/config.ts`).

## Browser storage (not cookies)

Documented in Privacy §9 table: theme (`localStorage`), `helvety-prf-salt` (auth login flows; **7-day** cache per `prf-salt-cache.ts`), `helvety-crypto` (IndexedDB master-key cache for E2EE apps, Docs optional vault save, and the Chromium extension side panel), `helvety-pdf-columns` (PDF viewer). Chromium extension: Supabase auth session and `helvety_extension_last_email_verified` in `chrome.storage.local` (weekly email proof).

E2EE vault session (`helvety-crypto` IndexedDB, not a cookie): master encryption key cache with **24h sliding idle** and **7d absolute max** lifetime (`@helvety/shared/auth-session-policy.ts`, `crypto/vault-session.ts`). Used by Tasks, Contacts, Notes, Links, Docs, and the Chromium extension side panel. Cleared on logout / hard logout.

## When to update legal copy

See [`docs/legal-change-guardrails.md`](./legal-change-guardrails.md). Any change to new cookies/storage keys or footer disclosure requires updating:

- `apps/web/app/privacy/page.tsx` (and usually terms/impressum `lastReviewed` in sync)
- `apps/web/lib/legal-cookies-disclosure.ts` + `apps/web/app/legal-cookies-disclosure.test.ts`
- This document if operational facts change

Regression tests: `bun run test` in `apps/web` (`legal-cookies-disclosure.test.ts`, `legal-metadata.test.ts`, `legal-privacy-tables.test.ts`).
