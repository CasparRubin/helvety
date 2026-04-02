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
  getItemContactLinks,
  linkContact,
  unlinkContact,
} from "./contact-link-actions";

/** Builds a minimal Supabase mock for notes/contact link actions. */
function createSupabaseMock() {
  const contactListReturns = vi.fn().mockResolvedValue({
    data: [
      {
        id: "contact-1",
        encrypted_first_name: "enc",
        encrypted_last_name: "enc",
      },
    ],
    error: null,
  });
  const contactOrderCreated = vi.fn(() => ({ returns: contactListReturns }));
  const contactOrderSort = vi.fn(() => ({ order: contactOrderCreated }));
  const contactEqUser = vi.fn(() => ({ order: contactOrderSort }));
  const contactSelect = vi.fn(() => ({ eq: contactEqUser }));

  const from = vi.fn((table: string) => {
    if (table === "contacts") {
      return { select: contactSelect };
    }
    throw new Error(`Unexpected table ${table}`);
  });

  return { from };
}

describe("notes contact-link-actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validates item id before auth for getItemContactLinks", async () => {
    const result = await getItemContactLinks("invalid-id");
    expect(result).toEqual({ success: false, error: "Invalid note ID" });
    expect(mocks.authenticateAndRateLimit).not.toHaveBeenCalled();
  });

  it("uses entity link helpers for get/link/unlink flow", async () => {
    const supabase = createSupabaseMock();
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ok: true,
      ctx: { user: { id: "user-1" }, supabase },
    });
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
