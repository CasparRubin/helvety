# Helvety Auth

Centralized passwordless authentication for Helvety web apps on helvety.com (this monorepo’s path zones).

**App URL:** <https://helvety.com/auth>  
**Monorepo path:** `apps/auth`

## Key Features

- Root `app/layout.tsx` uses `@helvety/ui/helvety-public-shell-root-layout` (blocking `HelvetyThemeInitScript` in `<head>`; `wrapInsideTooltipProvider` wraps the shell in `CSRFProvider` and `EncryptionProvider`), loads CSRF and user via `getCachedCSRFToken` / `getCachedUser` from `@helvety/shared/cached-server` (same data as `bootstrapE2eeLayoutSession()`), and `@helvety/shared/seo` (`createHelvetyProductMetadata`); zone is not indexable. Navbar encryption tooltip reuses `@helvety/ui/encryption-tooltip-content` with the same passkey disclaimer as E2EE product apps; the badge only shows when the vault is unlocked for the signed-in user.
- Metadata / OG / JSON-LD use `AUTH_DESCRIPTION` in [`app/layout.tsx`](./app/layout.tsx); PWA [`public/manifest.json`](./public/manifest.json) matches the shorter `AUTH_PWA_MANIFEST_DESCRIPTION`. Root `bun run consistency:install-manifest-metadata` fails if those diverge.
- Email OTP + passkey authentication (WebAuthn)
- Account-bound returning-user passkey sign-in
- Trusted-device optimization (rolling 30-day device email verification) to allow passkey-first sign-in on previously verified devices
- Session sharing across Helvety path-routed apps
- Redirect URI validation for cross-app sign-in flows
- Auth-step resolution for passkey setup vs passkey sign-in
- Logout (`/logout`): clears local crypto artifacts in the browser, then calls the server action in [`app/logout/logout-actions.ts`](app/logout/logout-actions.ts) to end the Supabase session (CSRF-protected)

## Authentication Flow

Primary login flow:

1. Email entry + non-EU/EEA attestation
2. OTP verification (6-8 digits)
3. Passkey step:
   - New/incomplete setup users: `encryption-setup` (includes passkey registration when missing), then passkey sign-in
   - Returning users: passkey sign-in directly
4. Redirect to requested destination

Trusted-device shortcut:

