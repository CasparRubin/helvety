import { ACTION_LIMITS } from "@helvety/shared/constants";
import { ENCRYPTED_PREFETCH_COLUMNS } from "@helvety/shared/encrypted-prefetch-api";
import { createAuthSuccessContext } from "@helvety/shared/test-utils/action-test-helpers";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authenticateAndRateLimit: vi.fn(),
  ensureOwnedEntityExists: vi.fn(),
  getEntityLinksForEndpoint: vi.fn(),
  toLinkedEntityReferences: vi.fn(),
  createCanonicalLink: vi.fn(),
  deleteCanonicalLink: vi.fn(),
  validateOwnedLinkEntities: vi.fn(),
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
  ensureOwnedEntityExists: mocks.ensureOwnedEntityExists,
  getEntityLinksForEndpoint: mocks.getEntityLinksForEndpoint,
  toLinkedEntityReferences: mocks.toLinkedEntityReferences,
}));

vi.mock("@helvety/shared/entity-link-action-primitives", () => ({
  createCanonicalLink: mocks.createCanonicalLink,
  deleteCanonicalLink: mocks.deleteCanonicalLink,
  validateOwnedLinkEntities: mocks.validateOwnedLinkEntities,
}));

import {
  getItemNoteLinks,
  getNotes,
  linkNote,
  unlinkNote,
} from "./note-link-actions";

/** Builds a minimal Supabase mock for item-note link actions. */
function createSupabaseMock() {
  let lastNoteListLimit: number | undefined;
  const noteListReturns = vi.fn().mockResolvedValue({
    data: [{ id: "note-1", encrypted_title: "enc-title" }],
    error: null,
  });
  const noteListOrderCreated = vi.fn(() => ({
    limit: vi.fn((n: number) => {
      lastNoteListLimit = n;
      return { overrideTypes: noteListReturns };
    }),
  }));
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

  const from = vi.fn((table: string) => {
    if (table === "notes") {
      return {
        select: (selectArg: string) =>
          selectArg === ENCRYPTED_PREFETCH_COLUMNS.notes
            ? noteListSelect()
            : noteSelectForLink(),
      };
    }
    if (table === "items") {
      return { select: itemSelect };
    }
    throw new Error(`Unexpected table ${table}`);
  });

  return {
    from,
    getLastNoteListLimit: () => lastNoteListLimit,
  };
}

describe("tasks note-link-actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validates item id before auth for getItemNoteLinks", async () => {
    const result = await getItemNoteLinks("invalid-id");
    expect(result).toEqual({ success: false, error: "Invalid task ID" });
    expect(mocks.authenticateAndRateLimit).not.toHaveBeenCalled();
  });

  it("returns not found when the task does not exist for getItemNoteLinks", async () => {
    mocks.authenticateAndRateLimit.mockResolvedValue(
      createAuthSuccessContext({ from: vi.fn() })
    );
    mocks.ensureOwnedEntityExists.mockResolvedValue(false);

    const result = await getItemNoteLinks(
      "550e8400-e29b-41d4-a716-446655440000"
    );

    expect(result).toEqual({ success: false, error: "Task not found" });
    expect(mocks.getEntityLinksForEndpoint).not.toHaveBeenCalled();
  });

  it("returns note links and supports link/unlink operations", async () => {
    const supabase = createSupabaseMock();
    mocks.authenticateAndRateLimit.mockResolvedValue(
      createAuthSuccessContext(supabase)
    );
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
    mocks.ensureOwnedEntityExists.mockResolvedValue(true);
    mocks.validateOwnedLinkEntities.mockResolvedValue({ success: true });
    mocks.createCanonicalLink.mockResolvedValue({
      success: true,
      id: "new-link",
    });
    mocks.deleteCanonicalLink.mockResolvedValue({ success: true });

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
    expect(supabase.getLastNoteListLimit()).toBe(
      ACTION_LIMITS.MAX_DASHBOARD_ROWS
    );
    expect(links.success).toBe(true);
    expect(linked).toEqual({ success: true, data: { id: "new-link" } });
    expect(unlinked).toEqual({ success: true });
    expect(mocks.getEntityLinksForEndpoint).toHaveBeenCalled();
    expect(mocks.createCanonicalLink).toHaveBeenCalled();
    expect(mocks.deleteCanonicalLink).toHaveBeenCalled();
  });
});
