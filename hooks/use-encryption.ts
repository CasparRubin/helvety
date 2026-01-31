"use client";

import { useCallback } from "react";

import {
  encryptObject,
  decryptObject,
  serializeEncryptedData,
  parseEncryptedData,
} from "@/lib/crypto";
import { useEncryptionContext } from "@/lib/crypto/encryption-context";

/**
 * Generic encrypted fields type
 */
export interface EncryptedFields {
  [key: string]: string | null | undefined;
}

/**
 * Hook for encrypting/decrypting entity data
 * Uses the master key from the encryption context
 */
export function useEncryption() {
  const { masterKey, isUnlocked, isLoading, error } = useEncryptionContext();

  /**
   * Encrypt an object for database storage
   */
  const encrypt = useCallback(
    async <T extends EncryptedFields>(fields: T): Promise<string> => {
      if (!masterKey) {
        throw new Error("Encryption not unlocked");
      }
      const encrypted = await encryptObject(fields, masterKey);
      return serializeEncryptedData(encrypted);
    },
    [masterKey]
  );

  /**
   * Decrypt data from database format
   */
  const decrypt = useCallback(
    async <T extends EncryptedFields>(encryptedData: string): Promise<T> => {
      if (!masterKey) {
        throw new Error("Encryption not unlocked");
      }
      const parsed = parseEncryptedData(encryptedData);
      return decryptObject<T>(parsed, masterKey);
    },
    [masterKey]
  );

  return {
    // State
    isUnlocked,
    isLoading,
    error,

    // Generic operations
    encrypt,
    decrypt,
  };
}

/**
 * Type for the return value of useEncryption
 */
export type UseEncryptionReturn = ReturnType<typeof useEncryption>;
