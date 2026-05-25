# Cookies, Telemetry, and Site Footer

Canonical developer reference for Helvety web zones on `helvety.com`. User-facing legal text lives on the [Privacy Policy](https://helvety.com/privacy) (Section 9).

## Site footer (`@helvety/ui/footer`)

Mounted by `HelvetyPublicShellRootLayout` and `E2eeAppRootLayout` on every Next.js zone except the Chromium extension (no shared footer there).

The footer states that the site uses essential cookies and similar storage for security and core functionality; signed-in services also use authentication cookies. It links to **Privacy** for analytics and other storage details (not a separate cookie banner).

- Gateway (`apps/web`): relative `/privacy` link (`footerExternal: false`).
- Sub-zones: absolute `https://helvety.com/privacy` with `target="_blank"`.

## Vercel Analytics and Speed Insights

| Mount                                     | Layout                                            | Zones                   |
| ----------------------------------------- | ------------------------------------------------- | ----------------------- |
| `HelvetyVercelAnalytics`                  | Public shell + E2EE shell                         | All ten Next.js apps    |
| `HelvetyVercelAnalyticsWithSpeedInsights` | Public shell (`analytics: "with-speed-insights"`) | `apps/web` gateway only |

**Ten zones** (enable Web Analytics on each Vercel project): `web`, `auth`, `store`, `pdf`, `docs`, `image-upscaler`, `tasks`, `contacts`, `notes`, `links`.

Opt out locally: `NEXT_PUBLIC_HELVETY_VERCEL_ANALYTICS=false` in `.env.local` (documented in each `apps/*/env.template`).

Gateway referer routing: [`apps/web/lib/zone-analytics-referer.ts`](../apps/web/lib/zone-analytics-referer.ts).

## First-party HTTP cookies (summary)

| Cookie                 | Apps                          | Purpose                                                                                 |
| ---------------------- | ----------------------------- | --------------------------------------------------------------------------------------- |
| `sb-*-auth-token`      | Any zone when signed in       | Supabase session (httpOnly)                                                             |
| `csrf_token`           | All except `apps/web` gateway | CSRF double-submit (signed, httpOnly)                                                   |
| `webauthn_challenge`   | `auth`                        | Passkey ceremony (3 min, signed)                                                        |
| `helvety_device_trust` | `auth`                        | Trusted-device passkey-first sign-in on all `/auth/login` entry paths (30 days, signed) |

`apps/web` uses the `public-marketing` proxy profile: **no** CSRF cookie bootstrap (no `HELVETY_COOKIE_SIGNING_SECRET` on the gateway).

Production cookie domain: `.helvety.com` (`packages/shared/src/config.ts`).

## Browser storage (not cookies)

Documented in Privacy §9 table: theme (`localStorage`), `helvety-prf-salt` (auth login flows), `helvety-crypto` (IndexedDB master-key cache for E2EE apps), `helvety-pdf-columns` (PDF viewer).

E2EE vault session (`helvety-crypto` IndexedDB, not a cookie): master encryption key cache with **12h sliding idle** and **30d absolute max** lifetime (`@helvety/shared/crypto/vault-session.ts`). Cleared on logout / hard logout.

## When to update legal copy

See [`docs/legal-change-guardrails.md`](./legal-change-guardrails.md). Any change to analytics scope, new cookies/storage keys, or footer disclosure requires updating:

- `apps/web/app/privacy/page.tsx` (and usually terms/impressum `lastReviewed` in sync)
- `apps/web/lib/legal-cookies-disclosure.ts` + `apps/web/app/legal-cookies-disclosure.test.ts`
- This document if operational facts change

Regression tests: `bun run test` in `apps/web` (`legal-cookies-disclosure.test.ts`, `legal-metadata.test.ts`).
