/**
 * Key Storage Module
 * Manages temporary master-key caching in IndexedDB (vault session policy, cross-tab aware)
 *
 * Resilience: All IndexedDB operations include retry logic and timeouts to
 * handle Safari-specific quirks (background tab eviction, iOS suspend/resume,
 * aggressive privacy modes) and transient storage errors on mobile.
 */

import { logger } from "../logger";

import { CryptoError, CryptoErrorType } from "./types";
import {
  createVaultSession,
  isVaultSessionValid,
  normalizeVaultSessionTimestamps,
  touchVaultSession,
} from "./vault-session";

const DB_NAME = "helvety-crypto";
const DB_VERSION = 2;
const MASTER_KEY_STORE = "master-keys";

// =============================================================================
// Cross-Tab Coordination via BroadcastChannel
// =============================================================================

/** Channel name for cross-tab key operation coordination */
const KEY_CHANNEL_NAME = "helvety-key-ops";

/** Message types for cross-tab coordination */
type KeyChannelMessage =
  | { type: "keys-cleared" }
  | { type: "master-key-stored"; userId: string }
  | { type: "master-key-deleted"; userId: string };

/** Callbacks registered for cross-tab key events */
type KeyEventListener = (message: KeyChannelMessage) => void;

/** Stored master key row in IndexedDB. */
type StoredMasterKeyRecord = {
  userId: string;
  key: CryptoKey;
  unlockedAt: number;
  lastActiveAt: number;
};

let keyChannel: BroadcastChannel | null = null;
const keyEventListeners: Set<KeyEventListener> = new Set();

/** Get or create the BroadcastChannel for cross-tab key coordination */
function getKeyChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === "undefined") return null;
  if (keyChannel) return keyChannel;

  try {
    keyChannel = new BroadcastChannel(KEY_CHANNEL_NAME);
    keyChannel.onmessage = (event: MessageEvent<KeyChannelMessage>) => {
      for (const listener of keyEventListeners) {
        try {
          listener(event.data);
        } catch (err) {
          logger.logUnexpectedError("Error in key event listener", err);
        }
      }
    };
    return keyChannel;
  } catch {
    return null;
  }
}

/** Broadcast a key operation to other tabs */
function broadcastKeyEvent(message: KeyChannelMessage): void {
  try {
    getKeyChannel()?.postMessage(message);
  } catch {
    // BroadcastChannel may fail in some contexts (e.g., service workers)
  }
}

/**
 * Register a listener for cross-tab key events.
 * Use this to react when another tab clears or updates keys
 * (e.g., to lock the encryption UI when another tab logs out).
 *
 * @returns An unsubscribe function
 */
export function onKeyEvent(listener: KeyEventListener): () => void {
  // Ensure the channel is created when a listener is registered
  getKeyChannel();
  keyEventListeners.add(listener);
  return () => {
    keyEventListeners.delete(listener);
  };
}

/** Timeout for IndexedDB open requests (ms) - Safari can hang indefinitely */
const DB_OPEN_TIMEOUT_MS = 5_000;

/** Delay between IndexedDB retry attempts (ms) */
const DB_RETRY_DELAY_MS = 200;

/**
 * Open the IndexedDB database (single attempt with timeout).
 *
 * Safari on iOS can hang on indexedDB.open() when the page is resumed from
 * a background/suspended state. A timeout ensures we fail fast and retry
 * instead of blocking the UI indefinitely.
 */
function openDatabaseOnce(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    let settled = false;

    // Timeout guard - prevent indefinite hangs on Safari iOS
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(
          new CryptoError(
            CryptoErrorType.STORAGE_ERROR,
            "IndexedDB open timed out"
          )
        );
      }
    }, DB_OPEN_TIMEOUT_MS);

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        reject(
          new CryptoError(
            CryptoErrorType.STORAGE_ERROR,
            "Failed to open key storage database"
          )
        );
      }
    };

    request.onsuccess = () => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve(request.result);
      }
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const { oldVersion } = event;

      if (oldVersion > 0 && oldVersion < DB_VERSION) {
        if (db.objectStoreNames.contains(MASTER_KEY_STORE)) {
          db.deleteObjectStore(MASTER_KEY_STORE);
        }
      }

      if (!db.objectStoreNames.contains(MASTER_KEY_STORE)) {
        db.createObjectStore(MASTER_KEY_STORE, { keyPath: "userId" });
      }
    };
  });
}

