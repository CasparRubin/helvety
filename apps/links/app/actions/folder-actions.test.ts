import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authenticateAndRateLimit: vi.fn(),
  logUnexpectedError: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@helvety/shared/action-helpers", () => ({
  authenticateAndRateLimit: mocks.authenticateAndRateLimit,
}));

vi.mock("@helvety/shared/logger", () => ({
  logger: {
    logUnexpectedError: mocks.logUnexpectedError,
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

import { createFolder, deleteFolder } from "./folder-actions";

const FOLDER_ID = "550e8400-e29b-41d4-a716-446655440000";

/** Minimal payload accepted by {@link EncryptedDataSchema}. */
function sampleEncryptedField(): string {
  return JSON.stringify({
    iv: "QUFBQUFBQUFBQUFBQUFBQQ==",
    ciphertext: "QUFBQUFBQUFBQUFBQUFBQUFBQQ==",
    version: 1,
  });
}

describe("links folder-actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("createFolder returns auth response when rate limit / CSRF fails", async () => {
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ok: false,
      response: { success: false, error: "Invalid CSRF token" },
    });

    const result = await createFolder(
      {
        id: FOLDER_ID,
        encrypted_name: sampleEncryptedField(),
        parent_folder_id: null,
      },
      "bad-csrf"
    );

    expect(result).toEqual({ success: false, error: "Invalid CSRF token" });
  });

  it("deleteFolder rejects invalid folder ids", async () => {
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ok: true,
      ctx: { user: { id: "user-1" }, supabase: { from: vi.fn() } },
    });

    const result = await deleteFolder("not-a-uuid", "csrf");

    expect(result).toEqual({ success: false, error: "Invalid folder ID" });
  });
});
