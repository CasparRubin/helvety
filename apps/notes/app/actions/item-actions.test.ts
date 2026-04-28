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

import { updateItem } from "./item-actions";

/** Builds a valid encrypted payload fixture used by action schemas. */
function getEncryptedValue(): string {
  return JSON.stringify({
    ciphertext: "VGhpcyBpcyBhIHZhbGlkIGNpcGhlcnRleHQ=",
    iv: "MTIzNDU2Nzg5MDEyMzQ1Ng==",
    version: 1,
  });
}

describe("notes item-actions cache invalidation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("revalidates notes route after a successful update", async () => {
    const updateEqUser = vi.fn().mockResolvedValue({ error: null });
    const updateEqId = vi.fn(() => ({ eq: updateEqUser }));
    const update = vi.fn(() => ({ eq: updateEqId }));
    const supabase = {
      from: vi.fn(() => ({ update })),
    };
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ok: true,
      ctx: { supabase, user: { id: "user-1" } },
    });

    const result = await updateItem(
      {
        encrypted_title: getEncryptedValue(),
        id: "550e8400-e29b-41d4-a716-446655440000",
      },
      "csrf-token"
    );

    expect(result).toEqual({ success: true });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/notes");
  });

  it("returns auth guard response and skips DB work when auth fails", async () => {
    mocks.authenticateAndRateLimit.mockResolvedValueOnce({
      ok: false,
      response: { success: false, error: "Not authenticated" },
    });

    await expect(
      updateItem(
        {
          encrypted_title: getEncryptedValue(),
          id: "550e8400-e29b-41d4-a716-446655440000",
        },
        "csrf-token"
      )
    ).resolves.toEqual({ success: false, error: "Not authenticated" });
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
});
