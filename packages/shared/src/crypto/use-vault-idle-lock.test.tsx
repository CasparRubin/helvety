import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useVaultIdleLock } from "./use-vault-idle-lock";

const mocks = vi.hoisted(() => ({
  touchVaultSessionInStorage: vi.fn(),
  getVaultLockDelayMs: vi.fn(),
}));

vi.mock("./key-storage", () => ({
  touchVaultSessionInStorage: mocks.touchVaultSessionInStorage,
}));

vi.mock("./vault-session", () => ({
  getVaultLockDelayMs: mocks.getVaultLockDelayMs,
}));

describe("useVaultIdleLock", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.touchVaultSessionInStorage.mockResolvedValue(undefined);
    mocks.getVaultLockDelayMs.mockReturnValue(60_000);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does nothing when vault is locked", () => {
    const onLock = vi.fn();
    renderHook(() =>
      useVaultIdleLock({
        userId: "user-1",
        isUnlocked: false,
        vaultUnlockedAt: Date.now(),
        onLock,
      })
    );

    expect(mocks.touchVaultSessionInStorage).not.toHaveBeenCalled();
    expect(onLock).not.toHaveBeenCalled();
  });

  it("locks immediately when policy delay is zero", () => {
    mocks.getVaultLockDelayMs.mockReturnValue(0);
    const onLock = vi.fn();
    const unlockedAt = Date.now();

    renderHook(() =>
      useVaultIdleLock({
        userId: "user-1",
        isUnlocked: true,
        vaultUnlockedAt: unlockedAt,
        onLock,
      })
    );

    expect(mocks.touchVaultSessionInStorage).toHaveBeenCalledWith("user-1");
    expect(onLock).toHaveBeenCalledWith("user-1");
  });

  it("schedules lock after the policy delay", () => {
    vi.useFakeTimers();
    mocks.getVaultLockDelayMs.mockReturnValue(5_000);
    const onLock = vi.fn();
    const unlockedAt = Date.now();

    renderHook(() =>
      useVaultIdleLock({
        userId: "user-1",
        isUnlocked: true,
        vaultUnlockedAt: unlockedAt,
        onLock,
      })
    );

    expect(onLock).not.toHaveBeenCalled();
    vi.advanceTimersByTime(5_000);
    expect(onLock).toHaveBeenCalledWith("user-1");
  });
});
