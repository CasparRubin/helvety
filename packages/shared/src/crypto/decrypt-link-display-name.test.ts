import { describe, expect, it, vi } from "vitest";

import {
  decryptLinkDisplayName,
  decryptLinkDisplayUrl,
} from "./decrypt-link-display-name";

const safeDecryptDisplayField = vi.hoisted(() => vi.fn());

vi.mock("./safe-decrypt-display-field", () => ({
  safeDecryptDisplayField,
}));

describe("decryptLinkDisplayName", () => {
  it("delegates to safeDecryptDisplayField with links AAD", async () => {
    const key = {} as CryptoKey;
    safeDecryptDisplayField.mockResolvedValue("Bookmark Name");

    const result = await decryptLinkDisplayName("enc-name", "link-1", key);

    expect(safeDecryptDisplayField).toHaveBeenCalledWith({
      encrypted: "enc-name",
      recordId: "link-1",
      key,
      aadTable: "links",
    });
    expect(result).toBe("Bookmark Name");
  });
});

describe("decryptLinkDisplayUrl", () => {
  it("delegates to safeDecryptDisplayField with links AAD", async () => {
    const key = {} as CryptoKey;
    safeDecryptDisplayField.mockResolvedValue("https://example.com");

    const result = await decryptLinkDisplayUrl("enc-url", "link-1", key);

    expect(safeDecryptDisplayField).toHaveBeenCalledWith({
      encrypted: "enc-url",
      recordId: "link-1",
      key,
      aadTable: "links",
    });
    expect(result).toBe("https://example.com");
  });
});
