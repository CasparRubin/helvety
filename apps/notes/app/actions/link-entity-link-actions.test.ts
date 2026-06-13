import { ACTION_LIMITS } from "@helvety/shared/constants";
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
  getLinkEntities,
  getNoteLinkEntityLinks,
  linkLinkEntity,
  unlinkLinkEntity,
} from "./link-entity-link-actions";

/** Builds a minimal Supabase mock for note-bookmark link actions. */
function createSupabaseMock() {
  let lastCatalogLimit: number | undefined;
  const linkListReturns = vi.fn().mockResolvedValue({
    data: [
      {
        id: "bookmark-1",
        encrypted_name: "enc-name",
        encrypted_url: "enc-url",
      },
    ],
    error: null,
  });
  const linkListOrder = vi.fn(() => ({
    limit: vi.fn((n: number) => {
      lastCatalogLimit = n;
      return { overrideTypes: linkListReturns };
    }),
  }));
  const linkListEqUser = vi.fn(() => ({ order: linkListOrder }));
  const linkListSelect = vi.fn(() => ({ eq: linkListEqUser }));

  const linkInReturns = vi.fn().mockResolvedValue({
    data: [
      {
        id: "bookmark-1",
        encrypted_name: "enc-name",
        encrypted_url: "enc-url",
      },
    ],
    error: null,
  });
  const linkInEqUser = vi.fn(() => ({ overrideTypes: linkInReturns }));
  const linkIn = vi.fn(() => ({ eq: linkInEqUser }));

  const from = vi.fn((table: string) => {
    if (table === "links") {
      return {
        select: (selectArg: string) =>
          selectArg === "id, encrypted_name, encrypted_url"
            ? { in: linkIn, eq: linkListEqUser, order: linkListOrder }
            : linkListSelect(),
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

  return { from, getLastCatalogLimit: () => lastCatalogLimit };
}

describe("notes link-entity-link-actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validates note id before auth for getNoteLinkEntityLinks", async () => {
    const result = await getNoteLinkEntityLinks("invalid-id");
    expect(result).toEqual({ success: false, error: "Invalid note ID" });
    expect(mocks.authenticateAndRateLimit).not.toHaveBeenCalled();
  });

  it("returns linked bookmarks and supports link/unlink operations", async () => {
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
        entity_id: "bookmark-1",
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

    const catalog = await getLinkEntities();
    const links = await getNoteLinkEntityLinks(
      "550e8400-e29b-41d4-a716-446655440000"
    );
    const linked = await linkLinkEntity(
      "550e8400-e29b-41d4-a716-446655440001",
      "550e8400-e29b-41d4-a716-446655440000",
      "csrf-token"
    );
    const unlinked = await unlinkLinkEntity(
      "550e8400-e29b-41d4-a716-446655440002",
      "csrf-token"
    );

    expect(catalog.success).toBe(true);
    expect(supabase.getLastCatalogLimit()).toBe(
      ACTION_LIMITS.MAX_DASHBOARD_ROWS
    );
    expect(links.success).toBe(true);
    expect(linked).toEqual({ success: true, data: { id: "new-link" } });
    expect(unlinked).toEqual({ success: true });
    expect(mocks.toLinkedEntityReferences).toHaveBeenCalledWith(
      expect.anything(),
      "notes",
      "550e8400-e29b-41d4-a716-446655440000",
      "links"
    );
    expect(mocks.createCanonicalLink).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceEntityType: "notes",
        targetEntityType: "links",
      })
    );
  });
});
