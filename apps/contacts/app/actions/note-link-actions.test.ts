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
  getContactNoteLinks,
  getNoteEntities,
  linkNoteEntity,
  unlinkNoteEntity,
} from "./note-link-actions";

/** Builds a minimal Supabase mock for contact-note link actions. */
function createSupabaseMock() {
  const contactSingle = vi
    .fn()
    .mockResolvedValue({ data: { id: "contact-1" }, error: null });
  const contactEqUser = vi.fn(() => ({ single: contactSingle }));
  const contactEqId = vi.fn(() => ({ eq: contactEqUser }));
  const contactSelect = vi.fn(() => ({ eq: contactEqId }));

  const linksReturns = vi.fn().mockResolvedValue({
    data: [
      { id: "link-1", note_id: "note-1", created_at: "2026-01-01T00:00:00Z" },
    ],
    error: null,
  });
  const linksOrder = vi.fn(() => ({ returns: linksReturns }));
  const linksEqUser = vi.fn(() => ({ order: linksOrder }));
  const linksEqContact = vi.fn(() => ({ eq: linksEqUser }));
  const linksSelect = vi.fn(() => ({ eq: linksEqContact }));

  const notesReturns = vi.fn().mockResolvedValue({
    data: [{ id: "note-1", encrypted_title: "enc-title" }],
    error: null,
  });
  const notesOrder = vi.fn(() => ({ returns: notesReturns }));
  const notesEqUser = vi.fn(() => ({
    order: notesOrder,
    returns: notesReturns,
  }));
  const notesIn = vi.fn(() => ({ eq: notesEqUser }));
  const notesSelect = vi.fn(() => ({
    in: notesIn,
    eq: notesEqUser,
    order: notesOrder,
  }));

  const noteSingle = vi
    .fn()
    .mockResolvedValue({ data: { id: "note-1" }, error: null });
  const noteEqUser = vi.fn(() => ({ single: noteSingle }));
  const noteEqId = vi.fn(() => ({ eq: noteEqUser }));
  const noteSelectForLink = vi.fn(() => ({ eq: noteEqId }));

  const insertSingle = vi
    .fn()
    .mockResolvedValue({ data: { id: "new-link" }, error: null });
  const insertSelect = vi.fn(() => ({ single: insertSingle }));
  const insert = vi.fn(() => ({ select: insertSelect }));

  const deleteEqUser = vi.fn().mockResolvedValue({ error: null });
  const deleteEqId = vi.fn(() => ({ eq: deleteEqUser }));
  const deleteFn = vi.fn(() => ({ eq: deleteEqId }));

  const from = vi.fn((table: string) => {
    if (table === "contacts") return { select: contactSelect };
    if (table === "note_contact_links") {
      return { select: linksSelect, insert, delete: deleteFn };
    }
    if (table === "notes") {
      return {
        select: (selectArg: string) =>
          selectArg === "id, encrypted_title"
            ? notesSelect()
            : noteSelectForLink(),
      };
    }
    throw new Error(`Unexpected table ${table}`);
  });

  return { from };
}

describe("contacts note-link-actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validates contact id before auth for getContactNoteLinks", async () => {
    const result = await getContactNoteLinks("invalid-id");
    expect(result).toEqual({ success: false, error: "Invalid contact ID" });
    expect(mocks.authenticateAndRateLimit).not.toHaveBeenCalled();
  });

  it("uses note_contact_links and returns note-only link data", async () => {
    const supabase = createSupabaseMock();
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ok: true,
      ctx: { user: { id: "user-1" }, supabase },
    });

    const links = await getContactNoteLinks(
      "550e8400-e29b-41d4-a716-446655440000"
    );
    const entities = await getNoteEntities();
    const linked = await linkNoteEntity(
      "550e8400-e29b-41d4-a716-446655440001",
      "550e8400-e29b-41d4-a716-446655440000",
      "csrf-token"
    );
    const unlinked = await unlinkNoteEntity(
      "550e8400-e29b-41d4-a716-446655440002",
      "csrf-token"
    );

    expect(links).toEqual({
      success: true,
      data: {
        notes: [
          {
            id: "note-1",
            encrypted_title: "enc-title",
            link_id: "link-1",
            linked_at: "2026-01-01T00:00:00Z",
          },
        ],
      },
    });
    expect(entities).toEqual({
      success: true,
      data: { notes: [{ id: "note-1", encrypted_title: "enc-title" }] },
    });
    expect(linked).toEqual({ success: true, data: { id: "new-link" } });
    expect(unlinked).toEqual({ success: true });
    expect(supabase.from).toHaveBeenCalledWith("note_contact_links");
  });
});
