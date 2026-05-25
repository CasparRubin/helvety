import { CONTACT_LINK_PICKER_COLUMNS } from "@helvety/shared/encrypted-prefetch-api";
import {
  createAuthSuccessContext,
  createOrderedContactListSupabaseMock,
} from "@helvety/shared/test-utils/action-test-helpers";
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
  getContacts,
  getItemContactLinks,
  linkContact,
  unlinkContact,
} from "./contact-link-actions";

describe("tasks contact-link-actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validates item id before auth for getItemContactLinks", async () => {
    const result = await getItemContactLinks("invalid-id");
    expect(result).toEqual({ success: false, error: "Invalid task ID" });
    expect(mocks.authenticateAndRateLimit).not.toHaveBeenCalled();
  });

  it("loads contacts with explicit prefetch columns", async () => {
    const supabase = createOrderedContactListSupabaseMock();
    mocks.authenticateAndRateLimit.mockResolvedValue(
      createAuthSuccessContext(supabase)
    );

    const result = await getContacts();

    expect(result.success).toBe(true);
    expect(supabase.getLastSelectColumns()).toBe(CONTACT_LINK_PICKER_COLUMNS);
  });

  it("uses entity link helpers for get/link/unlink flow", async () => {
    const supabase = createOrderedContactListSupabaseMock();
    mocks.authenticateAndRateLimit.mockResolvedValue(
      createAuthSuccessContext(supabase)
    );
    mocks.getEntityLinksForEndpoint.mockResolvedValue({
      data: [{ id: "link-1" }],
      error: null,
    });
    mocks.toLinkedEntityReferences.mockReturnValue([
      {
        entity_id: "550e8400-e29b-41d4-a716-446655440001",
        link_id: "link-1",
        linked_at: "2026-01-01T00:00:00Z",
      },
    ]);
    mocks.ensureOwnedEntityExists.mockResolvedValue(true);
    mocks.createEntityLink.mockResolvedValue({
      data: { id: "new-link", created_at: "2026-01-01T00:00:00Z" },
      error: null,
    });
    mocks.deleteEntityLink.mockResolvedValue({ error: null });

    const links = await getItemContactLinks(
      "550e8400-e29b-41d4-a716-446655440000"
    );
    const linked = await linkContact(
      "550e8400-e29b-41d4-a716-446655440000",
      "550e8400-e29b-41d4-a716-446655440001",
      "csrf-token"
    );
    const unlinked = await unlinkContact(
      "550e8400-e29b-41d4-a716-446655440002",
      "csrf-token"
    );

    expect(links.success).toBe(true);
    expect(linked).toEqual({ success: true, data: { id: "new-link" } });
    expect(unlinked).toEqual({ success: true });
    expect(mocks.getEntityLinksForEndpoint).toHaveBeenCalled();
    expect(mocks.createEntityLink).toHaveBeenCalled();
    expect(mocks.deleteEntityLink).toHaveBeenCalled();
  });
});
