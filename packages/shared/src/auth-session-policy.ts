/**
 * Unified Helvety auth / E2EE session TTL policy.
 *
 * Shared constants for client/server session lifetimes:
 * - **Vault (IndexedDB):** `AUTH_SLIDING_IDLE_MS` + `AUTH_MAX_LIFETIME_MS`
 * - **Device trust cookie & extension weekly proof & PRF salt cache:**
 *   `AUTH_MAX_LIFETIME_*` only (7d cap; device trust slides on passkey sign-in when already trusted)
 *
 * Supabase Auth hosted settings (Dashboard → Authentication → Sessions, Pro):
 * - **JWT expiry:** **3600s** (1 hour) — short-lived access tokens with automatic refresh
 * - **Time-box user sessions:** **7 days** (`AUTH_MAX_LIFETIME_SECONDS`)
 * - **Inactivity timeout:** **24 hours** (`AUTH_SLIDING_IDLE_MS`)
 *
 * Web weekly re-auth: HMAC `helvety_device_trust` cookie (server-enforced on E2EE).
 * Extension weekly re-auth: HMAC `weekly_proof` token minted at OTP verify (same payload/secret;
 * server-enforced on Bearer routes via {@link EXTENSION_WEEKLY_PROOF_HEADER}).
 *
 * Do **not** rely on access-token JWT `iat` for the 7d cap when JWT expiry is 3600s — `iat` resets on refresh.
 */

/** Sliding idle window: extended on vault use and user activity. */
export const AUTH_SLIDING_IDLE_MS = 24 * 60 * 60 * 1000;

/** Absolute cap from first unlock / email verification in a session period. */
export const AUTH_MAX_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

/** Same cap in seconds for HTTP cookie maxAge / signed proof payload exp. */
export const AUTH_MAX_LIFETIME_SECONDS = 7 * 24 * 60 * 60;