/**
 * Open the IndexedDB database with retry.
 *
 * Retries once after a brief delay when the first attempt fails or times out.
 * This handles transient failures caused by Safari iOS suspend/resume cycles,
 * storage pressure, and other intermittent IndexedDB issues on mobile.
 *
 * @param retries - Number of retries after the initial attempt (default: 1)
 */
async function openDatabase(retries = 1): Promise<IDBDatabase> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await openDatabaseOnce();
    } catch (error) {
      if (attempt >= retries) throw error;
      // Brief delay before retry
      await new Promise((resolve) => setTimeout(resolve, DB_RETRY_DELAY_MS));
    }
  }

  // TypeScript exhaustiveness (unreachable)
  throw new CryptoError(
    CryptoErrorType.STORAGE_ERROR,
    "Failed to open key storage database"
  );
}

/** Build an IndexedDB master-key row with a new vault session. */
function buildStoredRecord(
  userId: string,
  key: CryptoKey,
  session = createVaultSession()
): StoredMasterKeyRecord {
  return {
    userId,
    key,
    unlockedAt: session.unlockedAt,
    lastActiveAt: session.lastActiveAt,
  };
}

/** True when stored vault timestamps are within policy. */
function isRecordVaultValid(
  record: StoredMasterKeyRecord | null | undefined
): boolean {
  if (!record) return false;
  const timestamps = normalizeVaultSessionTimestamps(record);
  if (!timestamps) return false;
  return isVaultSessionValid(timestamps);
}

/**
 * Renew vault session timestamps in IndexedDB without changing the key.
 * Keeps inactivity lock and cached key expiry aligned.
 */
