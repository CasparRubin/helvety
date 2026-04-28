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
  getContactTaskLinks,
  getTaskEntities,
  linkTaskEntity,
  unlinkTaskEntity,
} from "./task-link-actions";

/** Builds a minimal Supabase mock for contact-task item link actions. */
function createSupabaseMock() {
  const contactSingle = vi
    .fn()
    .mockResolvedValue({ data: { id: "contact-1" }, error: null });
  const contactEqUser = vi.fn(() => ({ single: contactSingle }));
  const contactEqId = vi.fn(() => ({ eq: contactEqUser }));
  const contactSelect = vi.fn(() => ({ eq: contactEqId }));

  const itemsReturns = vi.fn().mockResolvedValue({
    data: [{ id: "item-1", encrypted_title: "enc-title" }],
    error: null,
  });
  const itemsOrder = vi.fn(() => ({ overrideTypes: itemsReturns }));
  const itemsEqUser = vi.fn(() => ({
    order: itemsOrder,
    overrideTypes: itemsReturns,
  }));
  const itemsIn = vi.fn(() => ({ eq: itemsEqUser }));
  const itemsSelect = vi.fn(() => ({
    in: itemsIn,
    eq: itemsEqUser,
    order: itemsOrder,
  }));

  const itemSingle = vi
    .fn()
    .mockResolvedValue({ data: { id: "item-1" }, error: null });
  const itemEqUser = vi.fn(() => ({ single: itemSingle }));
  const itemEqId = vi.fn(() => ({ eq: itemEqUser }));
  const itemSelectForLink = vi.fn(() => ({ eq: itemEqId }));

  const from = vi.fn((table: string) => {
    if (table === "contacts") return { select: contactSelect };
    if (table === "items") {
      return {
        select: (selectArg: string) =>
          selectArg === "id, encrypted_title"
            ? itemsSelect()
            : itemSelectForLink(),
      };
    }
    throw new Error(`Unexpected table ${table}`);
  });

  return { from };
}

describe("contacts task-link-actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validates contact id before auth for getContactTaskLinks", async () => {
    const result = await getContactTaskLinks("invalid-id");
    expect(result).toEqual({ success: false, error: "Invalid contact ID" });
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

    const links = await getContactTaskLinks(
      "550e8400-e29b-41d4-a716-446655440000"
    );
    const entities = await getTaskEntities();
    const linked = await linkTaskEntity(
      "550e8400-e29b-41d4-a716-446655440001",
      "550e8400-e29b-41d4-a716-446655440000",
      "csrf-token"
    );
    const unlinked = await unlinkTaskEntity(
      "550e8400-e29b-41d4-a716-446655440002",
      "csrf-token"
    );

    expect(links).toEqual({
      success: true,
      data: {
        items: [
          {
            id: "item-1",
            encrypted_title: "enc-title",
            link_id: "link-1",
            linked_at: "2026-01-01T00:00:00Z",
          },
        ],
      },
    });
    expect(entities).toEqual({
      success: true,
      data: { items: [{ id: "item-1", encrypted_title: "enc-title" }] },
    });
    expect(linked).toEqual({ success: true, data: { id: "new-link" } });
    expect(unlinked).toEqual({ success: true });
    expect(mocks.getEntityLinksForEndpoint).toHaveBeenCalled();
    expect(mocks.createCanonicalLink).toHaveBeenCalled();
    expect(mocks.deleteCanonicalLink).toHaveBeenCalled();
  });
});
