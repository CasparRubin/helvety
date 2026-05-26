import { describe, expect, it, vi } from "vitest";

import { decryptItemDisplayTitle } from "./decrypt-item-display-title";

const safeDecryptDisplayField = vi.hoisted(() => vi.fn());

vi.mock("./safe-decrypt-display-field", () => ({
  safeDecryptDisplayField,
}));

describe("decryptItemDisplayTitle", () => {
  it("delegates to safeDecryptDisplayField with items AAD", async () => {
    const key = {} as CryptoKey;
    safeDecryptDisplayField.mockResolvedValue("Readable Title");

    const result = await decryptItemDisplayTitle("enc", "item-1", key);

    expect(safeDecryptDisplayField).toHaveBeenCalledWith({
      encrypted: "enc",
      recordId: "item-1",
      key,
      aadTable: "items",
    });
    expect(result).toBe("Readable Title");
  });

  it("returns fallback value from shared helper on failure", async () => {
    const key = {} as CryptoKey;
    safeDecryptDisplayField.mockResolvedValue("(encrypted)");

    const result = await decryptItemDisplayTitle("invalid", "item-2", key);

    expect(result).toBe("(encrypted)");
  });
});
