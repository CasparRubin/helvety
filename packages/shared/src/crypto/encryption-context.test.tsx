import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EncryptionProvider, useEncryptionContext } from "./encryption-context";
import { VAULT_MAX_LIFETIME_MS } from "./vault-session";

import type { ReactNode } from "react";

const mocks = vi.hoisted(() => ({
  getCachedMasterKey: vi.fn(),
  deleteMasterKey: vi.fn(),
  clearAllKeys: vi.fn(),
  isStorageAvailable: vi.fn(),
  touchVaultSessionInStorage: vi.fn(),
}));

vi.mock("./key-storage", () => ({
  getCachedMasterKey: mocks.getCachedMasterKey,
  deleteMasterKey: mocks.deleteMasterKey,
  clearAllKeys: mocks.clearAllKeys,
  isStorageAvailable: mocks.isStorageAvailable,
  touchVaultSessionInStorage: mocks.touchVaultSessionInStorage,
}));

vi.mock("./passkey", () => ({
  isPasskeySupported: vi.fn(() => false),
}));

vi.mock("./prf-key-derivation", () => ({
  isPRFSupported: vi.fn().mockResolvedValue(false),
  getPRFSupportInfo: vi
    .fn()
    .mockResolvedValue({ supported: false, reason: "test" }),
}));

/** Test harness provider for encryption context hooks. */
function wrapper({ children }: { children: ReactNode }) {
  return <EncryptionProvider>{children}</EncryptionProvider>;
}

describe("EncryptionProvider", () => {
  const userId = "550e8400-e29b-41d4-a716-446655440000";
  const mockKey = {} as CryptoKey;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.deleteMasterKey.mockResolvedValue(undefined);
    mocks.clearAllKeys.mockResolvedValue(undefined);
    mocks.isStorageAvailable.mockReturnValue(true);
    mocks.touchVaultSessionInStorage.mockResolvedValue(undefined);
  });

  it("loads cached master key and vault unlockedAt anchor", async () => {
    const unlockedAt = Date.now();
    mocks.getCachedMasterKey.mockResolvedValue({ key: mockKey, unlockedAt });

    const { result } = renderHook(() => useEncryptionContext(), { wrapper });

    await act(async () => {
      await result.current.checkEncryptionState(userId);
    });

    expect(result.current.isUnlocked).toBe(true);
    expect(result.current.masterKey).toBe(mockKey);
    expect(result.current.unlockedForUserId).toBe(userId);
    expect(result.current.vaultUnlockedAt).toBe(unlockedAt);
  });

  it("locks on repeat check when vault max lifetime exceeded while already unlocked", async () => {
    const unlockedAt = Date.now();
    mocks.getCachedMasterKey.mockResolvedValue({ key: mockKey, unlockedAt });

    const { result } = renderHook(() => useEncryptionContext(), { wrapper });

    await act(async () => {
      await result.current.checkEncryptionState(userId);
    });

    expect(result.current.isUnlocked).toBe(true);

    vi.useFakeTimers();
    vi.setSystemTime(unlockedAt + VAULT_MAX_LIFETIME_MS + 1000);

    await act(async () => {
      await result.current.checkEncryptionState(userId);
    });

    expect(mocks.deleteMasterKey).toHaveBeenCalledWith(userId);
    expect(mocks.clearAllKeys).toHaveBeenCalled();
    expect(result.current.isUnlocked).toBe(false);
    expect(result.current.vaultUnlockedAt).toBeNull();
    expect(mocks.getCachedMasterKey).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });
});
