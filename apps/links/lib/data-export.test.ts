import { beforeEach, describe, expect, it, vi } from "vitest";

const downloadEncryptedJsonExport = vi.fn();

vi.mock("@helvety/shared/e2ee-json-export", () => ({
  downloadEncryptedJsonExport: (...args: unknown[]) =>
    downloadEncryptedJsonExport(...args),
}));

vi.mock("@/app/actions/entity-actions", () => ({
  getAllLinkDataForExport: vi.fn(),
}));

vi.mock("@/lib/crypto", () => ({
  decryptFolderRows: vi.fn(),
  decryptLinkRows: vi.fn(),
}));

import { getAllLinkDataForExport } from "@/app/actions/entity-actions";
import { decryptFolderRows, decryptLinkRows } from "@/lib/crypto";

import { downloadLinkDataExport } from "./data-export";

import type { LinkFolderRow, LinkRow } from "@/lib/types";

const masterKey = {} as CryptoKey;

const encryptedFolder: LinkFolderRow = {
  id: "folder-1",
  user_id: "user-1",
  encrypted_name: "enc-folder",
  parent_folder_id: null,
  sort_order: 0,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-02T00:00:00.000Z",
};

const encryptedLink: LinkRow = {
  id: "link-1",
  user_id: "user-1",
  encrypted_name: "enc-name",
  encrypted_url: "enc-url",
  folder_id: "folder-1",
  sort_order: 0,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-02T00:00:00.000Z",
};

describe("downloadLinkDataExport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    downloadEncryptedJsonExport.mockResolvedValue(undefined);
  });

  it("delegates download plumbing to the shared E2EE JSON export helper", async () => {
    await downloadLinkDataExport(masterKey);

    expect(downloadEncryptedJsonExport).toHaveBeenCalledWith({
      masterKey,
      buildExportData: expect.any(Function),
      filenamePrefix: "helvety-links-export",
      entityLabel: "bookmark",
    });
  });

  it("buildExportData maps decrypted folders and links for the export payload", async () => {
    vi.mocked(getAllLinkDataForExport).mockResolvedValue({
      success: true,
      data: {
        folders: [encryptedFolder],
        links: [encryptedLink],
      },
    });
    vi.mocked(decryptFolderRows).mockResolvedValue([
      {
        id: "folder-1",
        user_id: "user-1",
        name: "Work",
        parent_folder_id: null,
        sort_order: 0,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-02T00:00:00.000Z",
      },
    ]);
    vi.mocked(decryptLinkRows).mockResolvedValue([
      {
        id: "link-1",
        user_id: "user-1",
        name: "Helvety",
        url: "https://helvety.com",
        folder_id: "folder-1",
        sort_order: 0,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-02T00:00:00.000Z",
      },
    ]);

    await downloadLinkDataExport(masterKey);

    const call = downloadEncryptedJsonExport.mock.calls[0]?.[0] as {
      buildExportData: (key: CryptoKey) => Promise<unknown>;
    };
    const payload = await call.buildExportData(masterKey);

    expect(getAllLinkDataForExport).toHaveBeenCalled();
    expect(decryptFolderRows).toHaveBeenCalledWith(
      [encryptedFolder],
      masterKey
    );
    expect(decryptLinkRows).toHaveBeenCalledWith([encryptedLink], masterKey);
    expect(payload).toEqual(
      expect.objectContaining({
        service: "Helvety Links",
        folders: [
          expect.objectContaining({
            id: "folder-1",
            name: "Work",
          }),
        ],
        links: [
          expect.objectContaining({
            id: "link-1",
            url: "https://helvety.com",
          }),
        ],
      })
    );
  });

  it("surfaces server action failures from buildExportData", async () => {
    vi.mocked(getAllLinkDataForExport).mockResolvedValue({
      success: false,
      error: "Export denied",
    });

    await downloadLinkDataExport(masterKey);

    const call = downloadEncryptedJsonExport.mock.calls[0]?.[0] as {
      buildExportData: (key: CryptoKey) => Promise<unknown>;
    };

    await expect(call.buildExportData(masterKey)).rejects.toThrow(
      "Export denied"
    );
  });
});
