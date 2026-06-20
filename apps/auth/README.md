# Helvety Auth

Centralized passwordless authentication for Helvety web apps on helvety.com (this monorepo’s path zones).

**App URL:** <https://helvety.com/auth>  
**Monorepo path:** `apps/auth`

## Key Features

- Root `app/layout.tsx` composes `@helvety/ui/helvety-public-shell-root-layout` (injects `HelvetyThemeInitScript` in `<head>`; `wrapInsideTooltipProvider` wraps the shell in `CSRFProvider` and `EncryptionProvider`). The layout calls `bootstrapAuthLayoutSession()` from `@helvety/shared/layout-session-bootstrap` (CSRF + user in parallel, same contract as store/E2EE layouts) and `@helvety/shared/seo` (`createHelvetyProductMetadata`); zone is not indexable. Navbar encryption tooltip reuses `@helvety/ui/encryption-tooltip-content` with the same passkey disclaimer as E2EE product apps; the badge only shows when the vault is unlocked for the signed-in user.
- Metadata / OG / JSON-LD use `AUTH_DESCRIPTION` in [`app/layout.tsx`](./app/layout.tsx); PWA [`public/manifest.json`](./public/manifest.json) matches the shorter `AUTH_PWA_MANIFEST_DESCRIPTION`. Root `bun run consistency:install-manifest-metadata` fails if those diverge.
- Email OTP + passkey authentication (WebAuthn)
- Account-bound returning-user passkey sign-in
- Trusted-device optimization (rolling 7-day device email verification) to allow passkey-first sign-in on previously verified devices
- Session sharing across Helvety path-routed apps
- Redirect URI validation for cross-app sign-in flows (`getSafeRedirectUri` on login, callback, passkey completion, and `/logout`)
- Auth-step resolution for passkey setup vs passkey sign-in
- Logout (`/logout`): clears local crypto artifacts in the browser, then calls the server action in [`app/logout/logout-actions.ts`](app/logout/logout-actions.ts) to end the Supabase session (CSRF-protected)

## Authentication Flow

Primary login flow:

1. Email entry + non-EU/EEA attestation
2. OTP verification (8 digits). On success, `verifyEmailCode` rotates the CSRF cookie and returns `csrfToken`; the login client applies it via `useSetCSRFToken` before advancing to passkey (see Security Model). Code length is defined in `lib/otp-code.ts` (`OTP_CODE_LENGTH` / `OTP_USER_VISIBLE_LENGTH_LABEL`).
3. Passkey step:
   - New/incomplete setup users: `encryption-setup` (includes passkey registration when missing), then passkey sign-in
   - Returning users: passkey sign-in directly
   - **Mobile** (phones/tablets per `isMobileDevice()`): after OTP or trusted-device entry, the client may **auto-start** passkey sign-in once bootstrap finishes (`hints: ["client-device"]`).
   - **Desktop** (including touch laptops): hybrid QR flow (`hints: ["hybrid"]`). WebAuthn requires a **user gesture**, so the user taps **Sign in with passkey**; the client does not auto-start QR ceremonies.
4. Redirect to requested destination

**Login client bootstrap** (`hooks/use-login-flow.ts`): on mount, probes the Supabase session once (Strict Mode–safe one-shot) via `getUserSingleflight` with a short timeout. After OTP success, `invalidateAuthUserProbeCache()` runs before CSRF sync so the probe sees the new session. `shouldShowLoginBootstrapSpinner` (used in `login-client.tsx`) keeps the passkey step visible during the Next.js Server Action re-render instead of flashing the full-page bootstrap spinner. Stale bootstrap errors are suppressed after OTP (`shouldSurfaceLoginError` in `lib/login-flow-errors.ts`); auto-passkey `NotAllowedError` / `AbortError` on mobile are silent so dismissals do not toast false failures.

Trusted-device shortcut (all `/auth/login` entry paths):

