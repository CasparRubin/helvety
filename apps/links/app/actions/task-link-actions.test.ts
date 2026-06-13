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
  getLinkTaskLinks,
  linkTaskEntity,
  unlinkTaskEntity,
} from "./task-link-actions";

/** Builds a minimal Supabase mock for bookmark-task link actions. */
function createSupabaseMock() {
  const itemInReturns = vi.fn().mockResolvedValue({
    data: [{ id: "item-1", encrypted_title: "enc-title" }],
    error: null,
  });
  const itemInEqUser = vi.fn(() => ({ overrideTypes: itemInReturns }));
  const itemIn = vi.fn(() => ({ eq: itemInEqUser }));

  const from = vi.fn((table: string) => {
    if (table === "items") {
      return { select: () => ({ in: itemIn }) };
    }
    if (table === "links") {
      return {
        select: () => ({
          eq: vi.fn(() => ({
            single: vi
              .fn()
              .mockResolvedValue({ data: { id: "bookmark-1" }, error: null }),
          })),
        }),
      };
    }
    throw new Error(`Unexpected table ${table}`);
  });

  return { from };
}

describe("links task-link-actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validates bookmark id before auth for getLinkTaskLinks", async () => {
    const result = await getLinkTaskLinks("invalid-id");
    expect(result).toEqual({ success: false, error: "Invalid link ID" });
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

    const links = await getLinkTaskLinks(
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
    expect(mocks.toLinkedEntityReferences).toHaveBeenCalledWith(
      expect.anything(),
      "links",
      "550e8400-e29b-41d4-a716-446655440000",
      "items"
    );
    expect(mocks.createCanonicalLink).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceEntityType: "links",
        targetEntityType: "items",
      })
    );
  });
});
