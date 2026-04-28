import { describe, expect, it, vi } from "vitest";

const entityLinkMocks = vi.hoisted(() => ({
  createEntityLink: vi.fn(),
  deleteEntityLink: vi.fn(),
  ensureOwnedEntityExists: vi.fn(),
}));

vi.mock("./entity-links", () => ({
  createEntityLink: entityLinkMocks.createEntityLink,
  deleteEntityLink: entityLinkMocks.deleteEntityLink,
  ensureOwnedEntityExists: entityLinkMocks.ensureOwnedEntityExists,
}));

import {
  createCanonicalLink,
  deleteCanonicalLink,
  validateOwnedLinkEntities,
} from "./entity-link-action-primitives";

describe("entity-link-action-primitives", () => {
  it("returns first matching not-found message for missing linked entity", async () => {
    entityLinkMocks.ensureOwnedEntityExists
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);

    const result = await validateOwnedLinkEntities({} as never, "user-1", [
      {
        entityType: "items",
        entityId: "550e8400-e29b-41d4-a716-446655440000",
        notFoundMessage: "Task not found",
      },
      {
        entityType: "notes",
        entityId: "550e8400-e29b-41d4-a716-446655440001",
        notFoundMessage: "Note not found",
      },
    ]);

    expect(result).toEqual({ success: false, error: "Note not found" });
  });

  it("maps duplicate create conflict to the provided message", async () => {
    entityLinkMocks.createEntityLink.mockResolvedValue({
      data: null,
      error: { code: "23505", message: "duplicate key" },
    });

    const result = await createCanonicalLink({
      supabase: {} as never,
      userId: "user-1",
      sourceEntityType: "items",
      sourceEntityId: "550e8400-e29b-41d4-a716-446655440000",
      targetEntityType: "notes",
      targetEntityId: "550e8400-e29b-41d4-a716-446655440001",
      duplicateMessage: "Already linked",
      failureMessage: "Failed to link",
    });

    expect(result).toEqual({ success: false, error: "Already linked" });
  });

  it("returns id on successful canonical link create", async () => {
    entityLinkMocks.createEntityLink.mockResolvedValue({
      data: { id: "link-1", created_at: "2026-01-01T00:00:00Z" },
      error: null,
    });

    const result = await createCanonicalLink({
      supabase: {} as never,
      userId: "user-1",
      sourceEntityType: "items",
      sourceEntityId: "550e8400-e29b-41d4-a716-446655440000",
      targetEntityType: "notes",
      targetEntityId: "550e8400-e29b-41d4-a716-446655440001",
      duplicateMessage: "Already linked",
      failureMessage: "Failed to link",
    });

    expect(result).toEqual({ success: true, id: "link-1" });
  });

  it("returns failure for delete errors and success otherwise", async () => {
    entityLinkMocks.deleteEntityLink
      .mockResolvedValueOnce({ error: { message: "db failed" } })
      .mockResolvedValueOnce({ error: null });

    const failed = await deleteCanonicalLink(
      {} as never,
      "user-1",
      "550e8400-e29b-41d4-a716-446655440000",
      "Failed unlink"
    );
    const ok = await deleteCanonicalLink(
      {} as never,
      "user-1",
      "550e8400-e29b-41d4-a716-446655440001",
      "Failed unlink"
    );

    expect(failed).toEqual({
      success: false,
      error: "Failed unlink",
      logError: { message: "db failed" },
    });
    expect(ok).toEqual({ success: true });
  });
});
