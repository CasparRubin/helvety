# Helvety Security Deep Dive Report (2026-03-14)

## Scope

- Repository: `helvety` monorepo
- Layers reviewed: app security controls, auth/session paths, shared security utilities, Supabase export posture (`supabase/supabase.json`)

## Executive Summary

- No immediate evidence of catastrophic data exposure in current app flows.
- Several high-impact hardening gaps were identified and addressed in this pass.
- Greenfield hardening was first validated directly on the live Supabase project (`bkdzeihxzvrkndjvyzye`) and then codified in `supabase/migrations/20260314_security_hardening_privileges.sql`.

## Findings and Remediation Status

| Severity | Finding                                                                                               | Status                                                                                                                  | Evidence                                                                                             |
| -------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| High     | Auth action client IP extraction allowed non-trusted production mode for rate limiting                | Fixed                                                                                                                   | `apps/auth/app/actions/auth-action-helpers.ts`                                                       |
| Medium   | Shared auth callback used soft rate-limit policy in production outage scenarios                       | Fixed                                                                                                                   | `packages/shared/src/auth-callback.ts`                                                               |
| Medium   | CSP report endpoint accepted header-only size checks and logged raw payloads                          | Fixed                                                                                                                   | `packages/shared/src/csp-report.ts`                                                                  |
| Medium   | Action responses leaked raw backend error text (`error.message`) in item updates                      | Fixed                                                                                                                   | `apps/tasks/app/actions/item-actions.ts`, `apps/notes/app/actions/item-actions.ts`                   |
| High     | Public env key validation accepted ambiguous/unsafe key patterns                                      | Fixed                                                                                                                   | `packages/shared/src/env-validation.ts`                                                              |
| High     | Broad default DB privileges for future objects in app-facing schemas                                  | Partially fixed (postgres-owned defaults locked down live; `supabase_admin` defaults remain due ownership boundary)     | Live SQL verification on project `bkdzeihxzvrkndjvyzye`                                              |
| High     | `storage.delete_leaf_prefixes` had `PUBLIC` execute + definer hardening gap                           | Partially fixed (`check_notes_row_limit` hardened live; `storage.delete_leaf_prefixes` remains managed-role controlled) | Live SQL verification on project `bkdzeihxzvrkndjvyzye`                                              |
| High     | `service_role` had broad direct access to vault secret surfaces                                       | Not fully remediated from `postgres` role (grants are `supabase_admin`-granted)                                         | Live SQL verification on project `bkdzeihxzvrkndjvyzye`                                              |
| Medium   | Pre-auth auth check returned passkey PRF metadata                                                     | Fixed                                                                                                                   | `apps/auth/app/actions/otp-actions.ts`                                                               |
| Medium   | Full passkey auth response object forwarded server-side                                               | Fixed (only required WebAuthn fields forwarded and validated)                                                           | `apps/auth/hooks/use-login-flow.ts`, `apps/auth/app/actions/passkey-auth-actions.ts`                 |
| Medium   | Passkey registration response could forward client extension outputs (including PRF output) to server | Fixed (registration payload sanitized client-side and validated server-side)                                            | `apps/auth/components/encryption-setup.tsx`, `apps/auth/app/actions/passkey-registration-actions.ts` |
| Medium   | Registration challenge was not guaranteed single-use on failure paths                                 | Fixed (challenge cleared in `finally`)                                                                                  | `apps/auth/app/actions/passkey-registration-actions.ts`                                              |
| Medium   | `item_contact_links` lacked ownership-integrity trigger tying `item_id`/`contact_id` to `user_id`     | Fixed live (new owner-guard trigger + function)                                                                         | Live SQL verification on project `bkdzeihxzvrkndjvyzye`                                              |
| Medium   | OTP escalating lockout key was email-only (targeted lockout/DoS risk)                                 | Fixed (lockout key scoped to email + client IP)                                                                         | `apps/auth/app/actions/otp-actions.ts`                                                               |

## Tests Added

- `packages/shared/src/client-ip.test.ts`
- `packages/shared/src/auth-callback.test.ts`
- `packages/shared/src/csp-report.test.ts`
- `packages/shared/src/env-validation.test.ts`
- `packages/shared/src/security-migration.test.ts`

## Validation Performed

- `bun run test` in `packages/shared` passed (61 tests).
- Lint diagnostics for all changed files reported no new lint errors.
- `bun run type-check --filter=@helvety/auth` passed.
- `bun run test --filter=@helvety/auth` passed (19 tests).
- Live Supabase SQL validation executed on `bkdzeihxzvrkndjvyzye`:
  - Confirmed owner-only RLS policy coverage on app data tables is present and forced.
  - Confirmed `public.check_notes_row_limit` now uses `search_path=pg_catalog, public`.
  - Confirmed link-table owner guard parity: `item_contact_links_owner_guard`, `note_contact_links_owner_guard`, `note_item_links_owner_guard`.
  - Confirmed link-owner guard functions use `search_path=pg_catalog, public`.
  - Confirmed postgres-owned default ACLs in `public`/`storage` no longer grant to `anon`/`authenticated`/`service_role`.
  - Confirmed `vault.secrets` / `vault.decrypted_secrets` service_role grants are still present with grantor `supabase_admin`.
  - Confirmed `storage.delete_leaf_prefixes` remains executable by `anon`/`authenticated`/`service_role` (managed-role boundary).

## Residual Risk and Follow-up

1. Managed-role boundary: final hardening on `vault` and `storage.delete_leaf_prefixes` requires execution context with `supabase_admin`/`supabase_storage_admin` ownership (or Supabase support path), not plain `postgres`.
2. After managed-role hardening is applied, regenerate and re-audit `supabase/supabase.json` to confirm:
   - no `service_role` read/delete on `vault.secrets` and `vault.decrypted_secrets`,
   - `storage.delete_leaf_prefixes` is not executable by `PUBLIC`,
   - security-definer search_path is fully hardened.
3. Keep confirming production edge/proxy behavior strips untrusted forwarding headers before app ingress.

## Changed Artifacts

- App/auth hardening:
  - `apps/auth/app/actions/auth-action-helpers.ts`
  - `packages/shared/src/client-ip.ts`
  - `packages/shared/src/auth-callback.ts`
- CSP/logging hardening:
  - `packages/shared/src/csp-report.ts`
  - `apps/tasks/app/actions/item-actions.ts`
  - `apps/notes/app/actions/item-actions.ts`
- Env-key validation hardening:
  - `packages/shared/src/env-validation.ts`
- DB hardening migration:
  - `supabase/migrations/20260314_security_hardening_privileges.sql`
- App auth flow hardening:
  - `apps/auth/app/actions/otp-actions.ts`
  - `apps/auth/app/actions/otp-actions.test.ts`
  - `apps/auth/hooks/use-login-flow.ts`
  - `apps/auth/app/actions/passkey-auth-actions.ts`
  - `apps/auth/app/actions/passkey-registration-actions.ts`
  - `apps/auth/components/encryption-setup.tsx`
- New tests:
  - `packages/shared/src/client-ip.test.ts`
  - `packages/shared/src/auth-callback.test.ts`
  - `packages/shared/src/csp-report.test.ts`
  - `packages/shared/src/env-validation.test.ts`
  - `packages/shared/src/security-migration.test.ts`
