import { beforeEach, describe, expect, it, vi } from "vitest";

const downloadEncryptedJsonExport = vi.fn();

vi.mock("@helvety/shared/e2ee-json-export", () => ({
  downloadEncryptedJsonExport: (...args: unknown[]) =>
    downloadEncryptedJsonExport(...args),
}));

vi.mock("@/app/actions/entity-actions", () => ({
  getAllTaskDataForExport: vi.fn(),
}));

vi.mock("@/lib/crypto", () => ({
  decryptItemRows: vi.fn(),
}));

import { getAllTaskDataForExport } from "@/app/actions/entity-actions";
import { decryptItemRows } from "@/lib/crypto";

import { downloadTaskDataExport } from "./data-export";

import type { ItemRow } from "@/lib/types";

const masterKey = {} as CryptoKey;

const encryptedRow: ItemRow = {
  id: "row-1",
  user_id: "user-1",
  encrypted_title: "enc-title",
  encrypted_description: null,
  encrypted_start_date: null,
  encrypted_end_date: null,
  stage_id: "todo",
  label_id: "default",
  sort_order: 0,
  priority: 0,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-02T00:00:00.000Z",
};

describe("downloadTaskDataExport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    downloadEncryptedJsonExport.mockResolvedValue(undefined);
  });

  it("delegates download plumbing to the shared E2EE JSON export helper", async () => {
    await downloadTaskDataExport(masterKey, { requireConfirmation: false });

    expect(downloadEncryptedJsonExport).toHaveBeenCalledWith({
      masterKey,
      buildExportData: expect.any(Function),
      filenamePrefix: "helvety-tasks-export",
      entityLabel: "task",
      requireConfirmation: false,
    });
  });

  it("buildExportData maps decrypted tasks for the export payload", async () => {
    vi.mocked(getAllTaskDataForExport).mockResolvedValue({
      success: true,
      data: { items: [encryptedRow] },
    });
    vi.mocked(decryptItemRows).mockResolvedValue([
      {
        id: "task-1",
        user_id: "user-1",
        title: "Ship audit",
        description: null,
        stage_id: "todo",
        label_id: "default",
        sort_order: 0,
        priority: 1,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-02T00:00:00.000Z",
        start_date: null,
        end_date: null,
      },
    ]);

    await downloadTaskDataExport(masterKey);

    const call = downloadEncryptedJsonExport.mock.calls[0]?.[0] as {
      buildExportData: (key: CryptoKey) => Promise<unknown>;
    };
    const payload = await call.buildExportData(masterKey);

    expect(getAllTaskDataForExport).toHaveBeenCalled();
    expect(decryptItemRows).toHaveBeenCalledWith([encryptedRow], masterKey);
    expect(payload).toEqual(
      expect.objectContaining({
        service: "Helvety Tasks",
        items: [
          expect.objectContaining({
            id: "task-1",
            title: "Ship audit",
            priority: 1,
          }),
        ],
      })
    );
  });

  it("surfaces server action failures from buildExportData", async () => {
    vi.mocked(getAllTaskDataForExport).mockResolvedValue({
      success: false,
      error: "Export denied",
    });

    await downloadTaskDataExport(masterKey);

    const call = downloadEncryptedJsonExport.mock.calls[0]?.[0] as {
      buildExportData: (key: CryptoKey) => Promise<unknown>;
    };

    await expect(call.buildExportData(masterKey)).rejects.toThrow(
      "Export denied"
    );
  });
});
