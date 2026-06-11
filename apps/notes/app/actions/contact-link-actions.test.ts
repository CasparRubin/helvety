import { ACTION_LIMITS } from "@helvety/shared/constants";
import { ENCRYPTED_PREFETCH_COLUMNS } from "@helvety/shared/encrypted-prefetch-api";
import {
  createAuthSuccessContext,
  createOrderedContactListSupabaseMock,
} from "@helvety/shared/test-utils/action-test-helpers";
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
  getContacts,
  getItemContactLinks,
  linkContact,
  unlinkContact,
} from "./contact-link-actions";

describe("notes contact-link-actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validates item id before auth for getItemContactLinks", async () => {
    const result = await getItemContactLinks("invalid-id");
    expect(result).toEqual({ success: false, error: "Invalid note ID" });
    expect(mocks.authenticateAndRateLimit).not.toHaveBeenCalled();
  });

  it("loads contacts with explicit prefetch columns", async () => {
    const supabase = createOrderedContactListSupabaseMock();
    mocks.authenticateAndRateLimit.mockResolvedValue(
      createAuthSuccessContext(supabase)
    );

    const result = await getContacts();

    expect(result.success).toBe(true);
    expect(supabase.getLastSelectColumns()).toBe(
      ENCRYPTED_PREFETCH_COLUMNS.contacts
    );
    expect(supabase.getLastLimit()).toBe(ACTION_LIMITS.MAX_DASHBOARD_ROWS);
  });

  it("returns not found when the note does not exist for getItemContactLinks", async () => {
    mocks.authenticateAndRateLimit.mockResolvedValue(
      createAuthSuccessContext({ from: vi.fn() })
    );
    mocks.ensureOwnedEntityExists.mockResolvedValue(false);

    const result = await getItemContactLinks(
      "550e8400-e29b-41d4-a716-446655440000"
    );

    expect(result).toEqual({ success: false, error: "Note not found" });
    expect(mocks.getEntityLinksForEndpoint).not.toHaveBeenCalled();
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
    mocks.validateOwnedLinkEntities.mockResolvedValue({ success: true });
    mocks.createCanonicalLink.mockResolvedValue({
      success: true,
      id: "new-link",
    });
    mocks.deleteCanonicalLink.mockResolvedValue({ success: true });

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
    expect(mocks.createCanonicalLink).toHaveBeenCalled();
    expect(mocks.deleteCanonicalLink).toHaveBeenCalled();
  });

  it("forwards csrfToken to authenticateAndRateLimit on linkContact", async () => {
    mocks.authenticateAndRateLimit.mockResolvedValue(
      createAuthSuccessContext({ from: vi.fn() })
    );
    mocks.validateOwnedLinkEntities.mockResolvedValue({ success: true });
    mocks.createCanonicalLink.mockResolvedValue({
      success: true,
      id: "new-link",
    });

    await linkContact(
      "550e8400-e29b-41d4-a716-446655440000",
      "550e8400-e29b-41d4-a716-446655440001",
      "csrf-token"
    );

    expect(mocks.authenticateAndRateLimit).toHaveBeenCalledWith({
      csrfToken: "csrf-token",
      rateLimitPrefix: "contact-links",
    });
  });

  it("returns duplicate error when contact is already linked", async () => {
    mocks.authenticateAndRateLimit.mockResolvedValue(
      createAuthSuccessContext({ from: vi.fn() })
    );
    mocks.validateOwnedLinkEntities.mockResolvedValue({ success: true });
    mocks.createCanonicalLink.mockResolvedValue({
      success: false,
      error: "Contact is already linked",
    });

    const result = await linkContact(
      "550e8400-e29b-41d4-a716-446655440000",
      "550e8400-e29b-41d4-a716-446655440001",
      "csrf-token"
    );

    expect(result).toEqual({
      success: false,
      error: "Contact is already linked",
    });
    expect(mocks.loggerError).not.toHaveBeenCalled();
  });
});
