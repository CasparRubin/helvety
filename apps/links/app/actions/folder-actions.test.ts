import {
  createAuthSuccessContext,
  createOwnedUpdateSupabaseMock,
  sampleEncryptedField,
} from "@helvety/shared/test-utils/action-test-helpers";
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

import { createFolder, deleteFolder, updateFolder } from "./folder-actions";

const FOLDER_ID = "550e8400-e29b-41d4-a716-446655440000";

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

  it("updateFolder rejects a folder set as its own parent", async () => {
    const from = vi.fn();
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ok: true,
      ctx: { user: { id: "user-1" }, supabase: { from } },
    });

    const result = await updateFolder(
      { id: FOLDER_ID, parent_folder_id: FOLDER_ID },
      "csrf"
    );

    expect(result).toEqual({
      success: false,
      error: "A folder cannot be its own parent",
    });
    expect(from).not.toHaveBeenCalled();
  });

  it("deleteFolder rejects invalid folder ids", async () => {
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ok: true,
      ctx: { user: { id: "user-1" }, supabase: { from: vi.fn() } },
    });

    const result = await deleteFolder("not-a-uuid", "csrf");

    expect(result).toEqual({ success: false, error: "Invalid folder ID" });
  });

  it("forwards csrfToken to authenticateAndRateLimit on createFolder", async () => {
    const single = vi
      .fn()
      .mockResolvedValue({ data: { id: FOLDER_ID }, error: null });
    const select = vi.fn(() => ({ single }));
    const insert = vi.fn(() => ({ select }));
    const supabase = { from: vi.fn(() => ({ insert })) };
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ok: true,
      ctx: { supabase, user: { id: "user-1" } },
    });

    await createFolder(
      {
        id: FOLDER_ID,
        encrypted_name: sampleEncryptedField(),
        parent_folder_id: null,
      },
      "csrf-token"
    );

    expect(mocks.authenticateAndRateLimit).toHaveBeenCalledWith({
      csrfToken: "csrf-token",
      rateLimitPrefix: "links",
    });
  });

  it("creates a folder and revalidates the route", async () => {
    const single = vi
      .fn()
      .mockResolvedValue({ data: { id: FOLDER_ID }, error: null });
    const select = vi.fn(() => ({ single }));
    const insert = vi.fn(() => ({ select }));
    const supabase = { from: vi.fn(() => ({ insert })) };
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ok: true,
      ctx: { supabase, user: { id: "user-1" } },
    });

    const result = await createFolder(
      {
        id: FOLDER_ID,
        encrypted_name: sampleEncryptedField(),
        parent_folder_id: null,
      },
      "csrf-token"
    );

    expect(result).toEqual({ success: true, data: { id: FOLDER_ID } });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/links");
  });

  it("rejects invalid encrypted payloads before DB calls on createFolder", async () => {
    const insert = vi.fn();
    const supabase = { from: vi.fn(() => ({ insert })) };
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ok: true,
      ctx: { supabase, user: { id: "user-1" } },
    });

    const result = await createFolder(
      {
        id: FOLDER_ID,
        encrypted_name: "not-json",
        parent_folder_id: null,
      },
      "csrf-token"
    );

    expect(result).toEqual({ success: false, error: "Invalid folder data" });
    expect(insert).not.toHaveBeenCalled();
  });

  it("updates a folder and revalidates the route", async () => {
    const supabase = createOwnedUpdateSupabaseMock("link_folders", {
      data: { id: FOLDER_ID },
      error: null,
    });
    mocks.authenticateAndRateLimit.mockResolvedValue(
      createAuthSuccessContext(supabase)
    );

    const result = await updateFolder(
      { id: FOLDER_ID, encrypted_name: sampleEncryptedField() },
      "csrf-token"
    );

    expect(result).toEqual({ success: true });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/links");
  });

  it("returns not found when update affects zero rows", async () => {
    const supabase = createOwnedUpdateSupabaseMock("link_folders", {
      data: null,
      error: null,
    });
    mocks.authenticateAndRateLimit.mockResolvedValue(
      createAuthSuccessContext(supabase)
    );

    const result = await updateFolder(
      { id: FOLDER_ID, encrypted_name: sampleEncryptedField() },
      "csrf-token"
    );

    expect(result).toEqual({ success: false, error: "Folder not found" });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
});
