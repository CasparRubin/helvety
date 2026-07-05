import { buildAuthRequiredError } from "@helvety/shared/auth-errors";
import {
  createAuthSuccessContext,
  createOwnedUpdateSupabaseMock,
  sampleEncryptedField,
} from "@helvety/shared/test-utils/action-test-helpers";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authenticateAndRateLimit: vi.fn(),
  revalidatePath: vi.fn(),
  logUnexpectedError: vi.fn(),
}));

vi.mock("@helvety/shared/action-helpers", () => ({
  authenticateAndRateLimit: mocks.authenticateAndRateLimit,
}));

vi.mock("@helvety/shared/logger", () => ({
  logger: {
    info: vi.fn(),
    logUnexpectedError: mocks.logUnexpectedError,
    warn: vi.fn(),
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

import { createItem, deleteItem, updateItem } from "./item-actions";

const ITEM_ID = "550e8400-e29b-41d4-a716-446655440000";

describe("notes item-actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("revalidates notes route after a successful update", async () => {
    const supabase = createOwnedUpdateSupabaseMock("notes", {
      data: { id: ITEM_ID },
      error: null,
    });
    mocks.authenticateAndRateLimit.mockResolvedValue(
      createAuthSuccessContext(supabase)
    );

    const result = await updateItem(
      {
        encrypted_title: sampleEncryptedField(),
        id: ITEM_ID,
      },
      "csrf-token"
    );

    expect(result).toEqual({ success: true });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/notes");
  });

  it("returns not found when update affects zero rows", async () => {
    const supabase = createOwnedUpdateSupabaseMock("notes", {
      data: null,
      error: null,
    });
    mocks.authenticateAndRateLimit.mockResolvedValue(
      createAuthSuccessContext(supabase)
    );

    const result = await updateItem(
      {
        encrypted_title: sampleEncryptedField(),
        id: ITEM_ID,
      },
      "csrf-token"
    );

    expect(result).toEqual({ success: false, error: "Note not found" });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("returns auth guard response and skips DB work when auth fails", async () => {
    const authError = buildAuthRequiredError();
    mocks.authenticateAndRateLimit.mockResolvedValueOnce({
      ok: false,
      response: { success: false, error: authError },
    });

    await expect(
      updateItem(
        {
          encrypted_title: sampleEncryptedField(),
          id: "550e8400-e29b-41d4-a716-446655440000",
        },
        "csrf-token"
      )
    ).resolves.toEqual({ success: false, error: authError });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("rejects malformed payloads before update query", async () => {
    const update = vi.fn();
    const supabase = {
      from: vi.fn(() => ({ update })),
    };
    mocks.authenticateAndRateLimit.mockResolvedValueOnce({
      ok: true,
      ctx: { supabase, user: { id: "user-1" } },
    });

    await expect(
      updateItem(
        {
          encrypted_title: "not-json",
          id: "550e8400-e29b-41d4-a716-446655440000",
        },
        "csrf-token"
      )
    ).resolves.toEqual({ success: false, error: "Invalid note data" });
    expect(update).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("forwards csrfToken to authenticateAndRateLimit on createItem", async () => {
    const single = vi
      .fn()
      .mockResolvedValue({ data: { id: ITEM_ID }, error: null });
    const select = vi.fn(() => ({ single }));
    const insert = vi.fn(() => ({ select }));
    const supabase = { from: vi.fn(() => ({ insert })) };
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ok: true,
      ctx: { supabase, user: { id: "user-1" } },
    });

    await createItem(
      {
        id: ITEM_ID,
        encrypted_title: sampleEncryptedField(),
        encrypted_description: null,
      },
      "csrf-token"
    );

    expect(mocks.authenticateAndRateLimit).toHaveBeenCalledWith({
      csrfToken: "csrf-token",
      rateLimitPrefix: "notes",
    });
  });

  it("creates a note and revalidates the route", async () => {
    const single = vi
      .fn()
      .mockResolvedValue({ data: { id: ITEM_ID }, error: null });
    const select = vi.fn(() => ({ single }));
    const insert = vi.fn(() => ({ select }));
    const supabase = { from: vi.fn(() => ({ insert })) };
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ok: true,
      ctx: { supabase, user: { id: "user-1" } },
    });

    const result = await createItem(
      {
        id: ITEM_ID,
        encrypted_title: sampleEncryptedField(),
        encrypted_description: null,
      },
      "csrf-token"
    );

    expect(result).toEqual({ success: true, data: { id: ITEM_ID } });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/notes");
  });

  it("rejects invalid encrypted payload on createItem before DB calls", async () => {
    const insert = vi.fn();
    const supabase = { from: vi.fn(() => ({ insert })) };
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ok: true,
      ctx: { supabase, user: { id: "user-1" } },
    });

    const result = await createItem(
      {
        id: ITEM_ID,
        encrypted_title: "not-json",
        encrypted_description: null,
      },
      "csrf-token"
    );

    expect(result).toEqual({ success: false, error: "Invalid note data" });
    expect(insert).not.toHaveBeenCalled();
  });

  it("deletes a note and revalidates the route", async () => {
    const deleteEqUser = vi.fn().mockResolvedValue({ error: null });
    const deleteEqId = vi.fn(() => ({ eq: deleteEqUser }));
    const del = vi.fn(() => ({ eq: deleteEqId }));
    const supabase = { from: vi.fn(() => ({ delete: del })) };
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ok: true,
      ctx: { supabase, user: { id: "user-1" } },
    });

    const result = await deleteItem(ITEM_ID, "csrf-token");

    expect(result).toEqual({ success: true });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/notes");
  });

  it("rejects deleteItem when auth fails", async () => {
    const authError = buildAuthRequiredError();
    mocks.authenticateAndRateLimit.mockResolvedValueOnce({
      ok: false,
      response: { success: false, error: authError },
    });

    await expect(deleteItem(ITEM_ID, "csrf-token")).resolves.toEqual({
      success: false,
      error: authError,
    });
  });

  it("rejects invalid note id on deleteItem", async () => {
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ok: true,
      ctx: { supabase: { from: vi.fn() }, user: { id: "user-1" } },
    });

    const result = await deleteItem("not-a-uuid", "csrf-token");

    expect(result).toEqual({ success: false, error: "Invalid note ID" });
  });
});
