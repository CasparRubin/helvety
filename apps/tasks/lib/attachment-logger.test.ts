import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const insert = vi.fn();
  const from = vi.fn(() => ({ insert }));

  return {
    from,
    insert,
    loggerError: vi.fn(),
    loggerInfo: vi.fn(),
    loggerWarn: vi.fn(),
  };
});

vi.mock("@helvety/shared/logger", () => ({
  logger: {
    error: mocks.loggerError,
    info: mocks.loggerInfo,
    warn: mocks.loggerWarn,
  },
}));

vi.mock("@helvety/shared/supabase/admin", () => ({
  ["createAdmin" + "Client"]: vi.fn(() => ({
    from: mocks.from,
  })),
}));

import { logAttachmentEvent } from "./attachment-logger";

describe("logAttachmentEvent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.insert.mockResolvedValue({ error: null });
  });

  afterEach(async () => {
    await Promise.resolve();
  });

  it("logs warning events and persists structured metadata", async () => {
    logAttachmentEvent("attachment_upload_failed", {
      attachmentId: "attachment-1",
      fileSizeBytes: 1234,
      ip: "203.0.113.20",
      metadata: { reason: "scan_timeout" },
      storagePath: "user/file.enc",
      userId: "550e8400-e29b-41d4-a716-446655440000",
    });

    await Promise.resolve();

    expect(mocks.loggerWarn).toHaveBeenCalledWith(
      "[ATTACHMENT] attachment_upload_failed (user: 550e...0000)",
      expect.objectContaining({
        event: "attachment_upload_failed",
        fileSizeBytes: 1234,
        reason: "scan_timeout",
        source: "attachment-audit",
      })
    );
    expect(mocks.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        attachment_id: "attachment-1",
        event: "attachment_upload_failed",
        ip_address: "203.0.113.20",
        storage_path: "user/file.enc",
        user_id: "550e8400-e29b-41d4-a716-446655440000",
      })
    );
  });

  it("routes explicit error-level events through logger.error", async () => {
    logAttachmentEvent("attachment_deleted", {
      level: "error",
      userId: "shortid",
    });

    await Promise.resolve();

    expect(mocks.loggerError).toHaveBeenCalledWith(
      "[ATTACHMENT] attachment_deleted (user: shortid)",
      expect.objectContaining({
        event: "attachment_deleted",
        source: "attachment-audit",
        userId: "shortid",
      })
    );
  });

  it("does not crash when database persistence fails", async () => {
    mocks.insert.mockRejectedValue(new Error("db down"));

    logAttachmentEvent("attachment_download", {
      userId: "550e8400-e29b-41d4-a716-446655440000",
    });

    await Promise.resolve();

    expect(mocks.loggerInfo).toHaveBeenCalled();
    expect(mocks.loggerError).toHaveBeenCalledWith(
      "[ATTACHMENT-AUDIT] Unexpected error persisting audit log:",
      expect.objectContaining({
        error: "db down",
      })
    );
  });
});
