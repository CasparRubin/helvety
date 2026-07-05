import { describe, expect, it } from "vitest";

import * as cryptoBarrel from "./index";

/** Removed from the public crypto barrel after E2EE API consolidation. */
const REMOVED_CRYPTO_BARREL_EXPORTS = [
  "encrypt",
  "decrypt",
  "encryptObject",
  "decryptObject",
  "encryptFields",
  "decryptFields",
  "isEncryptedData",
  "buildFieldAAD",
  "CURRENT_KEY_VERSION",
  "SUPPORTED_ENCRYPTION_VERSIONS",
  "isSupportedEncryptionVersion",
] as const;

describe("crypto barrel exports", () => {
  it("exposes entity-field encryption helpers", () => {
    expect(cryptoBarrel.ENCRYPTION_VERSION).toBe(2);
    expect(typeof cryptoBarrel.encryptEntityField).toBe("function");
    expect(typeof cryptoBarrel.decryptEntityField).toBe("function");
    expect(typeof cryptoBarrel.parseEncryptedData).toBe("function");
    expect(typeof cryptoBarrel.serializeEncryptedData).toBe("function");
  });

  it.each(REMOVED_CRYPTO_BARREL_EXPORTS)(
    "does not export removed symbol %s",
    (exportName) => {
      expect(exportName in cryptoBarrel).toBe(false);
    }
  );
});
