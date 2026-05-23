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

import { createDoc, deleteDoc, updateDoc } from "./doc-actions";

const DOC_ID = "550e8400-e29b-41d4-a716-446655440000";

/** Minimal payload accepted by {@link EncryptedDataSchema}. */
function sampleEncryptedField(): string {
  return JSON.stringify({
    iv: "QUFBQUFBQUFBQUFBQUFBQQ==",
    ciphertext: "QUFBQUFBQUFBQUFBQUFBQUFBQQ==",
    version: 1,
  });
}

describe("docs doc-actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("createDoc returns auth response when rate limit / CSRF fails", async () => {
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ok: false,
      response: { success: false, error: "Invalid CSRF token" },
    });

    const result = await createDoc(
      {
        id: DOC_ID,
        encrypted_title: sampleEncryptedField(),
        encrypted_docx: sampleEncryptedField(),
      },
      "bad-csrf"
    );

    expect(result).toEqual({ success: false, error: "Invalid CSRF token" });
  });

  it("createDoc rejects invalid payload before Supabase", async () => {
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ok: true,
      ctx: {
        user: { id: "user-1" },
        supabase: { from: vi.fn() },
      },
    });

    const result = await createDoc(
      {
        id: "not-a-uuid",
        encrypted_title: sampleEncryptedField(),
        encrypted_docx: sampleEncryptedField(),
      },
      "csrf-token"
    );

    expect(result.success).toBe(false);
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("createDoc revalidates /docs after a successful insert", async () => {
    const from = vi.fn(() => ({
      insert: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: { id: DOC_ID }, error: null }),
        }),
      }),
    }));

    mocks.authenticateAndRateLimit.mockResolvedValue({
      ok: true,
      ctx: {
        user: { id: "user-1" },
        supabase: { from },
      },
    });

    const result = await createDoc(
      {
        id: DOC_ID,
        encrypted_title: sampleEncryptedField(),
        encrypted_docx: sampleEncryptedField(),
      },
      "csrf-token"
    );

    expect(result).toEqual({ success: true, data: { id: DOC_ID } });
    expect(from).toHaveBeenCalledWith("docs");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/docs");
  });

  it("deleteDoc rejects invalid document ids", async () => {
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ok: true,
      ctx: {
        user: { id: "user-1" },
        supabase: { from: vi.fn() },
      },
    });

    const result = await deleteDoc("bad-id", "csrf-token");

    expect(result).toEqual({ success: false, error: "Invalid document ID" });
  });

  it("updateDoc revalidates /docs after a successful update", async () => {
    const from = vi.fn(() => ({
      update: () => ({
        eq: () => ({
          eq: () => Promise.resolve({ error: null }),
        }),
      }),
    }));

    mocks.authenticateAndRateLimit.mockResolvedValue({
      ok: true,
      ctx: {
        user: { id: "user-1" },
        supabase: { from },
      },
    });

    const result = await updateDoc(
      { id: DOC_ID, encrypted_title: sampleEncryptedField() },
      "csrf-token"
    );

    expect(result).toEqual({ success: true });
    expect(from).toHaveBeenCalledWith("docs");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/docs");
  });
});
