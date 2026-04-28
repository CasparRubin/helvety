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
  getNoteTaskLinks,
  linkTaskEntity,
  unlinkTaskEntity,
} from "./task-link-actions";

/** Builds a minimal Supabase mock for note-task link actions. */
function createSupabaseMock() {
  const itemListReturns = vi.fn().mockResolvedValue({
    data: [{ id: "item-1", encrypted_title: "enc-title" }],
    error: null,
  });
  const itemEqUserForList = vi.fn(() => ({
    overrideTypes: itemListReturns,
  }));
  const itemIn = vi.fn(() => ({ eq: itemEqUserForList }));
  const itemSingle = vi
    .fn()
    .mockResolvedValue({ data: { id: "item-1" }, error: null });
  const itemEqUserForSingle = vi.fn(() => ({ single: itemSingle }));
  const itemEqId = vi.fn(() => ({ eq: itemEqUserForSingle }));
  const itemSelectForSingle = vi.fn(() => ({ eq: itemEqId }));

  const from = vi.fn((table: string) => {
    if (table === "items") {
      return {
        select: (selectArg: string) =>
          selectArg === "id, encrypted_title"
            ? { in: itemIn }
            : itemSelectForSingle(),
      };
    }
    if (table === "notes") {
      return {
        select: () => ({
          eq: vi.fn(() => ({
            single: vi
              .fn()
              .mockResolvedValue({ data: { id: "note-1" }, error: null }),
          })),
        }),
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

  it("returns linked tasks and supports link/unlink operations", async () => {
    const supabase = createSupabaseMock();
    mocks.authenticateAndRateLimit.mockResolvedValue(
      createAuthSuccessContext(supabase)
    );
    mocks.ensureOwnedEntityExists.mockResolvedValue(true);
    mocks.getEntityLinksForEndpoint.mockResolvedValue({
      data: [{ id: "link-1" }],
      error: null,
    });
    mocks.toLinkedEntityReferences.mockReturnValue([
      {
        entity_id: "item-1",
        link_id: "link-1",
        linked_at: "2026-01-01T00:00:00Z",
      },
    ]);
    mocks.validateOwnedLinkEntities.mockResolvedValue({ success: true });
    mocks.createCanonicalLink.mockResolvedValue({
      success: true,
      id: "new-link",
    });
    mocks.deleteCanonicalLink.mockResolvedValue({ success: true });

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
    expect(mocks.getEntityLinksForEndpoint).toHaveBeenCalled();
    expect(mocks.createCanonicalLink).toHaveBeenCalled();
    expect(mocks.deleteCanonicalLink).toHaveBeenCalled();
  });
});
