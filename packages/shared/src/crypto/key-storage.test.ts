import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { MockBroadcastChannel, getChannelInstances } = vi.hoisted(() => {
  /** Cross-tab message handler for the mock BroadcastChannel. */
  type Handler = (event: MessageEvent) => void;
  const channelsByName = new Map<string, Set<MockBroadcastChannel>>();

  /** In-memory BroadcastChannel stand-in for cross-tab key-storage tests. */
  class MockBroadcastChannel {
    name: string;
    onmessage: Handler | null = null;
    postMessage = vi.fn((data: unknown) => {
      const peers = channelsByName.get(this.name);
      if (!peers) return;
      for (const peer of peers) {
        if (peer !== this && peer.onmessage) {
          peer.onmessage({ data } as MessageEvent);
        }
      }
    });
    close = vi.fn(() => {
      channelsByName.get(this.name)?.delete(this);
    });

    constructor(name: string) {
      this.name = name;
      if (!channelsByName.has(name)) {
        channelsByName.set(name, new Set());
      }
      channelsByName.get(name)!.add(this);
    }
  }

  return {
    MockBroadcastChannel,
    getChannelInstances: (name: string) => [
      ...(channelsByName.get(name) ?? []),
    ],
  };
});

vi.stubGlobal("BroadcastChannel", MockBroadcastChannel);

import "fake-indexeddb/auto";

import {
  AUTH_MAX_LIFETIME_MS,
  AUTH_SLIDING_IDLE_MS,
} from "../auth-session-policy";

import {
  clearAllKeys,
  deleteMasterKey,
  getCachedMasterKey,
  getMasterKey,
  onKeyEvent,
  storeMasterKey,
  touchVaultSessionInStorage,
} from "./key-storage";

/** Non-extractable AES-256-GCM test key. */
async function testKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, [
    "encrypt",
    "decrypt",
  ]);
}

/** IndexedDB round-trips CryptoKey objects; compare by encrypt/decrypt behavior. */
async function expectSameKeyMaterial(
  original: CryptoKey,
  retrieved: CryptoKey | null | undefined
): Promise<void> {
  expect(retrieved).toBeDefined();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode("key-material-check");
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    original,
    plaintext
  );
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    retrieved!,
    ciphertext
  );
  expect(new TextDecoder().decode(decrypted)).toBe("key-material-check");
}

const USER_ID = "11111111-1111-4111-8111-111111111111";
const KEY_CHANNEL = "helvety-key-ops";

describe("key-storage", () => {
  beforeEach(async () => {
    await clearAllKeys();
    for (const channel of getChannelInstances(KEY_CHANNEL)) {
      channel.postMessage.mockClear();
    }
  });

  afterEach(async () => {
    await clearAllKeys();
  });

  it("stores and retrieves a master key for a user", async () => {
    const key = await testKey();
    await storeMasterKey(USER_ID, key);
    const cached = await getCachedMasterKey(USER_ID);
    await expectSameKeyMaterial(key, cached?.key);
    expect(cached?.unlockedAt).toBeTypeOf("number");
    const fromGet = await getMasterKey(USER_ID);
    await expectSameKeyMaterial(key, fromGet);
  });

  it("deleteMasterKey removes the cached key", async () => {
    const key = await testKey();
    await storeMasterKey(USER_ID, key);
    await deleteMasterKey(USER_ID);
    await expect(getMasterKey(USER_ID)).resolves.toBeNull();
  });

  it("returns null when vault session exceeded max lifetime", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const key = await testKey();
    const now = Date.now();
    vi.setSystemTime(now);
    await storeMasterKey(USER_ID, key);

    vi.setSystemTime(now + AUTH_MAX_LIFETIME_MS + 1);
    await expect(getCachedMasterKey(USER_ID)).resolves.toBeNull();
    vi.useRealTimers();
  });

  it("returns null when vault session exceeded sliding idle window", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const key = await testKey();
    const now = Date.now();
    vi.setSystemTime(now);
    await storeMasterKey(USER_ID, key);

    vi.setSystemTime(now + AUTH_SLIDING_IDLE_MS + 1);
    await expect(getCachedMasterKey(USER_ID)).resolves.toBeNull();
    vi.useRealTimers();
  });

  it("touchVaultSessionInStorage extends sliding idle without resetting unlockedAt", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const key = await testKey();
    const now = Date.now();
    vi.setSystemTime(now);
    await storeMasterKey(USER_ID, key);

    const first = await getCachedMasterKey(USER_ID);
    expect(first).not.toBeNull();

    vi.setSystemTime(now + AUTH_SLIDING_IDLE_MS - 1_000);
    await touchVaultSessionInStorage(USER_ID);

    vi.setSystemTime(now + AUTH_SLIDING_IDLE_MS + 500);
    const afterTouch = await getCachedMasterKey(USER_ID);
    await expectSameKeyMaterial(key, afterTouch?.key);
    expect(afterTouch?.unlockedAt).toBe(first?.unlockedAt);
    vi.useRealTimers();
  });

  it("posts master-key-stored to BroadcastChannel on storeMasterKey", async () => {
    onKeyEvent(() => {});
    const key = await testKey();
    await storeMasterKey(USER_ID, key);

    const [channel] = getChannelInstances(KEY_CHANNEL);
    expect(channel?.postMessage).toHaveBeenCalledWith({
      type: "master-key-stored",
      userId: USER_ID,
    });
  });

  it("onKeyEvent receives master-key-stored from another tab", async () => {
    const listener = vi.fn();
    const unsubscribe = onKeyEvent(listener);

    const otherTab = new MockBroadcastChannel(KEY_CHANNEL);
    otherTab.postMessage({ type: "master-key-stored", userId: USER_ID });

    expect(listener).toHaveBeenCalledWith({
      type: "master-key-stored",
      userId: USER_ID,
    });
    unsubscribe();
    otherTab.close();
  });

  it("clearAllKeys removes keys for all users", async () => {
    const key = await testKey();
    await storeMasterKey(USER_ID, key);
    await storeMasterKey("22222222-2222-4222-8222-222222222222", key);
    await clearAllKeys();
    await expect(getMasterKey(USER_ID)).resolves.toBeNull();
    await expect(
      getMasterKey("22222222-2222-4222-8222-222222222222")
    ).resolves.toBeNull();
  });
});
