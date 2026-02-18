"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

import {
  storeMasterKey,
  getMasterKey,
  deleteMasterKey,
  clearAllKeys,
  isStorageAvailable,
} from "./key-storage";
import {
  isPasskeySupported,
  authenticatePasskeyWithEncryption,
  isPRFSupported,
  getPRFSupportInfo,
} from "./passkey";
import { verifyKeyCheckValue } from "./key-check";
import {
  deriveKeyFromPRF,
  type PRFKeyParams,
  type PRFSupportInfo,
} from "./prf-key-derivation";

/** Internal state for the encryption context */
interface EncryptionState {
  /** Whether encryption is unlocked (master key available) */
  isUnlocked: boolean;
  /** Whether we're currently loading/checking encryption state */
  isLoading: boolean;
  /** The master key (null if locked) */
  masterKey: CryptoKey | null;
  /** Error message if something went wrong */
  error: string | null;
  /** Whether passkey/PRF is supported on this device */
  prfSupported: boolean | null;
  /** Detailed PRF support info */
  prfSupportInfo: PRFSupportInfo | null;
}

/**
 * Callback to verify server-side that the passkey credential belongs to
 * the current session user. Must return true to proceed with key derivation.
 */
export type VerifyCredentialFn = (credentialId: string) => Promise<boolean>;

/** Public API exposed by the encryption context */
interface EncryptionContextValue extends EncryptionState {
  /**
   * Unlock encryption with passkey (PRF-based).
   *
   * When `verifyCredential` is provided, the credential returned by WebAuthn
   * is verified server-side before the master key is derived and stored.
   * This prevents a wrong passkey (from another account) from silently
   * corrupting encrypted data.
   *
   * When `keyCheckValue` is provided, the derived key is tested against it
   * before being stored. A mismatch means the wrong key was derived and the
   * unlock is rejected (defense-in-depth).
   */
  unlockWithPasskey: (
    userId: string,
    prfParams: PRFKeyParams,
    credentialIds?: string[],
    verifyCredential?: VerifyCredentialFn,
    keyCheckValue?: string | null
  ) => Promise<boolean>;

  /**
   * Lock encryption (clear master key)
   * Call this on logout
   */
  lockEncryption: (userId: string) => Promise<void>;

  /**
   * Check if encryption is set up for a user
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
    error: null,
    prfSupported: null,
    prfSupportInfo: null,
  });

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
            error: null,
          }));
        } else {
          setState((prev) => ({
            ...prev,
            isUnlocked: false,
            isLoading: false,
            masterKey: null,
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
      error: null,
    }));
  }, []);

  /**
   * Unlock encryption with passkey (PRF-based)
   */
  const unlockWithPasskey = useCallback(
    async (
      userId: string,
      prfParams: PRFKeyParams,
      credentialIds?: string[],
      verifyCredential?: VerifyCredentialFn,
      keyCheckValue?: string | null
    ): Promise<boolean> => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        // Authenticate with passkey and get PRF output
        const result = await authenticatePasskeyWithEncryption(
          credentialIds,
          prfParams.prfSalt
        );

        if (!result.prfEnabled || !result.prfOutput) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: "PRF output not received during authentication",
          }));
          return false;
        }

        // Verify the credential belongs to the session user before deriving
        // the key. Without this check, a wrong passkey from another account
        // would produce an incorrect master key and silently corrupt data.
        if (verifyCredential) {
          const isOwner = await verifyCredential(result.credentialId);
          if (!isOwner) {
            setState((prev) => ({
              ...prev,
              isLoading: false,
              error:
                "This passkey belongs to a different account. Please use the correct passkey.",
            }));
            return false;
          }
        }

        // Derive master key from PRF output
        const masterKey = await deriveKeyFromPRF(result.prfOutput, prfParams);

        // If a key check value exists, verify the derived key is correct
        // before storing it. A mismatch means the wrong passkey was used.
        if (keyCheckValue) {
          const isValid = await verifyKeyCheckValue(masterKey, keyCheckValue);
          if (!isValid) {
            setState((prev) => ({
              ...prev,
              isLoading: false,
              error:
                "Wrong passkey used. The derived key does not match your account. Please try again with the correct passkey.",
            }));
            return false;
          }
        }

        // Cache the master key
        await storeMasterKey(userId, masterKey);

        setState((prev) => ({
          ...prev,
          isUnlocked: true,
          isLoading: false,
          masterKey,
          error: null,
        }));

        return true;
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to unlock with passkey";
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: message,
        }));
        return false;
      }
    },
    []
  );

  const value: EncryptionContextValue = {
    ...state,
    unlockWithPasskey,
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
