/**
 * Key Storage Module
 * Manages encryption keys in IndexedDB for session persistence
 *
 * Resilience: All IndexedDB operations include retry logic and timeouts to
 * handle Safari-specific quirks (background tab eviction, iOS suspend/resume,
 * aggressive privacy modes) and transient storage errors on mobile.
 */

import { logger } from "@/lib/logger";

import { CryptoError, CryptoErrorType } from "./types";

import type { StoredKeyEntry } from "./types";

const DB_NAME = "helvety-crypto";
const DB_VERSION = 1;
const MASTER_KEY_STORE = "master-keys";
const UNIT_KEY_STORE = "unit-keys";

/** Cache duration for keys (24 hours) */
const KEY_CACHE_DURATION = 24 * 60 * 60 * 1000;

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

      // Store for the master key (keyed by user ID)
      if (!db.objectStoreNames.contains(MASTER_KEY_STORE)) {
        db.createObjectStore(MASTER_KEY_STORE, { keyPath: "userId" });
      }

      // Store for unit keys (keyed by unitId)
      if (!db.objectStoreNames.contains(UNIT_KEY_STORE)) {
        db.createObjectStore(UNIT_KEY_STORE, { keyPath: "unitId" });
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

      const request = store.put({
        userId,
        key,
        cachedAt: Date.now(),
      });

      request.onerror = () => {
        reject(
          new CryptoError(
            CryptoErrorType.STORAGE_ERROR,
            "Failed to store master key"
          )
        );
      };

      request.onsuccess = () => {
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

/**
 * Retrieve the master key from IndexedDB
 *
 * Returns null on any transient storage error instead of throwing, so the
 * EncryptionGate can gracefully fall back to the passkey unlock flow rather
 * than showing an error screen.
 *
 * @param userId - The user's ID
 * @returns The master key if found and not expired, null otherwise
 */
export async function getMasterKey(userId: string): Promise<CryptoKey | null> {
  try {
    const db = await openDatabase();

    return new Promise((resolve) => {
      const transaction = db.transaction(MASTER_KEY_STORE, "readonly");
      const store = transaction.objectStore(MASTER_KEY_STORE);

      const request = store.get(userId);

      request.onerror = () => {
        // Resolve null instead of rejecting - treat storage errors as "no key"
        // so the caller can fall back to passkey unlock instead of erroring out
        logger.error("Failed to retrieve master key from IndexedDB");
        resolve(null);
      };

      request.onsuccess = () => {
        const result = request.result;
        if (!result) {
          resolve(null);
          return;
        }

        // Check if key has expired
        if (Date.now() - result.cachedAt > KEY_CACHE_DURATION) {
          // Key expired, clean it up
          void deleteMasterKey(userId).catch((err) =>
            logger.error("Failed to delete expired master key:", err)
          );
          resolve(null);
          return;
        }

        resolve(result.key);
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    // Any IndexedDB failure (open timeout, storage pressure, etc.) - return
    // null so the caller falls back to passkey unlock instead of erroring out
    logger.error("Failed to access key storage:", error);
    return null;
  }
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
        resolve();
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    // Silently fail on delete errors
    logger.error("Failed to delete master key:", error);
  }
}

/**
 * Store a unit key in IndexedDB
 */
export async function storeUnitKey(
  unitId: number,
  key: CryptoKey
): Promise<void> {
  try {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(UNIT_KEY_STORE, "readwrite");
      const store = transaction.objectStore(UNIT_KEY_STORE);

      const entry: StoredKeyEntry = {
        unitId,
        key,
        cachedAt: Date.now(),
      };

      const request = store.put(entry);

      request.onerror = () => {
        reject(
          new CryptoError(
            CryptoErrorType.STORAGE_ERROR,
            "Failed to store unit key"
          )
        );
      };

      request.onsuccess = () => {
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
      "Failed to store unit key",
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Retrieve a unit key from IndexedDB
 */
export async function getUnitKey(unitId: number): Promise<CryptoKey | null> {
  try {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(UNIT_KEY_STORE, "readonly");
      const store = transaction.objectStore(UNIT_KEY_STORE);

      const request = store.get(unitId);

      request.onerror = () => {
        reject(
          new CryptoError(
            CryptoErrorType.STORAGE_ERROR,
            "Failed to retrieve unit key"
          )
        );
      };

      request.onsuccess = () => {
        const result = request.result as StoredKeyEntry | undefined;
        if (!result) {
          resolve(null);
          return;
        }

        // Check if key has expired
        if (Date.now() - result.cachedAt > KEY_CACHE_DURATION) {
          void deleteUnitKey(unitId).catch((err) =>
            logger.error("Failed to delete expired unit key:", err)
          );
          resolve(null);
          return;
        }

        resolve(result.key);
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch {
    return null;
  }
}

/**
 * Delete a unit key from IndexedDB
 */
export async function deleteUnitKey(unitId: number): Promise<void> {
  try {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(UNIT_KEY_STORE, "readwrite");
      const store = transaction.objectStore(UNIT_KEY_STORE);

      const request = store.delete(unitId);

      request.onerror = () => {
        reject(
          new CryptoError(
            CryptoErrorType.STORAGE_ERROR,
            "Failed to delete unit key"
          )
        );
      };

      request.onsuccess = () => {
        resolve();
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    logger.error("Failed to delete unit key:", error);
  }
}

/**
 * Clear all stored keys
 * Call this on logout to ensure keys are removed
 */
export async function clearAllKeys(): Promise<void> {
  try {
    const db = await openDatabase();

    await Promise.all([
      new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(MASTER_KEY_STORE, "readwrite");
        const request = transaction.objectStore(MASTER_KEY_STORE).clear();
        request.onerror = () => reject();
        request.onsuccess = () => resolve();
      }),
      new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(UNIT_KEY_STORE, "readwrite");
        const request = transaction.objectStore(UNIT_KEY_STORE).clear();
        request.onerror = () => reject();
        request.onsuccess = () => resolve();
      }),
    ]);

    db.close();
  } catch (error) {
    logger.error("Failed to clear all keys:", error);
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
