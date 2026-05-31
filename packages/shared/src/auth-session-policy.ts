/**
 * Unified Helvety auth / E2EE session TTL policy.
 *
 * Single source of truth for sliding idle and absolute max lifetimes across
 * vault (IndexedDB), device trust (email proof), and PRF salt cache.
 * Supabase JWT refresh uses the hosted project settings; align Pro time-box
 * and inactivity to these values when available.
 */

/** Sliding idle window: extended on vault use and user activity. */
export const AUTH_SLIDING_IDLE_MS = 24 * 60 * 60 * 1000;

/** Absolute cap from first unlock / email verification in a session period. */
export const AUTH_MAX_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

/** Same cap in seconds for HTTP cookie maxAge / payload exp. */
export const AUTH_MAX_LIFETIME_SECONDS = 7 * 24 * 60 * 60;
