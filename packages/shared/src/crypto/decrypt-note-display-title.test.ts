import { describe, expect, it, vi } from "vitest";

import { decryptNoteDisplayTitle } from "./decrypt-note-display-title";

const safeDecryptDisplayField = vi.hoisted(() => vi.fn());

vi.mock("./safe-decrypt-display-field", () => ({
  safeDecryptDisplayField,
}));

describe("decryptNoteDisplayTitle", () => {
  it("delegates to safeDecryptDisplayField with notes AAD", async () => {
    const key = {} as CryptoKey;
    safeDecryptDisplayField.mockResolvedValue("Readable Note");

    const result = await decryptNoteDisplayTitle("enc", "note-1", key);

    expect(safeDecryptDisplayField).toHaveBeenCalledWith({
      encrypted: "enc",
      recordId: "note-1",
      key,
      aadTable: "notes",
    });
    expect(result).toBe("Readable Note");
  });
});
