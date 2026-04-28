import { ACTION_LIMITS } from "@helvety/shared/constants";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  return {
    authenticateAndRateLimit: vi.fn(),
    logUnexpectedError: vi.fn(),
    loggerWarn: vi.fn(),
    revalidatePath: vi.fn(),
  };
});

vi.mock("@helvety/shared/action-helpers", () => ({
  authenticateAndRateLimit: mocks.authenticateAndRateLimit,
}));

vi.mock("@helvety/shared/logger", () => ({
  logger: {
    error: vi.fn(),
    warn: mocks.loggerWarn,
    info: vi.fn(),
    logUnexpectedError: mocks.logUnexpectedError,
  },
}));

vi.mock("@helvety/shared/rate-limit", () => ({
  RATE_LIMITS: {
    API: { maxRequests: 100, windowMs: 60_000 },
    EXPORT: { maxRequests: 5, windowMs: 60_000 },
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
  getAllContactDataForExport,
  getContact,
  getContacts,
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
  let insertedPayload: Record<string, unknown> | null = null;
  const insert = vi.fn((payload: Record<string, unknown>) => {
    insertedPayload = payload;
    return {
      select: insertSelect,
    };
  });

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
    getInsertedPayload: () => insertedPayload,
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

  it("does not enforce a per-user contact quota during creation", async () => {
    const supabase = createSupabaseForCreateContact({ count: 500 });
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ctx: { supabase, user: { id: "user-1" } },
      ok: true,
    });

    const result = await createContact(getCreatePayload(), "csrf-token");

    expect(result).toEqual({
      data: { id: "new-contact-id" },
      success: true,
    });
    expect(supabase.insert).toHaveBeenCalled();
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

  it("defaults category_id to personal when omitted on create", async () => {
    const supabase = createSupabaseForCreateContact({
      insertedId: "new-contact-id",
    });
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ctx: { supabase, user: { id: "user-1" } },
      ok: true,
    });

    const result = await createContact(getCreatePayload(), "csrf-token");

    expect(result).toEqual({
      data: { id: "new-contact-id" },
      success: true,
    });
    expect(supabase.getInsertedPayload()).toMatchObject({
      category_id: "personal",
    });
  });

  it("accepts explicit category_id on create", async () => {
    const supabase = createSupabaseForCreateContact({
      insertedId: "new-contact-id",
    });
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ctx: { supabase, user: { id: "user-1" } },
      ok: true,
    });

    const result = await createContact(
      getCreatePayload({ category_id: "work" }),
      "csrf-token"
    );

    expect(result).toEqual({
      data: { id: "new-contact-id" },
      success: true,
    });
    expect(supabase.getInsertedPayload()).toMatchObject({
      category_id: "work",
    });
  });

  it("revalidates contact routes after successful create", async () => {
    const supabase = createSupabaseForCreateContact({
      insertedId: "new-contact-id",
    });

    mocks.authenticateAndRateLimit.mockResolvedValue({
      ctx: { supabase, user: { id: "user-1" } },
      ok: true,
    });

    const created = await createContact(getCreatePayload(), "csrf-token");

    expect(created).toEqual({
      data: { id: "new-contact-id" },
      success: true,
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/contacts");
  });

  it("revalidates routes after successful update", async () => {
    const updateEqUser = vi.fn().mockResolvedValue({ error: null });
    const updateEqId = vi.fn(() => ({ eq: updateEqUser }));
    const update = vi.fn(() => ({ eq: updateEqId }));
    const supabase = {
      from: vi.fn(() => ({ update })),
    };
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ctx: { supabase, user: { id: "user-1" } },
      ok: true,
    });

    const result = await updateContact(
      {
        encrypted_first_name: getEncryptedValue(),
        id: "550e8400-e29b-41d4-a716-446655440000",
      },
      "csrf-token"
    );

    expect(result).toEqual({ success: true });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/contacts");
  });

  it("validates contact IDs before DB reads", async () => {
    const result = await getContact("invalid-id");

    expect(result).toEqual({
      error: "Invalid contact ID",
      success: false,
    });
    expect(mocks.authenticateAndRateLimit).not.toHaveBeenCalled();
    expect(mocks.logUnexpectedError).not.toHaveBeenCalled();
  });

  it("loads contacts via select/eq/order chain ending in overrideTypes", async () => {
    const rows = [
      {
        id: "550e8400-e29b-41d4-a716-446655440001",
        user_id: "user-1",
        encrypted_first_name: "enc",
        encrypted_last_name: "enc",
        encrypted_description: null,
        encrypted_email: null,
        encrypted_phone: null,
        encrypted_birthday: null,
        encrypted_notes: null,
        category_id: "personal",
        sort_order: 0,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      },
    ];
    const overrideTypes = vi
      .fn()
      .mockResolvedValue({ data: rows, error: null });
    const orderCreatedAt = vi.fn(() => ({ overrideTypes }));
    const orderSort = vi.fn(() => ({ order: orderCreatedAt }));
    const orderCategory = vi.fn(() => ({ order: orderSort }));
    const eqUser = vi.fn(() => ({ order: orderCategory }));
    const select = vi.fn(() => ({ eq: eqUser }));
    const supabase = {
      from: vi.fn(() => ({ select })),
    };
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ctx: { supabase, user: { id: "user-1" } },
      ok: true,
    });

    const result = await getContacts();

    expect(result).toEqual({ success: true, data: rows });
    expect(overrideTypes).toHaveBeenCalled();
    expect(mocks.logUnexpectedError).not.toHaveBeenCalled();
  });

  it("loads a single contact via select/eq/eq/single (no overrideTypes)", async () => {
    const row = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      user_id: "user-1",
      encrypted_first_name: "enc",
      encrypted_last_name: "enc",
      encrypted_description: null,
      encrypted_email: null,
      encrypted_phone: null,
      encrypted_birthday: null,
      encrypted_notes: null,
      category_id: "personal",
      sort_order: 0,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    };
    const single = vi.fn().mockResolvedValue({ data: row, error: null });
    const eqUser = vi.fn(() => ({ single }));
    const eqId = vi.fn(() => ({ eq: eqUser }));
    const select = vi.fn(() => ({ eq: eqId }));
    const supabase = {
      from: vi.fn(() => ({ select })),
    };
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ctx: { supabase, user: { id: "user-1" } },
      ok: true,
    });

    const result = await getContact("550e8400-e29b-41d4-a716-446655440000");

    expect(result).toEqual({ success: true, data: row });
    expect(single).toHaveBeenCalled();
    expect(mocks.logUnexpectedError).not.toHaveBeenCalled();
  });

  it("validates reorder payload size and rejects invalid UUIDs (Zod reorder schema)", async () => {
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

  it("rejects reorder payloads larger than ACTION_LIMITS.MAX_REORDER_ITEMS", async () => {
    const supabase = createSupabaseForCreateContact();
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ctx: { supabase, user: { id: "user-1" } },
      ok: true,
    });

    const oversized = Array.from(
      { length: ACTION_LIMITS.MAX_REORDER_ITEMS + 1 },
      () => ({
        id: crypto.randomUUID(),
        sort_order: 0,
      })
    );

    const result = await reorderContacts(oversized, "csrf-token");

    expect(result).toEqual({
      error: "Invalid reorder data",
      success: false,
    });
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("includes category_id in reorder updates when provided", async () => {
    const updateEqUser = vi.fn().mockResolvedValue({ error: null });
    const updateEqId = vi.fn(() => ({ eq: updateEqUser }));
    const update = vi.fn(() => ({ eq: updateEqId }));
    const inIds = vi.fn().mockResolvedValue({
      data: [{ id: "550e8400-e29b-41d4-a716-446655440001" }],
      error: null,
    });
    const selectEqUser = vi.fn(() => ({ in: inIds }));
    const select = vi.fn(() => ({ eq: selectEqUser }));
    let callCount = 0;
    const supabase = {
      from: vi.fn((table: string) => {
        if (table !== "contacts") {
          throw new Error(`Unexpected table ${table}`);
        }
        callCount++;
        if (callCount === 1) {
          return { select };
        }
        return { update };
      }),
    };
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ctx: { supabase, user: { id: "user-1" } },
      ok: true,
    });

    const result = await reorderContacts(
      [
        {
          category_id: "business",
          id: "550e8400-e29b-41d4-a716-446655440001",
          sort_order: 0,
        },
      ],
      "csrf-token"
    );

    expect(result).toEqual({ success: true });
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        category_id: "business",
        sort_order: 0,
      })
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/contacts");
  });

  it("rejects reorder when ownership pre-check finds missing IDs", async () => {
    const inIds = vi.fn().mockResolvedValue({
      data: [],
      error: null,
    });
    const selectEqUser = vi.fn(() => ({ in: inIds }));
    const select = vi.fn(() => ({ eq: selectEqUser }));
    const supabase = {
      from: vi.fn(() => ({ select })),
    };
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ctx: { supabase, user: { id: "user-1" } },
      ok: true,
    });

    const result = await reorderContacts(
      [
        {
          id: "550e8400-e29b-41d4-a716-446655440001",
          sort_order: 0,
        },
      ],
      "csrf-token"
    );

    expect(result).toEqual({
      success: false,
      error: "Invalid contact reorder scope",
    });
  });

  it("uses EXPORT readRateLimitConfig for getAllContactDataForExport", async () => {
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ok: false,
      response: { success: false, error: "rate limited" },
    });

    await getAllContactDataForExport();

    expect(mocks.authenticateAndRateLimit).toHaveBeenCalledWith(
      expect.objectContaining({
        rateLimitPrefix: "export",
        readRateLimitConfig: { maxRequests: 5, windowMs: 60_000 },
      })
    );
  });

  it("returns export data with row cap enforcement", async () => {
    const rows = [
      { id: "c-1", user_id: "user-1", encrypted_first_name: "enc" },
    ];
    const overrideTypes = vi
      .fn()
      .mockResolvedValue({ data: rows, error: null });
    const limit = vi.fn(() => ({ overrideTypes }));
    const order = vi.fn(() => ({ limit }));
    const eq = vi.fn(() => ({ order }));
    const select = vi.fn(() => ({ eq }));
    const supabase = {
      from: vi.fn(() => ({ select })),
    };
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ctx: { supabase, user: { id: "user-1" } },
      ok: true,
    });

    const result = await getAllContactDataForExport();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(rows);
    }
    expect(overrideTypes).toHaveBeenCalled();
  });

  it("rejects export when row cap is exceeded", async () => {
    const rows = Array.from(
      { length: ACTION_LIMITS.MAX_EXPORT_ROWS_PER_TABLE + 1 },
      (_, i) => ({
        id: `c-${i}`,
        user_id: "user-1",
      })
    );
    const overrideTypes = vi
      .fn()
      .mockResolvedValue({ data: rows, error: null });
    const limit = vi.fn(() => ({ overrideTypes }));
    const order = vi.fn(() => ({ limit }));
    const eq = vi.fn(() => ({ order }));
    const select = vi.fn(() => ({ eq }));
    const supabase = {
      from: vi.fn(() => ({ select })),
    };
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ctx: { supabase, user: { id: "user-1" } },
      ok: true,
    });

    const result = await getAllContactDataForExport();

    expect(result).toEqual({
      success: false,
      error:
        "Export too large for a single request. Please reduce dataset size and retry.",
    });
  });
});
