import { describe, expect, it, vi } from "vitest";

const cryptoMocks = vi.hoisted(() => ({
  safeDecryptDisplayField: vi.fn(),
}));

vi.mock("@helvety/shared/crypto", () => ({
  safeDecryptDisplayField: cryptoMocks.safeDecryptDisplayField,
}));

import { decryptItemTitle } from "./decrypt-item-title";

describe("decryptItemTitle", () => {
  it("delegates to safeDecryptDisplayField with items AAD", async () => {
    const key = {} as CryptoKey;
    cryptoMocks.safeDecryptDisplayField.mockResolvedValue("Readable Title");

    const result = await decryptItemTitle("enc", "item-1", key);

    expect(cryptoMocks.safeDecryptDisplayField).toHaveBeenCalledWith({
      encrypted: "enc",
      recordId: "item-1",
      key,
      aadTable: "items",
    });
    expect(result).toBe("Readable Title");
  });

  it("returns fallback value from shared helper on failure", async () => {
    const key = {} as CryptoKey;
    cryptoMocks.safeDecryptDisplayField.mockResolvedValue("(encrypted)");

    const result = await decryptItemTitle("invalid", "item-2", key);

    expect(result).toBe("(encrypted)");
  });
});
