# Helvety Auth

Centralized passwordless authentication for the Helvety ecosystem.

**App URL:** <https://helvety.com/auth>  
**Monorepo path:** `apps/auth`

## Key Features

- Email OTP + passkey authentication (WebAuthn)
- Account-bound returning-user passkey sign-in
- Session sharing across Helvety path-routed apps
- Redirect URI validation for cross-app sign-in flows
- Auth-step resolution for passkey setup vs passkey sign-in

## Authentication Flow

Primary login flow:

1. Email entry + non-EU/EEA attestation
2. OTP verification (6-8 digits)
3. Passkey step:
   - New/incomplete setup users: passkey registration then passkey sign-in
   - Returning users: passkey sign-in directly
4. Redirect to requested destination

`/auth/callback` remains for compatibility callback paths (OTP/account recovery/invite/email change) and also handles PKCE/OAuth-style code exchange via the shared callback handler; passkey sign-in establishes session server-side.

## Security Model

- `proxy.ts` performs request bootstrap (CSP/CSRF/session refresh), not full auth enforcement.
- Rate limits apply to OTP send/verify and passkey operations.
- CSRF is required for state-changing actions; read-only actions use authenticated read model.
- Redirect URIs are allowlist-validated via shared redirect-validation logic.
- Passkey presence checks for `user_auth_credentials` use trusted server-side reads, not public client reads.

## Crawl and Indexing

- `apps/auth` is intentionally non-indexable.
- `/auth/robots.txt` disallows crawling.
- `/auth/sitemap.xml` is intentionally empty.

## Environment Variables

Copy `env.template` to `.env.local`.

| Variable                               | Required | Server-only | Description                              |
| -------------------------------------- | -------- | ----------- | ---------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Yes      | No          | Supabase project URL                     |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes      | No          | Supabase publishable key                 |
| `SUPABASE_SECRET_KEY`                  | Yes      | Yes         | Trusted server-side Supabase key         |
| `UPSTASH_REDIS_REST_URL`               | Yes      | Yes         | Upstash Redis REST URL for rate limiting |
| `UPSTASH_REDIS_REST_TOKEN`             | Yes      | Yes         | Upstash Redis REST token                 |

This app uses Supabase Auth + passkeys (not NextAuth/Auth.js).

## Development and Testing

Run from `apps/auth`:

```bash
bun run dev
bun run test
bun run test:watch
bun run test:coverage
```

Notable tests include login-step mapping and auth-step resolution (`lib/login-flow-stepper.test.ts`, `lib/auth-step.test.ts`).

For monorepo setup and CI/release commands, use the root [`README.md`](../../README.md).

## Legal and Support

- Privacy: <https://helvety.com/privacy>
- Terms: <https://helvety.com/terms>
- Impressum and abuse reporting: <https://helvety.com/impressum#abuse>
- Contact: <mailto:contact@helvety.com>

## License

Licensed under the [MIT License](./LICENSE).
