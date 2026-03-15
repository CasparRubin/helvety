# Helvety Notes

![Next.js](https://img.shields.io/badge/Next.js-16.x-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19.x-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

A privacy-focused notes app with client-side encryption for sensitive fields. Engineered & Designed in Switzerland.

**App:** [helvety.com/notes](https://helvety.com/notes)

> **Part of the [Helvety monorepo](https://github.com/CasparRubin/helvety).** This app lives in `apps/notes/`.

## Service Availability

Helvety services are primarily intended for customers in Switzerland. Sign-in for account-based services includes a confirmation that the user is not located in the EU/EEA before verification-code delivery, but technical access from outside Switzerland may still occur. Mandatory law in other jurisdictions may still apply in specific cases.

Helvety's legal baseline is Swiss data protection law (nDSG). Account-based services collect this non-EU/EEA location-attestation signal during sign-in on [helvety.com/auth](https://helvety.com/auth).

## Features

- End-to-end encryption for note `title` and `description`
- Flat notes list with sheet editor UX
- Notes link to tasks and contacts (and can be linked from those apps)
- Drag and drop reorder
- Client-side decrypted data export
- Dark & Light mode

## Notes Model

Each note has:

- `title` (encrypted)
- `description` (encrypted)

Structural metadata remains plaintext for app functionality:

- `id`, `user_id`, `sort_order`, `created_at`, `updated_at`

## Access Model

- 100% free to use
- No business/account quotas
- Technical and security safeguards may still apply for abuse prevention and platform reliability

## Environment Variables

Copy `env.template` to `.env.local` and fill in values.

| Variable                               | Required | Server-only | Description                                    |
| -------------------------------------- | -------- | ----------- | ---------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Yes      | No          | Supabase project URL                           |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes      | No          | Publishable key (RLS applies)                  |
| `SUPABASE_SECRET_KEY`                  | Yes      | **Yes**     | Supabase secret key for server-side operations |
| `UPSTASH_REDIS_REST_URL`               | Yes      | **Yes**     | Redis URL for rate limiting                    |
| `UPSTASH_REDIS_REST_TOKEN`             | Yes      | **Yes**     | Redis token for rate limiting                  |

## Security

- Proxy-based request hardening (`proxy.ts`)
- Page-level auth guard (`requireAuth`)
- CSRF protection for state-changing actions
- RLS + explicit `user_id` filters in actions
- Rate limiting on server actions

**Legal Pages:** Privacy Policy, Terms of Service, and Impressum are hosted centrally on [helvety.com](https://helvety.com) and linked in the site footer. Services are primarily intended for customers in Switzerland, and account-based services collect a non-EU/EEA location-attestation signal during sign-in on [helvety.com/auth](https://helvety.com/auth). The legal baseline is Swiss data protection law (nDSG), and where other mandatory law applies in a specific case, Helvety follows those obligations.

**Abuse Reporting:** Abuse reports can be submitted to [contact@helvety.com](mailto:contact@helvety.com). The Impressum on [helvety.com/impressum](https://helvety.com/impressum#abuse) includes an abuse reporting section with guidance for both users and law enforcement.

## Testing

Run from `apps/notes`:

| Script                  | Description             |
| ----------------------- | ----------------------- |
| `bun run test`          | Run all tests once      |
| `bun run test:watch`    | Run tests in watch mode |
| `bun run test:coverage` | Run tests with coverage |

## License & Usage

This app is open source under the [MIT License](./LICENSE).

You may use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of this software, provided the copyright and permission notice are
included in substantial portions of the software.

The software is provided "as is", without warranty of any kind. See
[LICENSE](./LICENSE) for full legal terms.