- After a successful OTP verification, the auth service stores a **signed HttpOnly `helvety_device_trust` cookie** (see [`device-trust-cookie.ts`](./app/actions/device-trust-cookie.ts)).
- On that same device, subsequent sign-ins may start at passkey sign-in (no email entry) as long as the device-trust cookie is still valid.
- The trust window is **30 days** and renews (sliding window) on successful passkey sign-in.
- Manual logout clears the trust cookie for this device.
- User-facing disclosure: [Privacy Policy §9](https://helvety.com/privacy#cookies) (cookie table). Developer reference: [`docs/cookies-telemetry-and-footer.md`](../../docs/cookies-telemetry-and-footer.md).

`/auth/callback` remains for compatibility callback paths (`magiclink`, `signup`, `recovery`, `invite`, `email_change`) and PKCE/OAuth-style code exchange via the shared callback handler. Primary typed email OTP code verification happens in auth actions; passkey sign-in establishes session server-side.

## Security Model

- `proxy.ts` performs request bootstrap (CSP, CSRF cookie bootstrap/re-issue, session refresh), not full auth enforcement. Its `config.matcher` string matches `SECURITY_PROXY_MATCHER` in `@helvety/shared/proxy` (Next.js requires that pattern as a **static literal** in `proxy.ts`, so CI guardrails keep the two in sync). Extensions such as `.mjs`, `.wasm`, and `.json` bypass the proxy chain.
- Rate limits apply to OTP send/verify and passkey operations.
- CSRF is required for state-changing actions; read-only actions use authenticated read model. The proxy bootstraps or re-issues signed `csrf_token` cookies when missing or invalid for the current `HELVETY_COOKIE_SIGNING_SECRET`.
- Server authorization reads use `getAuthUser` from `@helvety/shared/auth-retry` (wraps `supabase.auth.getUser()`); never `auth.getSession()` for access decisions.
- Redirect URIs are allowlist-validated via shared redirect-validation logic.
- Passkey presence checks for `user_auth_credentials` use trusted server-side reads (`createScopedAdminQuery`, `lookupCredentialByCredentialId`), not public client reads.
- Passkey transport values from stored credentials and client payloads are sanitized to supported WebAuthn transport enums before verification/option generation.

## Chromium extension passkey API

Bearer-authenticated JSON routes for the Helvety browser extension (separate from CSRF cookie server actions):

| Route                                 | Purpose                                                                                                                  |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `POST /api/extension/passkey/options` | WebAuthn request options + signed `challengeEnvelope` (3 min TTL, `HELVETY_COOKIE_SIGNING_SECRET`)                       |
| `POST /api/extension/passkey/verify`  | Verify assertion; bind challenge via envelope + `clientDataJSON`; update counter; **does not** create a Supabase session |

Implementation: [`lib/extension-passkey.ts`](./lib/extension-passkey.ts), [`lib/extension-passkey-challenge.ts`](./lib/extension-passkey-challenge.ts), [`lib/extension-bearer-auth.ts`](./lib/extension-bearer-auth.ts). `getExpectedOrigins(rpId, clientOrigin)` adds `chrome-extension://…` when the client sends that origin ([`app/actions/auth-rp-config.ts`](./app/actions/auth-rp-config.ts)). Web login flows are unchanged when `clientOrigin` is omitted.

## Crawl and Indexing

- `apps/auth` is intentionally non-indexable.
- `/auth/robots.txt` disallows crawling.
- `/auth/sitemap.xml` is intentionally empty.

## Environment Variables

Copy `env.template` to `.env.local`.

| Variable                               | Required | Server-only | Description                                                                                   |
| -------------------------------------- | -------- | ----------- | --------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Yes      | No          | Supabase project URL                                                                          |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes      | No          | Supabase publishable key                                                                      |
| `SUPABASE_SECRET_KEY`                  | Yes      | Yes         | Trusted server-side Supabase key                                                              |
| `UPSTASH_REDIS_REST_URL`               | Yes      | Yes         | Upstash Redis REST URL for rate limiting                                                      |
| `UPSTASH_REDIS_REST_TOKEN`             | Yes      | Yes         | Upstash Redis REST token                                                                      |
| `HELVETY_COOKIE_SIGNING_SECRET`        | Yes      | Yes         | Signs CSRF/proxy cookies; re-issues invalid cookies (min 32 chars; not `SUPABASE_SECRET_KEY`) |
| `DEVICE_TRUST_COOKIE_SECRET`           | Yes      | Yes         | Signs device-trust cookies (separate from CSRF signing; min 32 chars)                         |

Optional CI/monorepo variables are documented as comments in [`env.template`](./env.template). Shared behavior is in the root [`README.md`](../../README.md) Environment Model.

This app uses Supabase Auth + passkeys (not NextAuth/Auth.js).

## Development and Testing

Run from `apps/auth`:

```bash
bun run dev
bun run test
bun run test:watch
bun run test:coverage
```

Notable tests include layout shell providers without WebGL backdrop (`app/layout-shell-providers.test.ts`), login-step mapping and auth-step resolution (`lib/login-flow-stepper.test.ts`, `lib/auth-step.test.ts`), and login stepper opaque backdrop (`components/auth-stepper.test.tsx`).
Passkey action tests also cover malformed payload handling, account mismatch protection, and transport sanitization behavior.
Extension passkey routes and challenge envelopes are covered in `lib/extension-passkey.test.ts` and `lib/extension-passkey-challenge.test.ts`.
Relying-party/origin configuration behavior is covered in `app/actions/auth-rp-config.test.ts`.
`components/navbar.test.tsx` locks encryption-badge behavior (user-bound unlock, loading) to match E2EE navbars; `app/layout-metadata.test.ts` asserts SEO copy and `noindex` robots.

For monorepo setup and CI/release commands, use the root [`README.md`](../../README.md).

## Legal and Support

- Privacy: <https://helvety.com/privacy>
- Terms: <https://helvety.com/terms>
- Impressum and abuse reporting: <https://helvety.com/impressum#abuse>
- Contact: <mailto:contact@helvety.com>

## License

Licensed under the [GNU Affero General Public License v3.0 or later](../../LICENSE).
