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
  getItemNoteLinks,
  getNotes,
  linkNote,
  unlinkNote,
} from "./note-link-actions";

/** Builds a minimal Supabase mock for item-note link actions. */
function createSupabaseMock() {
  const noteListReturns = vi.fn().mockResolvedValue({
    data: [{ id: "note-1", encrypted_title: "enc-title" }],
    error: null,
  });
  const noteListOrderCreated = vi.fn(() => ({ returns: noteListReturns }));
  const noteListOrderSort = vi.fn(() => ({ order: noteListOrderCreated }));
  const noteListEqUser = vi.fn(() => ({ order: noteListOrderSort }));
  const noteListSelect = vi.fn(() => ({ eq: noteListEqUser }));

  const noteSingle = vi
    .fn()
    .mockResolvedValue({ data: { id: "note-1" }, error: null });
  const noteEqUser = vi.fn(() => ({ single: noteSingle }));
  const noteEqId = vi.fn(() => ({ eq: noteEqUser }));
  const noteSelectForLink = vi.fn(() => ({ eq: noteEqId }));

  const itemSingle = vi
    .fn()
    .mockResolvedValue({ data: { id: "item-1" }, error: null });
  const itemEqUser = vi.fn(() => ({ single: itemSingle }));
  const itemEqId = vi.fn(() => ({ eq: itemEqUser }));
  const itemSelect = vi.fn(() => ({ eq: itemEqId }));

  const linksReturns = vi.fn().mockResolvedValue({
    data: [{ id: "link-1", item_id: "item-1", note_id: "note-1" }],
    error: null,
  });
  const linksOrder = vi.fn(() => ({ returns: linksReturns }));
  const linksEqItem = vi.fn(() => ({ order: linksOrder }));
  const linksEqUser = vi.fn(() => ({ eq: linksEqItem }));
  const linksSelect = vi.fn(() => ({ eq: linksEqUser }));

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
      return { select: linksSelect, insert, delete: deleteFn };
    }
    if (table === "notes") {
      return {
        select: (selectArg: string) =>
          selectArg === "*" ? noteListSelect() : noteSelectForLink(),
      };
    }
    if (table === "items") {
      return { select: itemSelect };
    }
    throw new Error(`Unexpected table ${table}`);
  });

  return { from };
}

describe("tasks note-link-actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validates item id before auth for getItemNoteLinks", async () => {
    const result = await getItemNoteLinks("invalid-id");
    expect(result).toEqual({ success: false, error: "Invalid item ID" });
    expect(mocks.authenticateAndRateLimit).not.toHaveBeenCalled();
  });

  it("uses note_item_links for get/link/unlink flow", async () => {
    const supabase = createSupabaseMock();
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ok: true,
      ctx: { user: { id: "user-1" }, supabase },
    });

    const notes = await getNotes();
    const links = await getItemNoteLinks(
      "550e8400-e29b-41d4-a716-446655440000"
    );
    const linked = await linkNote(
      "550e8400-e29b-41d4-a716-446655440000",
      "550e8400-e29b-41d4-a716-446655440001",
      "csrf-token"
    );
    const unlinked = await unlinkNote(
      "550e8400-e29b-41d4-a716-446655440002",
      "csrf-token"
    );

    expect(notes.success).toBe(true);
    expect(links.success).toBe(true);
    expect(linked).toEqual({ success: true, data: { id: "new-link" } });
    expect(unlinked).toEqual({ success: true });
    expect(supabase.from).toHaveBeenCalledWith("note_item_links");
  });
});
