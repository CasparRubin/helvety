import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authenticateAndRateLimit: vi.fn(),
  loggerError: vi.fn(),
}));

vi.mock("@helvety/shared/action-helpers", () => ({
  authenticateAndRateLimit: mocks.authenticateAndRateLimit,
}));

vi.mock("@helvety/shared/logger", () => ({
  logger: {
    error: mocks.loggerError,
  },
}));

import {
  getNoteTaskLinks,
  linkTaskEntity,
  unlinkTaskEntity,
} from "./task-link-actions";

/** Builds a minimal Supabase mock for note-task link actions. */
function createSupabaseMock() {
  const linkSelectReturns = vi.fn().mockResolvedValue({
    data: [{ id: "link-1", note_id: "note-1", item_id: "item-1" }],
    error: null,
  });
  const linkOrder = vi.fn(() => ({ returns: linkSelectReturns }));
  const linkEqNote = vi.fn(() => ({ order: linkOrder }));
  const linkEqUser = vi.fn(() => ({ eq: linkEqNote }));
  const linkSelect = vi.fn(() => ({ eq: linkEqUser }));

  const itemListReturns = vi.fn().mockResolvedValue({
    data: [{ id: "item-1", encrypted_title: "enc-title" }],
    error: null,
  });
  const itemEqUserForList = vi.fn(() => ({ returns: itemListReturns }));
  const itemIn = vi.fn(() => ({ eq: itemEqUserForList }));

  const noteSingle = vi
    .fn()
    .mockResolvedValue({ data: { id: "note-1" }, error: null });
  const noteEqUser = vi.fn(() => ({ single: noteSingle }));
  const noteEqId = vi.fn(() => ({ eq: noteEqUser }));
  const noteSelect = vi.fn(() => ({ eq: noteEqId }));

  const itemSingle = vi
    .fn()
    .mockResolvedValue({ data: { id: "item-1" }, error: null });
  const itemEqUserForSingle = vi.fn(() => ({ single: itemSingle }));
  const itemEqId = vi.fn(() => ({ eq: itemEqUserForSingle }));
  const itemSelectForSingle = vi.fn(() => ({ eq: itemEqId }));

  const insertSingle = vi
    .fn()
    .mockResolvedValue({ data: { id: "new-link" }, error: null });
  const insertSelect = vi.fn(() => ({ single: insertSingle }));
  const insert = vi.fn(() => ({ select: insertSelect }));

  const deleteEqUser = vi.fn().mockResolvedValue({ error: null });
  const deleteEqId = vi.fn(() => ({ eq: deleteEqUser }));
  const deleteFn = vi.fn(() => ({ eq: deleteEqId }));

  const from = vi.fn((table: string) => {
    if (table === "note_item_links") {
      return { select: linkSelect, insert, delete: deleteFn };
    }
    if (table === "notes") {
      return { select: noteSelect };
    }
    if (table === "items") {
      return {
        select: (selectArg: string) =>
          selectArg === "id, encrypted_title"
            ? { in: itemIn }
            : itemSelectForSingle(),
      };
    }
    throw new Error(`Unexpected table ${table}`);
  });

  return { from };
}

describe("notes task-link-actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validates note id before auth for getNoteTaskLinks", async () => {
    const result = await getNoteTaskLinks("invalid-id");
    expect(result).toEqual({ success: false, error: "Invalid note ID" });
    expect(mocks.authenticateAndRateLimit).not.toHaveBeenCalled();
  });

  it("uses note_item_links for get/link/unlink flow", async () => {
    const supabase = createSupabaseMock();
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ok: true,
      ctx: { user: { id: "user-1" }, supabase },
    });

    const links = await getNoteTaskLinks(
      "550e8400-e29b-41d4-a716-446655440000"
    );
    const linked = await linkTaskEntity(
      "550e8400-e29b-41d4-a716-446655440001",
      "550e8400-e29b-41d4-a716-446655440000",
      "csrf-token"
    );
    const unlinked = await unlinkTaskEntity(
      "550e8400-e29b-41d4-a716-446655440002",
      "csrf-token"
    );

    expect(links.success).toBe(true);
    expect(linked).toEqual({ success: true, data: { id: "new-link" } });
    expect(unlinked).toEqual({ success: true });
    expect(supabase.from).toHaveBeenCalledWith("note_item_links");
  });
});
