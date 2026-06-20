/**
 * Unified Helvety auth / E2EE session TTL policy.
 *
 * Shared constants for client/server session lifetimes:
 * - **Vault (IndexedDB):** `AUTH_SLIDING_IDLE_MS` + `AUTH_MAX_LIFETIME_MS`
 * - **Device trust cookie & PRF salt cache:** `AUTH_MAX_LIFETIME_*` only (7d cap;
 *   device trust slides on passkey sign-in when already trusted)
 *
 * Supabase JWT refresh uses the hosted project settings. For server-enforced
 * weekly re-auth (extension + defense-in-depth on web), align the hosted
 * project **JWT expiry / session time-box** to {@link AUTH_MAX_LIFETIME_SECONDS}
 * (7 days) in Supabase Dashboard → Authentication → Sessions. Clients also
 * reject access tokens whose `iat` exceeds {@link AUTH_MAX_LIFETIME_MS} via
 * {@link isJwtWithinMaxLifetime} (`@helvety/shared/jwt-session-lifetime`).
 */

/** Sliding idle window: extended on vault use and user activity. */
export const AUTH_SLIDING_IDLE_MS = 24 * 60 * 60 * 1000;

/** Absolute cap from first unlock / email verification in a session period. */
export const AUTH_MAX_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

/** Same cap in seconds for HTTP cookie maxAge / payload exp. */
export const AUTH_MAX_LIFETIME_SECONDS = 7 * 24 * 60 * 60;
