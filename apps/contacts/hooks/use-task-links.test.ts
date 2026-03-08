import { describe, expect, it, vi } from "vitest";

const cryptoMocks = vi.hoisted(() => ({
  buildAAD: vi.fn(),
  decrypt: vi.fn(),
  parseEncryptedData: vi.fn(),
}));

vi.mock("@/lib/crypto", async () => {
  const actual = await vi.importActual("@/lib/crypto");
  return {
    ...actual,
    buildAAD: cryptoMocks.buildAAD,
    decrypt: cryptoMocks.decrypt,
    parseEncryptedData: cryptoMocks.parseEncryptedData,
  };
});

import { decryptItemTitle } from "./use-task-links";

describe("decryptItemTitle", () => {
  it("decrypts with item AAD", async () => {
    const key = {} as CryptoKey;
    const parsedPayload = { iv: "iv", data: "data" };
    cryptoMocks.parseEncryptedData.mockReturnValue(parsedPayload);
    cryptoMocks.buildAAD.mockReturnValue("aad:items:item-1");
    cryptoMocks.decrypt.mockResolvedValue("Readable Title");

    const result = await decryptItemTitle("enc", "item-1", key);

    expect(cryptoMocks.parseEncryptedData).toHaveBeenCalledWith("enc");
    expect(cryptoMocks.buildAAD).toHaveBeenCalledWith("items", "item-1");
    expect(cryptoMocks.decrypt).toHaveBeenCalledWith(
      parsedPayload,
      key,
      "aad:items:item-1"
    );
    expect(result).toBe("Readable Title");
  });

  it("returns fallback when parsing/decryption fails", async () => {
    const key = {} as CryptoKey;
    cryptoMocks.parseEncryptedData.mockImplementation(() => {
      throw new Error("bad payload");
    });

    const result = await decryptItemTitle("invalid", "item-2", key);

    expect(result).toBe("(encrypted)");
  });
});
