/**
 * Client-side vault session policy for E2EE apps.
 *
 * Controls how long a derived master key may remain in IndexedDB and how
 * inactivity lock stays aligned with that policy. Does not affect server auth.
 */

/** Sliding idle window: extended on vault use and user activity. */
export const VAULT_SLIDING_IDLE_MS = 12 * 60 * 60 * 1000;

/** Absolute cap from first unlock in this vault session. */
export const VAULT_MAX_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;

/** Timestamps stored alongside a cached master key in IndexedDB. */
export type VaultSessionTimestamps = {
  /** Set once when the vault session starts (passkey unlock). */
  unlockedAt: number;
  /** Sliding touch target; renewed on use and activity. */
  lastActiveAt: number;
};

/** Create a new vault session timestamp pair. */
export function createVaultSession(now = Date.now()): VaultSessionTimestamps {
  return { unlockedAt: now, lastActiveAt: now };
}

/** Extend the sliding idle window without changing the absolute cap anchor. */
export function touchVaultSession(
  ts: VaultSessionTimestamps,
  now = Date.now()
): VaultSessionTimestamps {
  return { unlockedAt: ts.unlockedAt, lastActiveAt: now };
}

/** True when both sliding idle and max lifetime are within policy. */
export function isVaultSessionValid(
  ts: VaultSessionTimestamps,
  now = Date.now()
): boolean {
  const idleElapsed = now - ts.lastActiveAt;
  const lifetimeElapsed = now - ts.unlockedAt;
  return (
    idleElapsed <= VAULT_SLIDING_IDLE_MS &&
    lifetimeElapsed <= VAULT_MAX_LIFETIME_MS
  );
}

/** True when the absolute vault session cap from `unlockedAt` has elapsed. */
export function isVaultMaxLifetimeExceeded(
  unlockedAt: number,
  now = Date.now()
): boolean {
  return now - unlockedAt > VAULT_MAX_LIFETIME_MS;
}

/**
 * Milliseconds until the client should lock the vault (idle or max lifetime,
 * whichever comes first). Returns 0 when already past max lifetime.
 */
export function getVaultLockDelayMs(
  unlockedAt: number,
  now = Date.now()
): number {
  const maxLifetimeRemaining = unlockedAt + VAULT_MAX_LIFETIME_MS - now;
  if (maxLifetimeRemaining <= 0) {
    return 0;
  }
  return Math.min(VAULT_SLIDING_IDLE_MS, maxLifetimeRemaining);
}

/**
 * Normalize legacy records that only stored `cachedAt`.
 * Uses that value for both anchors when newer fields are absent.
 */
export function normalizeVaultSessionTimestamps(
  record: Partial<VaultSessionTimestamps> & { cachedAt?: number }
): VaultSessionTimestamps | null {
  const anchor =
    typeof record.unlockedAt === "number"
      ? record.unlockedAt
      : typeof record.cachedAt === "number"
        ? record.cachedAt
        : typeof record.lastActiveAt === "number"
          ? record.lastActiveAt
          : null;

  if (anchor === null) {
    return null;
  }

  const lastActiveAt =
    typeof record.lastActiveAt === "number"
      ? record.lastActiveAt
      : typeof record.cachedAt === "number"
        ? record.cachedAt
        : anchor;

  return {
    unlockedAt: anchor,
    lastActiveAt,
  };
}
