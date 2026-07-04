import { describe, expect, it } from "vitest";

import { generateKeyCheckValue, verifyKeyCheckValue } from "./key-check";

/** Non-extractable AES-256-GCM test key. */
async function testKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, [
    "encrypt",
    "decrypt",
  ]);
}

describe("key-check", () => {
  it("round-trips generate and verify with the same master key", async () => {
    const key = await testKey();
    const kcv = await generateKeyCheckValue(key);
    await expect(verifyKeyCheckValue(key, kcv)).resolves.toBe(true);
  });

  it("returns false when a different master key is used", async () => {
    const keyA = await testKey();
    const keyB = await testKey();
    const kcv = await generateKeyCheckValue(keyA);
    await expect(verifyKeyCheckValue(keyB, kcv)).resolves.toBe(false);
  });

  it("returns false for malformed KCV JSON", async () => {
    const key = await testKey();
    await expect(verifyKeyCheckValue(key, "not-json")).resolves.toBe(false);
    await expect(verifyKeyCheckValue(key, "{}")).resolves.toBe(false);
  });

  it("returns false when ciphertext is tampered", async () => {
    const key = await testKey();
    const kcv = await generateKeyCheckValue(key);
    const parsed = JSON.parse(kcv) as {
      iv: string;
      ciphertext: string;
      version: number;
    };
    parsed.ciphertext = `${parsed.ciphertext.slice(0, -2)}aa`;
    await expect(
      verifyKeyCheckValue(key, JSON.stringify(parsed))
    ).resolves.toBe(false);
  });
});
