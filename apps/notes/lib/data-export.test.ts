import { beforeEach, describe, expect, it, vi } from "vitest";

const downloadEncryptedJsonExport = vi.fn();

vi.mock("@helvety/shared/e2ee-json-export", () => ({
  downloadEncryptedJsonExport: (...args: unknown[]) =>
    downloadEncryptedJsonExport(...args),
}));

vi.mock("@/app/actions/entity-actions", () => ({
  getAllNoteDataForExport: vi.fn(),
}));

vi.mock("@/lib/crypto", () => ({
  decryptItemRows: vi.fn(),
}));

import { getAllNoteDataForExport } from "@/app/actions/entity-actions";
import { decryptItemRows } from "@/lib/crypto";

import { downloadNoteDataExport } from "./data-export";

import type { ItemRow } from "@/lib/types";

const masterKey = {} as CryptoKey;

const encryptedRow: ItemRow = {
  id: "row-1",
  user_id: "user-1",
  encrypted_title: "enc-title",
  encrypted_description: null,
  category_id: "inbox",
  sort_order: 0,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-02T00:00:00.000Z",
};

describe("downloadNoteDataExport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    downloadEncryptedJsonExport.mockResolvedValue(undefined);
  });

  it("delegates download plumbing to the shared E2EE JSON export helper", async () => {
    await downloadNoteDataExport(masterKey, { requireConfirmation: false });

    expect(downloadEncryptedJsonExport).toHaveBeenCalledWith({
      masterKey,
      buildExportData: expect.any(Function),
      filenamePrefix: "helvety-notes-export",
      entityLabel: "note",
      requireConfirmation: false,
    });
  });

  it("buildExportData maps decrypted notes for the export payload", async () => {
    vi.mocked(getAllNoteDataForExport).mockResolvedValue({
      success: true,
      data: { items: [encryptedRow] },
    });
    vi.mocked(decryptItemRows).mockResolvedValue([
      {
        id: "note-1",
        user_id: "user-1",
        title: "Weekly review",
        description: "Plaintext body",
        category_id: "inbox",
        sort_order: 0,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-02T00:00:00.000Z",
      },
    ]);

    await downloadNoteDataExport(masterKey);

    const call = downloadEncryptedJsonExport.mock.calls[0]?.[0] as {
      buildExportData: (key: CryptoKey) => Promise<unknown>;
    };
    const payload = await call.buildExportData(masterKey);

    expect(getAllNoteDataForExport).toHaveBeenCalled();
    expect(decryptItemRows).toHaveBeenCalledWith([encryptedRow], masterKey);
    expect(payload).toEqual(
      expect.objectContaining({
        service: "Helvety Notes",
        items: [
          expect.objectContaining({
            id: "note-1",
            title: "Weekly review",
            categoryId: "inbox",
          }),
        ],
      })
    );
  });

  it("surfaces server action failures from buildExportData", async () => {
    vi.mocked(getAllNoteDataForExport).mockResolvedValue({
      success: false,
      error: "Export denied",
    });

    await downloadNoteDataExport(masterKey);

    const call = downloadEncryptedJsonExport.mock.calls[0]?.[0] as {
      buildExportData: (key: CryptoKey) => Promise<unknown>;
    };

    await expect(call.buildExportData(masterKey)).rejects.toThrow(
      "Export denied"
    );
  });
});