- After email verification (OTP action or `/auth/callback`), the auth service **mints and read-back verifies** a **signed HttpOnly `helvety_device_trust` cookie** via `mintAndVerifyDeviceTrustCookie` (see [`device-trust-cookie.ts`](./app/actions/device-trust-cookie.ts)). If mint/read-back fails, OTP/callback still succeed (session is valid) but the client shows a warning toast (`deviceTrustMinted: false`) because the device may not be remembered for passkey-first entry.
- Any Sign in link (`getLoginUrl` → `/auth/login`) is resolved by [`lib/login-entry.ts`](./lib/login-entry.ts) on the server login gate: trusted devices without a session go straight to passkey sign-in (no email entry).
- The trust window is **7 days**. It **slides** (full reset) on passkey sign-in **only when** a valid `helvety_device_trust` cookie for that user already exists. Trust is **minted** after email verification (OTP or `/auth/callback`), not by passkey alone. On E2EE apps, missing or expired trust forces global logout (weekly email re-proof). Passkey auth options bind `expectedUserId` from the trust cookie server-side, not from client input.
- Manual logout clears the trust cookie for this device.

**Hard-logout chain (E2EE apps → auth):** client `forceHardLogout` / `triggerHardLogoutOnce` clears IndexedDB keys and PRF salt, then redirects to `/auth/logout` (global sign-out). The auth logout page clears keys again (idempotent), runs `signOutAction` (Supabase sign-out + `clearDeviceTrustCookie` + challenge cookie). Device trust is **not** cleared until that auth page runs; if a redirect is blocked, call sites should still reach `/auth/logout` or sign out locally.

