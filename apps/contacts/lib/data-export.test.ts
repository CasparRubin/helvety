import { beforeEach, describe, expect, it, vi } from "vitest";

const downloadEncryptedJsonExport = vi.fn();

vi.mock("@helvety/shared/e2ee-json-export", () => ({
  downloadEncryptedJsonExport: (...args: unknown[]) =>
    downloadEncryptedJsonExport(...args),
}));

vi.mock("@/app/actions/contact-actions", () => ({
  getAllContactDataForExport: vi.fn(),
}));

vi.mock("@/lib/crypto", () => ({
  decryptContactRows: vi.fn(),
}));

import { getAllContactDataForExport } from "@/app/actions/contact-actions";
import { decryptContactRows } from "@/lib/crypto";

import { downloadContactDataExport } from "./data-export";

import type { ContactRow } from "@/lib/types";

const masterKey = {} as CryptoKey;

const encryptedRow: ContactRow = {
  id: "row-1",
  user_id: "user-1",
  encrypted_first_name: "enc-first",
  encrypted_last_name: "enc-last",
  encrypted_description: null,
  encrypted_email: null,
  encrypted_phone: null,
  encrypted_birthday: null,
  encrypted_notes: null,
  category_id: "personal",
  sort_order: 0,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-02T00:00:00.000Z",
};

describe("downloadContactDataExport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    downloadEncryptedJsonExport.mockResolvedValue(undefined);
  });

  it("delegates download plumbing to the shared E2EE JSON export helper", async () => {
    await downloadContactDataExport(masterKey, { requireConfirmation: false });

    expect(downloadEncryptedJsonExport).toHaveBeenCalledWith({
      masterKey,
      buildExportData: expect.any(Function),
      filenamePrefix: "helvety-contacts-export",
      entityLabel: "contact",
      requireConfirmation: false,
    });
  });

  it("buildExportData maps decrypted contacts for the export payload", async () => {
    vi.mocked(getAllContactDataForExport).mockResolvedValue({
      success: true,
      data: [encryptedRow],
    });
    vi.mocked(decryptContactRows).mockResolvedValue([
      {
        id: "contact-1",
        user_id: "user-1",
        first_name: "Ada",
        last_name: "Lovelace",
        description: null,
        email: "ada@example.com",
        phone: null,
        birthday: null,
        notes: null,
        category_id: "personal",
        sort_order: 0,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-02T00:00:00.000Z",
      },
    ]);

    await downloadContactDataExport(masterKey);

    const call = downloadEncryptedJsonExport.mock.calls[0]?.[0] as {
      buildExportData: (key: CryptoKey) => Promise<unknown>;
    };
    const payload = await call.buildExportData(masterKey);

    expect(getAllContactDataForExport).toHaveBeenCalled();
    expect(decryptContactRows).toHaveBeenCalledWith([encryptedRow], masterKey);
    expect(payload).toEqual(
      expect.objectContaining({
        service: "Helvety Contacts",
        contacts: [
          expect.objectContaining({
            id: "contact-1",
            firstName: "Ada",
            lastName: "Lovelace",
            email: "ada@example.com",
          }),
        ],
      })
    );
  });

  it("surfaces server action failures from buildExportData", async () => {
    vi.mocked(getAllContactDataForExport).mockResolvedValue({
      success: false,
      error: "Export denied",
    });

    await downloadContactDataExport(masterKey);

    const call = downloadEncryptedJsonExport.mock.calls[0]?.[0] as {
      buildExportData: (key: CryptoKey) => Promise<unknown>;
    };

    await expect(call.buildExportData(masterKey)).rejects.toThrow(
      "Export denied"
    );
  });
});
