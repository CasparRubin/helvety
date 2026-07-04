import { describe, expect, it } from "vitest";

import { base64Decode } from "./encoding";
import {
  PRF_VERSION,
  deriveKeyFromPRF,
  generatePRFParams,
  getPRFSaltBytes,
} from "./prf-key-derivation";

const PRF_OUTPUT = new Uint8Array(32).fill(0xab);

describe("prf-key-derivation", () => {
  it("generatePRFParams uses 32-byte salt and current version", () => {
    const params = generatePRFParams();
    expect(params.version).toBe(PRF_VERSION);
    expect(getPRFSaltBytes(params).byteLength).toBe(32);
  });

  it("deriveKeyFromPRF is deterministic for fixed PRF output and salt", async () => {
    const params = generatePRFParams();
    const keyA = await deriveKeyFromPRF(PRF_OUTPUT.buffer, params);
    const keyB = await deriveKeyFromPRF(PRF_OUTPUT.buffer, params);
    expect(keyA.type).toBe("secret");
    expect(keyA.algorithm.name).toBe("AES-GCM");
    expect(keyA.extractable).toBe(false);
    expect(keyA.usages).toEqual(["encrypt", "decrypt"]);

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const plaintext = new TextEncoder().encode("helvety-prf-determinism");
    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      keyA,
      plaintext
    );
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      keyB,
      ciphertext
    );
    expect(new TextDecoder().decode(decrypted)).toBe("helvety-prf-determinism");
  });

  it("deriveKeyFromPRF changes when salt changes", async () => {
    const saltA = generatePRFParams();
    const saltB = generatePRFParams();
    expect(saltA.prfSalt).not.toBe(saltB.prfSalt);

    const keyA = await deriveKeyFromPRF(PRF_OUTPUT.buffer, saltA);
    const keyB = await deriveKeyFromPRF(PRF_OUTPUT.buffer, saltB);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const plaintext = new TextEncoder().encode("helvety-prf-salt");
    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      keyA,
      plaintext
    );
    await expect(
      crypto.subtle.decrypt({ name: "AES-GCM", iv }, keyB, ciphertext)
    ).rejects.toThrow();
  });

  it("getPRFSaltBytes round-trips base64 salt from params", () => {
    const params = generatePRFParams();
    const bytes = getPRFSaltBytes(params);
    expect(bytes.byteLength).toBe(32);
    expect(Array.from(bytes)).toEqual(Array.from(base64Decode(params.prfSalt)));
  });
});
