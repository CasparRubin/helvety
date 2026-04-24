import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authenticateAndRateLimit: vi.fn(),
  createEntityLink: vi.fn(),
  deleteEntityLink: vi.fn(),
  ensureOwnedEntityExists: vi.fn(),
  getEntityLinksForEndpoint: vi.fn(),
  toLinkedEntityReferences: vi.fn(),
  loggerError: vi.fn(),
}));

vi.mock("@helvety/shared/action-helpers", () => ({
  authenticateAndRateLimit: mocks.authenticateAndRateLimit,
}));

vi.mock("@helvety/shared/logger", () => ({
  logger: {
    error: mocks.loggerError,
    logUnexpectedError: mocks.loggerError,
  },
}));

vi.mock("@helvety/shared/entity-links", () => ({
  createEntityLink: mocks.createEntityLink,
  deleteEntityLink: mocks.deleteEntityLink,
  ensureOwnedEntityExists: mocks.ensureOwnedEntityExists,
  getEntityLinksForEndpoint: mocks.getEntityLinksForEndpoint,
  toLinkedEntityReferences: mocks.toLinkedEntityReferences,
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

  const notesReturns = vi.fn().mockResolvedValue({
    data: [{ id: "note-1", encrypted_title: "enc-title" }],
    error: null,
  });
  const notesOrder = vi.fn(() => ({ overrideTypes: notesReturns }));
  const notesEqUser = vi.fn(() => ({
    order: notesOrder,
    overrideTypes: notesReturns,
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

  const from = vi.fn((table: string) => {
    if (table === "contacts") return { select: contactSelect };
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

  it("uses entity link helpers and returns note-only link data", async () => {
    const supabase = createSupabaseMock();
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ok: true,
      ctx: { user: { id: "user-1" }, supabase },
    });
    mocks.ensureOwnedEntityExists.mockResolvedValue(true);
    mocks.getEntityLinksForEndpoint.mockResolvedValue({
      data: [{ id: "link-1" }],
      error: null,
    });
    mocks.toLinkedEntityReferences.mockReturnValue([
      {
        entity_id: "note-1",
        link_id: "link-1",
        linked_at: "2026-01-01T00:00:00Z",
      },
    ]);
    mocks.createEntityLink.mockResolvedValue({
      data: { id: "new-link", created_at: "2026-01-01T00:00:00Z" },
      error: null,
    });
    mocks.deleteEntityLink.mockResolvedValue({ error: null });

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
    expect(mocks.getEntityLinksForEndpoint).toHaveBeenCalled();
    expect(mocks.createEntityLink).toHaveBeenCalled();
    expect(mocks.deleteEntityLink).toHaveBeenCalled();
  });
});