export async function touchVaultSessionInStorage(
  userId: string
): Promise<void> {
  try {
    const db = await openDatabase();

    await new Promise<void>((resolve) => {
      const transaction = db.transaction(MASTER_KEY_STORE, "readwrite");
      const store = transaction.objectStore(MASTER_KEY_STORE);
      const getRequest = store.get(userId);

      getRequest.onerror = () => resolve();

      getRequest.onsuccess = () => {
        const existing = getRequest.result as StoredMasterKeyRecord | undefined;
        if (!existing?.key) {
          resolve();
          return;
        }

        const timestamps = normalizeVaultSessionTimestamps(existing);
        if (!timestamps || !isVaultSessionValid(timestamps)) {
          resolve();
          return;
        }

        const touched = touchVaultSession(timestamps);
        const updated: StoredMasterKeyRecord = {
          ...existing,
          unlockedAt: touched.unlockedAt,
          lastActiveAt: touched.lastActiveAt,
        };

        const putRequest = store.put(updated);
        putRequest.onerror = () => resolve();
        putRequest.onsuccess = () => {
          broadcastKeyEvent({ type: "master-key-stored", userId });
          resolve();
        };
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    logger.logUnexpectedError(
      "Failed to touch vault session in storage",
      error
    );
  }
}

/**
 * Store the master key in IndexedDB
 * Note: CryptoKey objects can be stored directly in IndexedDB
 *
 * @param userId - The user's ID
 * @param key - The master CryptoKey
 */
export async function storeMasterKey(
  userId: string,
  key: CryptoKey
): Promise<void> {
  try {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(MASTER_KEY_STORE, "readwrite");
      const store = transaction.objectStore(MASTER_KEY_STORE);

      const request = store.put(buildStoredRecord(userId, key));

      request.onerror = () => {
        reject(
          new CryptoError(
            CryptoErrorType.STORAGE_ERROR,
            "Failed to store master key"
          )
        );
      };

      request.onsuccess = () => {
        broadcastKeyEvent({ type: "master-key-stored", userId });
        resolve();
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    if (error instanceof CryptoError) throw error;
    throw new CryptoError(
      CryptoErrorType.STORAGE_ERROR,
      "Failed to store master key",
      error instanceof Error ? error : undefined
    );
  }
}

/** Cached master key plus vault session anchor for in-memory lock timers. */
export type CachedMasterKey = {
  key: CryptoKey;
  unlockedAt: number;
};

/**
 * Retrieve a valid cached master key and its vault `unlockedAt` anchor.
 *
 * Returns null on any transient storage error instead of throwing, so the
 * EncryptionGate can gracefully fall back to the passkey unlock flow rather
 * than showing an error screen.
 */
export async function getCachedMasterKey(
  userId: string
): Promise<CachedMasterKey | null> {
  try {
    const db = await openDatabase();

    return new Promise((resolve) => {
      const transaction = db.transaction(MASTER_KEY_STORE, "readwrite");
      const store = transaction.objectStore(MASTER_KEY_STORE);

      const request = store.get(userId);

      request.onerror = () => {
        // Resolve null instead of rejecting - treat storage errors as "no key"
        // so the caller can fall back to passkey unlock instead of erroring out
        logger.error("Failed to retrieve master key from IndexedDB");
        resolve(null);
      };

      request.onsuccess = () => {
        const result = request.result as StoredMasterKeyRecord | undefined;
        if (!result?.key) {
          resolve(null);
          return;
        }

        if (!isRecordVaultValid(result)) {
          void deleteMasterKey(userId).catch((err) =>
            logger.logUnexpectedError(
              "Failed to delete expired master key",
              err
            )
          );
          resolve(null);
          return;
        }

        const timestamps = normalizeVaultSessionTimestamps(result);
        if (!timestamps) {
          resolve(null);
          return;
        }

        const touched = touchVaultSession(timestamps);
        const updated: StoredMasterKeyRecord = {
          ...result,
          unlockedAt: touched.unlockedAt,
          lastActiveAt: touched.lastActiveAt,
        };

        const putRequest = store.put(updated);
        putRequest.onerror = () => {
          // Fail toward passkey unlock if touch write fails
          resolve(null);
        };
        putRequest.onsuccess = () => {
          broadcastKeyEvent({ type: "master-key-stored", userId });
          resolve({ key: result.key, unlockedAt: touched.unlockedAt });
        };
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    // Any IndexedDB failure (open timeout, storage pressure, etc.) - return
    // null so the caller falls back to passkey unlock instead of erroring out
    logger.logUnexpectedError("Failed to access key storage", error);
    return null;
  }
}

/**
 * Retrieve the master key from IndexedDB
 *
 * @param userId - The user's ID
 * @returns The master key if found and not expired, null otherwise
 */
export async function getMasterKey(userId: string): Promise<CryptoKey | null> {
  const cached = await getCachedMasterKey(userId);
  return cached?.key ?? null;
}

/**
 * Delete the master key from IndexedDB
 * Call this on logout or when the user wants to lock encryption
 */
export async function deleteMasterKey(userId: string): Promise<void> {
  try {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(MASTER_KEY_STORE, "readwrite");
      const store = transaction.objectStore(MASTER_KEY_STORE);

      const request = store.delete(userId);

      request.onerror = () => {
        reject(
          new CryptoError(
            CryptoErrorType.STORAGE_ERROR,
            "Failed to delete master key"
          )
        );
      };

      request.onsuccess = () => {
        broadcastKeyEvent({ type: "master-key-deleted", userId });
        resolve();
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    // Silently fail on delete errors
    logger.logUnexpectedError("Failed to delete master key", error);
  }
}

/**
 * Clear all stored keys
 * Call this on logout to ensure keys are removed
 */
export async function clearAllKeys(): Promise<void> {
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(MASTER_KEY_STORE, "readwrite");
      const request = transaction.objectStore(MASTER_KEY_STORE).clear();
      request.onerror = () => reject();
      request.onsuccess = () => resolve();
    });

    db.close();
    broadcastKeyEvent({ type: "keys-cleared" });
  } catch (error) {
    logger.logUnexpectedError("Failed to clear all keys", error);
  }
}

/**
 * Check if IndexedDB is available.
 *
 * Goes beyond a simple typeof check: Safari can have the indexedDB global
 * defined but throw when you actually try to use it (e.g. in some privacy
 * modes, or when storage quota is exhausted). We attempt a lightweight open
 * to catch these cases.
 */
export function isStorageAvailable(): boolean {
  if (typeof indexedDB === "undefined") return false;

  try {
    // Safari may throw synchronously on indexedDB.open() in certain
    // privacy/storage-pressure scenarios. Catch those early.
    const testRequest = indexedDB.open("__idb_test__");
    testRequest.onerror = () => {
      /* swallow - we only care about the synchronous throw */
    };
    testRequest.onsuccess = () => {
      // Clean up test database
      testRequest.result.close();
      try {
        indexedDB.deleteDatabase("__idb_test__");
      } catch {
        /* best effort cleanup */
      }
    };
    return true;
  } catch {
    return false;
  }
}
