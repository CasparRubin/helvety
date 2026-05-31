import { describe, expect, it } from "vitest";

import {
  VAULT_MAX_LIFETIME_MS,
  VAULT_SLIDING_IDLE_MS,
  createVaultSession,
  getVaultLockDelayMs,
  isVaultMaxLifetimeExceeded,
  isVaultSessionValid,
  normalizeVaultSessionTimestamps,
  touchVaultSession,
} from "./vault-session";

describe("vault-session", () => {
  const t0 = 1_700_000_000_000;

  it("createVaultSession sets both anchors to now", () => {
    expect(createVaultSession(t0)).toEqual({
      unlockedAt: t0,
      lastActiveAt: t0,
    });
  });

  it("touchVaultSession only updates lastActiveAt", () => {
    const session = createVaultSession(t0);
    expect(touchVaultSession(session, t0 + 1000)).toEqual({
      unlockedAt: t0,
      lastActiveAt: t0 + 1000,
    });
  });

  it("is valid within sliding idle window", () => {
    const session = createVaultSession(t0);
    expect(isVaultSessionValid(session, t0 + VAULT_SLIDING_IDLE_MS)).toBe(true);
  });

  it("fails when sliding idle exceeded", () => {
    const session = createVaultSession(t0);
    expect(isVaultSessionValid(session, t0 + VAULT_SLIDING_IDLE_MS + 1)).toBe(
      false
    );
  });

  it("fails when max lifetime exceeded even with recent touch", () => {
    const session = createVaultSession(t0);
    const touched = touchVaultSession(session, t0 + VAULT_MAX_LIFETIME_MS);
    expect(isVaultSessionValid(touched, t0 + VAULT_MAX_LIFETIME_MS + 1)).toBe(
      false
    );
  });

  it("normalizeVaultSessionTimestamps fills missing lastActiveAt from unlockedAt", () => {
    expect(normalizeVaultSessionTimestamps({ unlockedAt: t0 })).toEqual({
      unlockedAt: t0,
      lastActiveAt: t0,
    });
  });

  it("normalizeVaultSessionTimestamps returns null without timestamps", () => {
    expect(normalizeVaultSessionTimestamps({})).toBeNull();
  });

  it("isVaultMaxLifetimeExceeded after 7d from unlockedAt", () => {
    const session = createVaultSession(t0);
    expect(isVaultMaxLifetimeExceeded(session.unlockedAt, t0)).toBe(false);
    expect(
      isVaultMaxLifetimeExceeded(session.unlockedAt, t0 + VAULT_MAX_LIFETIME_MS)
    ).toBe(false);
    expect(
      isVaultMaxLifetimeExceeded(
        session.unlockedAt,
        t0 + VAULT_MAX_LIFETIME_MS + 1
      )
    ).toBe(true);
  });

  it("getVaultLockDelayMs uses the sooner of idle and max lifetime", () => {
    const session = createVaultSession(t0);
    expect(getVaultLockDelayMs(session.unlockedAt, t0)).toBe(
      VAULT_SLIDING_IDLE_MS
    );
    const nearMax = t0 + VAULT_MAX_LIFETIME_MS - 60_000;
    expect(getVaultLockDelayMs(session.unlockedAt, nearMax)).toBe(60_000);
    expect(
      getVaultLockDelayMs(session.unlockedAt, t0 + VAULT_MAX_LIFETIME_MS + 1)
    ).toBe(0);
  });
});
