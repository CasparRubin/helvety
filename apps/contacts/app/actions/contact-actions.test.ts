import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  return {
    authenticateAndRateLimit: vi.fn(),
    loggerError: vi.fn(),
    loggerWarn: vi.fn(),
    revalidatePath: vi.fn(),
  };
});

vi.mock("@helvety/shared/action-helpers", () => ({
  authenticateAndRateLimit: mocks.authenticateAndRateLimit,
}));

vi.mock("@helvety/shared/logger", () => ({
  logger: {
    error: mocks.loggerError,
    warn: mocks.loggerWarn,
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

vi.mock("next/server", () => ({
  after: (callback: () => void) => callback(),
}));

import {
  createContact,
  getContact,
  reorderContacts,
  updateContact,
} from "./contact-actions";

/** Builds a valid encrypted payload fixture used by action schemas. */
function getEncryptedValue(): string {
  return JSON.stringify({
    ciphertext: "VGhpcyBpcyBhIHZhbGlkIGNpcGhlcnRleHQ=",
    iv: "MTIzNDU2Nzg5MDEyMzQ1Ng==",
    version: 1,
  });
}

/** Builds a default createContact payload with optional overrides. */
function getCreatePayload(
  overrides?: Partial<Parameters<typeof createContact>[0]>
) {
  return {
    category_id: "default-contact-work",
    encrypted_birthday: null,
    encrypted_description: null,
    encrypted_email: null,
    encrypted_first_name: getEncryptedValue(),
    encrypted_last_name: getEncryptedValue(),
    encrypted_notes: null,
    encrypted_phone: null,
    id: "550e8400-e29b-41d4-a716-446655440000",
    ...overrides,
  };
}

/** Creates a minimal Supabase mock for create-contact action paths. */
function createSupabaseForCreateContact(options?: {
  count?: number;
  countError?: { message: string } | null;
  insertError?: { message: string } | null;
  insertedId?: string | null;
}) {
  const count = options?.count ?? 0;
  const countError = options?.countError ?? null;
  const insertError = options?.insertError ?? null;
  const insertedId = options?.insertedId ?? "new-contact-id";

  const countEq = vi.fn().mockResolvedValue({
    count,
    error: countError,
  });
  const selectCount = vi.fn(() => ({
    eq: countEq,
  }));

  const insertSingle = vi.fn().mockResolvedValue({
    data: insertedId ? { id: insertedId } : null,
    error: insertError,
  });
  const insertSelect = vi.fn(() => ({
    single: insertSingle,
  }));
  const insert = vi.fn(() => ({
    select: insertSelect,
  }));

  return {
    countEq,
    from: vi.fn((table: string) => {
      if (table !== "contacts") {
        throw new Error(`Unexpected table ${table}`);
      }
      return {
        insert,
        select: selectCount,
      };
    }),
    insert,
  };
}

describe("contact-actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns auth response immediately when authentication fails", async () => {
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ok: false,
      response: { error: "Security validation failed", success: false },
    });

    const result = await createContact(getCreatePayload(), "csrf-token");

    expect(result).toEqual({
      error: "Security validation failed",
      success: false,
    });
  });

  it("rejects invalid encrypted payloads before DB calls", async () => {
    const supabase = createSupabaseForCreateContact();
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ctx: { supabase, user: { id: "user-1" } },
      ok: true,
    });

    const result = await createContact(
      getCreatePayload({ encrypted_first_name: "not-json" }),
      "csrf-token"
    );

    expect(result).toEqual({
      error: "Invalid contact data",
      success: false,
    });
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("blocks creation when per-user contact limit is reached", async () => {
    const supabase = createSupabaseForCreateContact({ count: 500 });
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ctx: { supabase, user: { id: "user-1" } },
      ok: true,
    });

    const result = await createContact(getCreatePayload(), "csrf-token");

    expect(result).toMatchObject({
      error: expect.stringContaining("Contact limit reached"),
      success: false,
    });
    expect(supabase.insert).not.toHaveBeenCalled();
  });

  it("returns failure when insert fails", async () => {
    const supabase = createSupabaseForCreateContact({
      insertError: { message: "insert failed" },
      insertedId: null,
    });
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ctx: { supabase, user: { id: "user-1" } },
      ok: true,
    });

    const result = await createContact(getCreatePayload(), "csrf-token");

    expect(result).toEqual({
      error: "Failed to create contact",
      success: false,
    });
  });

  it("revalidates contact routes after successful create and update", async () => {
    const supabase = createSupabaseForCreateContact({
      insertedId: "new-contact-id",
    });
    const updateEqUser = vi.fn().mockResolvedValue({ error: null });
    const updateEqId = vi.fn(() => ({ eq: updateEqUser }));
    const update = vi.fn(() => ({ eq: updateEqId }));
    supabase.from.mockImplementation((table: string) => {
      if (table !== "contacts") {
        throw new Error(`Unexpected table ${table}`);
      }
      return {
        insert: supabase.insert,
        select: vi.fn(() => ({ eq: supabase.countEq })),
        update,
      };
    });

    mocks.authenticateAndRateLimit.mockResolvedValue({
      ctx: { supabase, user: { id: "user-1" } },
      ok: true,
    });

    const created = await createContact(getCreatePayload(), "csrf-token");
    const updated = await updateContact(
      {
        encrypted_first_name: getEncryptedValue(),
        id: "550e8400-e29b-41d4-a716-446655440000",
      },
      "csrf-token"
    );

    expect(created).toEqual({
      data: { id: "new-contact-id" },
      success: true,
    });
    expect(updated).toEqual({ success: true });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/contacts");
    expect(mocks.revalidatePath).toHaveBeenCalledWith(
      "/contacts/contacts/550e8400-e29b-41d4-a716-446655440000"
    );
  });

  it("validates contact IDs before DB reads", async () => {
    const result = await getContact("invalid-id");

    expect(result).toEqual({
      error: "Invalid contact ID",
      success: false,
    });
    expect(mocks.authenticateAndRateLimit).not.toHaveBeenCalled();
  });

  it("validates reorder payload size and rejects non-UUID rows", async () => {
    const supabase = createSupabaseForCreateContact();
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ctx: { supabase, user: { id: "user-1" } },
      ok: true,
    });

    const result = await reorderContacts(
      [{ id: "invalid", sort_order: 0 }],
      "csrf-token"
    );

    expect(result).toEqual({
      error: "Invalid reorder data",
      success: false,
    });
  });
});