- User-facing disclosure: [Privacy Policy §9](https://helvety.com/privacy#cookies) (cookie table). Developer reference: [`docs/cookies-telemetry-and-footer.md`](../../docs/cookies-telemetry-and-footer.md).

Auth layers (independent mechanisms):

```text
1. Supabase session (sb-* cookies)     → API / RLS / requireAuth
2. Device trust (`helvety_device_trust`) → skip email OTP on `/auth/login`; required for E2EE API access on helvety.com (weekly device trust via signed cookie)
3. Vault session (IndexedDB + idle)    → skip passkey re-unlock on E2EE apps (UX)
4. Passkey ceremony (WebAuthn)         → proof of possession
```

Vault session policy (E2EE apps): **24h sliding idle**, **7d absolute max** (see `@helvety/shared/auth-session-policy.ts` and `crypto/vault-session.ts`).

`/auth/callback` remains for compatibility callback paths (`magiclink`, `signup`, `recovery`, `invite`, `email_change`) and PKCE/OAuth-style code exchange via the shared callback handler. Primary typed email OTP code verification happens in auth actions; passkey sign-in establishes session server-side.

## Security Model

- `proxy.ts` performs request bootstrap (CSP, CSRF cookie bootstrap/re-issue, session refresh), not full auth enforcement. The `auth-gateway` profile uses **fail-closed** auth refresh: when Supabase session refresh fails, stale `sb-*` cookies are cleared instead of leaving a broken session on the client. Its `config.matcher` string matches `SECURITY_PROXY_MATCHER` in `@helvety/shared/proxy` (Next.js requires that pattern as a **static literal** in `proxy.ts`, so `ci:check` guardrails keep the two in sync). Extensions such as `.mjs`, `.wasm`, and `.json` bypass the proxy chain.
- Rate limits apply to OTP send/verify and passkey operations.
- Typed OTP verify (`verifyEmailCode` in [`app/actions/otp-actions.ts`](./app/actions/otp-actions.ts)) uses `shouldSkipOtpVerifySubmit` / `shouldApplyOtpVerifyResponse` in [`hooks/use-login-flow.ts`](./hooks/use-login-flow.ts) so duplicate or superseded submits cannot toast a false failure after success. On success it rotates the CSRF cookie and returns `csrfToken` plus `deviceTrustMinted`; the login client calls `invalidateAuthUserProbeCache()`, then syncs `CSRFProvider` via `useSetCSRFToken` before advancing to passkey (avoids stale `getUser()` cache and false “Security validation failed” toasts). Mobile may auto-start passkey after that sync; desktop waits for the sign-in button (user gesture). After the Supabase session exists, other post-verify side-effect failures (including device-trust mint/read-back) are logged but still return `success: true` to the client.
- OTP UI and email templates state a **1-hour** code lifetime (`OTP_USER_VISIBLE_EXPIRY_LABEL` in `lib/otp-code.ts`); keep Supabase Auth email OTP expiry aligned with that copy.
- CSRF is required for state-changing actions; read-only actions use authenticated read model. The proxy bootstraps or re-issues signed `csrf_token` cookies when missing or invalid for the current `HELVETY_COOKIE_SIGNING_SECRET`. Mutations such as `saveKeyCheckValue` use `authenticateAndRateLimit` (CSRF plus `RATE_LIMITS.ENCRYPTION`), not a bespoke CSRF helper. Read-only credential checks (`hasEncryptionSetup`, `getOwnPasskeyStatus`) use `authenticateAndRateLimit` with `RATE_LIMITS.CREDENTIAL_READ` (no CSRF); `getOwnPasskeyStatus` delegates to `checkUserPasskeyStatus` after auth.
- Server authorization reads use `getAuthUser` from `@helvety/shared/auth-retry` (wraps `supabase.auth.getUser()`); never `auth.getSession()` for access decisions.
- Redirect URIs are allowlist-validated via shared redirect-validation logic.
- Passkey presence checks for `user_auth_credentials` use trusted server-side reads (`createScopedAdminQuery`, `lookupCredentialByCredentialId`), not public client reads.
- Passkey transport values from stored credentials and client payloads are sanitized to supported WebAuthn transport enums before verification/option generation.
- Auth session cookie writes use `createServerMutatingClient` (`@helvety/shared/supabase/server`) in route handlers and server actions (callbacks, OTP verify, passkey session mint, logout) so sign-in and sign-out persist cookies even when the proxy already refreshed the session (`x-helvety-auth-refreshed`). Server Components and read-only actions use `createServerClient`, which no-ops `setAll` when that header is set (and ignores the optional `@supabase/ssr` 0.12+ cache-header map in RSC). The proxy applies those cache headers on refresh; see `packages/shared/README.md` § Supabase SSR.
- Web passkey sign-in bumps the WebAuthn counter before `verifyOtp` (replay protection). If session mint fails, the counter is rolled back so the user can retry the same ceremony without registering a new passkey.

## Chromium extension auth API

Production deploy and Vercel env: [`docs/extension-passkey-production.md`](./docs/extension-passkey-production.md) (OTP + passkey routes).

Public and Bearer JSON routes for the Helvety browser extension (separate from CSRF cookie server actions):

| Route                                 | Purpose                                                                                                                                                                           |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /api/extension/otp/send`        | Send email OTP after EU/EEA attestation; allowlisted `chrome-extension://` origin; rate-limited by trusted IP                                                                     |
| `POST /api/extension/otp/verify`      | Verify OTP; returns session tokens for extension `setSession` (no device-trust cookie)                                                                                            |
| `POST /api/extension/passkey/options` | WebAuthn request options + signed `challengeEnvelope` (3 min TTL, `HELVETY_COOKIE_SIGNING_SECRET`; includes single-use `nonce`)                                                   |
| `POST /api/extension/passkey/verify`  | Verify assertion; bind challenge via envelope + `clientDataJSON`; **single-use** envelope (Upstash `consumeSingleUseKey`); update counter; **does not** create a Supabase session |

Implementation: [`lib/extension-otp.ts`](./lib/extension-otp.ts), [`lib/otp-send-verify-core.ts`](./lib/otp-send-verify-core.ts), [`lib/extension-passkey.ts`](./lib/extension-passkey.ts), [`lib/extension-passkey-challenge.ts`](./lib/extension-passkey-challenge.ts), [`lib/extension-bearer-auth.ts`](./lib/extension-bearer-auth.ts). Env `HELVETY_CHROME_EXTENSION_ORIGINS` accepts comma-separated extension ids or full `chrome-extension://` URLs ([`lib/chrome-extension-origin-parse.ts`](./lib/chrome-extension-origin-parse.ts)). `getExpectedOrigins(rpId, clientOrigin)` adds `chrome-extension://…` only when the origin is allowlisted ([`lib/chrome-extension-origin.ts`](./lib/chrome-extension-origin.ts), [`app/actions/auth-rp-config.ts`](./app/actions/auth-rp-config.ts)). Web login flows are unchanged when `clientOrigin` is omitted.

### Extension weekly OTP anchor (no device-trust cookie)

Extension OTP verify returns Supabase session tokens only; it **does not** mint `helvety_device_trust` (extensions cannot persist HttpOnly cookies on helvety.com). The Chromium extension side panel records a **weekly OTP anchor** (local timestamp, not a cryptographic proof) in `chrome.storage.local` (`helvety_extension_last_email_verified`) using the same **7d cap** as `@helvety/shared/auth-session-policy`.

**Server-enforced re-auth:** Extension session resolution rejects access tokens older than **7d** via JWT `iat` (`@helvety/shared/jwt-session-lifetime`). Align Supabase Dashboard → Authentication → Sessions **JWT expiry / time-box** to `AUTH_MAX_LIFETIME_SECONDS` (604800). The OTP anchor is defense-in-depth UX; JWT age is the authoritative session cap.

|                   | Web                                       | Extension                                                                 |
| ----------------- | ----------------------------------------- | ------------------------------------------------------------------------- |
| Weekly re-auth    | HMAC HttpOnly `helvety_device_trust`      | JWT `iat` max age + `helvety_extension_last_email_verified` OTP anchor    |
| Who enforces      | Server actions + `requireE2eeAppPageAuth` | JWT max age + `resolveVerifiedExtensionSession` in `extension-session.ts` |
| Tamper resistance | Signing secret on server                  | JWT issued by Supabase; OTP anchor is client UX only                      |

RLS + valid JWT still protect PostgREST from the extension; passkey/PRF still gates decryption. The OTP anchor helps prompt re-sign-in on a shared device but is not the E2EE crypto boundary. See the extension [`docs/SECURITY-E2EE.md`](https://github.com/CasparRubin/helvety-browser-extension-chromium/blob/main/docs/SECURITY-E2EE.md) for the full threat-model note.

Production rate limiting on these routes requires a **trusted proxy IP** (`x-real-ip` on Vercel). `getTrustedClientIp` is called with `requireTrustedProxyInProduction: true`; when IP is unavailable the routes fail closed on strict rate-limit paths instead of trusting client-supplied headers.

## Crawl and Indexing

- `apps/auth` is intentionally non-indexable.
- `/auth/robots.txt` disallows crawling.
- `/auth/sitemap.xml` is not published (404). Private zones omit sitemap routes; `llms.txt` remains discoverable via robots and gateway links.

## Environment Variables

Copy `env.template` to `.env.local`.

| Variable                               | Required | Server-only | Description                                                                                                                                                                                                      |
| -------------------------------------- | -------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Yes      | No          | Supabase project URL                                                                                                                                                                                             |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes      | No          | Supabase publishable key                                                                                                                                                                                         |
| `SUPABASE_SECRET_KEY`                  | Yes      | Yes         | Trusted server-side Supabase key                                                                                                                                                                                 |
| `UPSTASH_REDIS_REST_URL`               | Yes      | Yes         | Upstash Redis REST URL for rate limiting                                                                                                                                                                         |
| `UPSTASH_REDIS_REST_TOKEN`             | Yes      | Yes         | Upstash Redis REST token                                                                                                                                                                                         |
| `HELVETY_COOKIE_SIGNING_SECRET`        | Yes      | Yes         | Signs CSRF/proxy cookies; re-issues invalid cookies (min 32 chars; not `SUPABASE_SECRET_KEY`)                                                                                                                    |
| `DEVICE_TRUST_COOKIE_SECRET`           | Yes      | Yes         | Signs device-trust cookies here (mint after email verify); **same value** on user-scoped E2EE/docs zones (verify only). Separate from CSRF signing; min 32 chars. Parity: `bun run consistency:vercel-prod-env`. |
| `HELVETY_CHROME_EXTENSION_ORIGINS`     | Yes      | Yes         | Comma-separated extension ids (or `chrome-extension://<id>`) for extension auth APIs (OTP + passkey)                                                                                                             |

Optional monorepo variables are documented as comments in [`env.template`](./env.template). Shared behavior is in the root [`README.md`](../../README.md) Environment Model; Vercel Production/Preview setup: [`docs/env-vercel-audit-checklist.md`](../../docs/env-vercel-audit-checklist.md). Run `bun run consistency:local-env` from the repo root to audit local `.env.local` files; `bun run sync:local-env` resyncs template comments/structure while keeping values.

**Local passkeys:** development uses WebAuthn RP ID `localhost` (see `app/actions/auth-rp-config.ts`). Passkeys registered on `helvety.com` do not work on `http://localhost:3001`; create or choose a passkey saved for `localhost` when signing in locally, or test passkey flows on production.

This app uses Supabase Auth + passkeys (not NextAuth/Auth.js).

## Development and Testing

Run from `apps/auth`:

```bash
bun run dev
bun run test
bun run test:watch
bun run test:coverage
```

Notable tests include layout shell providers without WebGL backdrop (`app/layout-shell-providers.test.ts`), login entry resolution and URL builders (`lib/login-entry.test.ts`), login server gate guardrails (`app/login/page.test.ts`), login-step mapping and auth-step resolution (`lib/login-flow-stepper.test.ts`, `lib/auth-step.test.ts`), login stepper opaque backdrop (`components/auth-stepper.test.tsx`), and login error-surfacing policy (`lib/login-flow-errors.test.ts`).
Credential read actions: `app/actions/credential-actions.test.ts` and `app/actions/encryption-actions.test.ts` mock `authenticateAndRateLimit` and assert `CREDENTIAL_READ` / encryption rate limits; `getOwnPasskeyStatus` delegates to `checkUserPasskeyStatus` (DB logic in `app/actions/auth-action-helpers.test.ts`). Auth server-action guard patterns are covered by `packages/shared/src/auth-server-action-guards.test.ts` plus `bun run consistency:auth-action-guards`.
OTP action tests (`app/actions/otp-actions.test.ts`, `app/actions/otp-actions-wiring.test.ts`) cover send/verify validation, rotated `csrfToken` and `deviceTrustMinted` in success payloads, real Supabase rejection paths, and post-session resilience (device-trust mint/read-back failures after `verifyOtp` still return success). Device-trust cookie tests (`app/actions/device-trust-cookie.test.ts`) cover mint/read-back verification. Login hook tests (`hooks/use-login-flow.test.ts`, `hooks/use-login-flow-wiring.test.ts`, `app/login/login-client-wiring.test.ts`) cover one-shot bootstrap, `shouldApplyOtpVerifyResponse` / `shouldSkipOtpVerifySubmit`, `shouldShowLoginBootstrapSpinner`, `resolveTrustedBootstrapUserId`, probe-cache invalidation before CSRF sync, OTP `deviceTrustMinted` warning wiring, mobile-only passkey auto-start, and ceremony error policy. Auth probe cache tests live in `hooks/auth-session-singleflight.test.ts` (`@helvety/ui/auth-session-singleflight`). `@helvety/ui` CSRF provider tests (`packages/ui/src/csrf-provider.test.tsx`) cover `useSetCSRFToken` client updates. `docs/auth-flow-docs.guardrail.test.ts` keeps README auth-flow copy aligned with implementation.
Passkey action tests also cover malformed payload handling, account mismatch protection, device-trust cookie binding for passkey options (not client `expectedUserId`), sliding renewal via `setDeviceTrustCookie` on passkey sign-in when already trusted, and transport sanitization behavior. Auth callback tests cover link-based OTP allowlist wiring (`app/auth/callback/route.test.ts`) and post-verify device-trust mint/read-back (`app/auth/callback/callback-success.test.ts`); typed sign-in OTP codes are verified in server actions, not the GET callback.
Extension auth routes (OTP + passkey) and challenge envelopes are covered in `lib/extension-otp.test.ts`, `lib/extension-passkey.test.ts`, `lib/extension-passkey-challenge.test.ts`, `lib/chrome-extension-origin.test.ts`, and colocated `app/api/extension/otp/*/route.test.ts` and `app/api/extension/passkey/*/route.test.ts` (real Zod allowlist + mocked handlers).
Relying-party/origin configuration behavior is covered in `app/actions/auth-rp-config.test.ts`.
`components/navbar.test.tsx` locks encryption-badge behavior (user-bound unlock, loading) to match E2EE navbars; `app/layout-metadata.test.ts` asserts SEO copy and `noindex` robots (mocks `@helvety/shared/layout-session-bootstrap` → `bootstrapAuthLayoutSession`).

For monorepo setup and `ci:check` / `ci:release` commands, use the root [`README.md`](../../README.md).

## Legal and Support

- Privacy: <https://helvety.com/privacy>
- Terms: <https://helvety.com/terms>
- Impressum and abuse reporting: <https://helvety.com/impressum#abuse>
- Contact: <mailto:contact@helvety.com>

## License

Licensed under the [GNU Affero General Public License v3.0 or later](../../LICENSE).
