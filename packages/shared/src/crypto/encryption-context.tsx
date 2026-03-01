"use client";

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  getMasterKey,
  deleteMasterKey,
  clearAllKeys,
  isStorageAvailable,
} from "./key-storage";
import {
  isPasskeySupported,
  isPRFSupported,
  getPRFSupportInfo,
} from "./passkey";
import { type PRFSupportInfo } from "./prf-key-derivation";

/** Internal state for the encryption context */
interface EncryptionState {
  /** Whether encryption is unlocked (master key available) */
  isUnlocked: boolean;
  /** Whether we're currently loading/checking encryption state */
  isLoading: boolean;
  /** The master key (null if locked) */
  masterKey: CryptoKey | null;
  /** The userId for which the current masterKey was derived/loaded */
  unlockedForUserId: string | null;
  /** Error message if something went wrong */
  error: string | null;
  /** Whether passkey/PRF is supported on this device */
  prfSupported: boolean | null;
  /** Detailed PRF support info */
  prfSupportInfo: PRFSupportInfo | null;
}

/** Public API exposed by the encryption context */
interface EncryptionContextValue extends EncryptionState {
  /**
   * Lock encryption (clear master key)
   * Call this on logout
   */
  lockEncryption: (userId: string) => Promise<void>;

  /**
   * Check if a cached master key exists in IndexedDB for the user
   * and update context state accordingly
   */
  checkEncryptionState: (userId: string) => Promise<void>;

  /**
   * Check PRF/passkey support
   */
  checkPRFSupport: () => Promise<void>;
}

const EncryptionContext = createContext<EncryptionContextValue | null>(null);

/** Props for the EncryptionProvider component */
interface EncryptionProviderProps {
  children: ReactNode;
}

/**
 * Provider component for end-to-end encryption state management.
 * Handles passkey-based encryption initialization, unlocking, and key management.
 */
export function EncryptionProvider({ children }: EncryptionProviderProps) {
  const [state, setState] = useState<EncryptionState>({
    isUnlocked: false,
    isLoading: true,
    masterKey: null,
    unlockedForUserId: null,
    error: null,
    prfSupported: null,
    prfSupportInfo: null,
  });

  // Ref tracking current state so checkEncryptionState can read it without
  // adding state to its dependency array (which would recreate the callback
  // on every render and defeat the purpose of the early-return optimisation).
  // Synced in useEffect to avoid ref access during render (React rule, Compiler).
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  /**
   * Check PRF/passkey support
   */
  const checkPRFSupport = useCallback(async () => {
    if (!isPasskeySupported()) {
      setState((prev) => ({
        ...prev,
        prfSupported: false,
        prfSupportInfo: { supported: false, reason: "WebAuthn not supported" },
      }));
      return;
    }

    const supported = await isPRFSupported();
    const info = await getPRFSupportInfo();

    setState((prev) => ({
      ...prev,
      prfSupported: supported,
      prfSupportInfo: info,
    }));
  }, []);

  /**
   * Check if we have a cached master key
   */
  const checkEncryptionState = useCallback(
    async (userId: string) => {
      // Already unlocked for this user — skip the IndexedDB read entirely.
      // This prevents the isLoading toggle and a new CryptoKey reference
      // (IndexedDB structured-clone always returns a fresh object) from
      // cascading through every data hook and triggering mass re-fetches.
      const current = stateRef.current;
      if (
        current.isUnlocked &&
        current.unlockedForUserId === userId &&
        current.masterKey
      ) {
        if (current.isLoading) {
          setState((prev) => ({ ...prev, isLoading: false }));
        }
        return;
      }

      if (!isStorageAvailable()) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error:
            "IndexedDB not available - encryption requires a modern browser",
        }));
        return;
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        // Also check PRF support while we're at it
        void checkPRFSupport();

        const cachedKey = await getMasterKey(userId);
        if (cachedKey) {
          setState((prev) => ({
            ...prev,
            isUnlocked: true,
            isLoading: false,
            masterKey: cachedKey,
            unlockedForUserId: userId,
            error: null,
          }));
        } else {
          setState((prev) => ({
            ...prev,
            isUnlocked: false,
            isLoading: false,
            masterKey: null,
            unlockedForUserId: null,
            error: null,
          }));
        }
      } catch {
        setState((prev) => ({
          ...prev,
          isUnlocked: false,
          isLoading: false,
          masterKey: null,
          error: "Failed to check encryption state",
        }));
      }
    },
    [checkPRFSupport]
  );

  /**
   * Lock encryption (clear keys)
   */
  const lockEncryption = useCallback(async (userId: string) => {
    await deleteMasterKey(userId);
    await clearAllKeys();

    setState((prev) => ({
      ...prev,
      isUnlocked: false,
      isLoading: false,
      masterKey: null,
      unlockedForUserId: null,
      error: null,
    }));
  }, []);

  const value: EncryptionContextValue = {
    ...state,
    lockEncryption,
    checkEncryptionState,
    checkPRFSupport,
  };

  return (
    <EncryptionContext.Provider value={value}>
      {children}
    </EncryptionContext.Provider>
  );
}

/**
 * Hook to access encryption context
 */
export function useEncryptionContext(): EncryptionContextValue {
  const context = useContext(EncryptionContext);
  if (!context) {
    throw new Error(
      "useEncryptionContext must be used within an EncryptionProvider"
    );
  }
  return context;
}
