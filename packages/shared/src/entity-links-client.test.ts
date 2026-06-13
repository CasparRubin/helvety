import { describe, expect, it, vi } from "vitest";

import {
  createEntityLink,
  deleteEntityLink,
  ENTITY_LINK_COLUMNS,
  toLinkedEntityReferences,
  type EntityLinkRow,
} from "./entity-links-client";

const USER_ID = "00000000-0000-4000-8000-000000000099";
const TASK_ID = "00000000-0000-4000-8000-000000000001";
const CONTACT_ID = "00000000-0000-4000-8000-000000000002";
const NOTE_ID = "00000000-0000-4000-8000-000000000003";
const LINK_ID = "00000000-0000-4000-8000-000000000010";

describe("entity-links-client", () => {
  it("ENTITY_LINK_COLUMNS stays explicit (no wildcards)", () => {
    expect(ENTITY_LINK_COLUMNS).toContain("source_entity_type");
    expect(ENTITY_LINK_COLUMNS).not.toContain("*");
  });

  it("toLinkedEntityReferences resolves targets from either link direction", () => {
    const rows: EntityLinkRow[] = [
      {
        id: LINK_ID,
        user_id: USER_ID,
        source_entity_type: "items",
        source_entity_id: TASK_ID,
        target_entity_type: "contacts",
        target_entity_id: CONTACT_ID,
        relation_type: "related",
        metadata: {},
        created_at: "2026-01-01T00:00:00Z",
      },
      {
        id: "00000000-0000-4000-8000-000000000011",
        user_id: USER_ID,
        source_entity_type: "notes",
        source_entity_id: NOTE_ID,
        target_entity_type: "items",
        target_entity_id: TASK_ID,
        relation_type: "related",
        metadata: {},
        created_at: "2026-01-02T00:00:00Z",
      },
    ];

    expect(
      toLinkedEntityReferences(rows, "items", TASK_ID, "contacts")
    ).toEqual([
      {
        entity_id: CONTACT_ID,
        link_id: LINK_ID,
        linked_at: "2026-01-01T00:00:00Z",
      },
    ]);

    expect(toLinkedEntityReferences(rows, "items", TASK_ID, "notes")).toEqual([
      {
        entity_id: NOTE_ID,
        link_id: "00000000-0000-4000-8000-000000000011",
        linked_at: "2026-01-02T00:00:00Z",
      },
    ]);
  });

  it("createEntityLink stores canonical source/target ordering", async () => {
    const insert = vi.fn().mockReturnValue({
      select: () => ({
        single: async () => ({
          data: { id: LINK_ID, created_at: "2026-01-01" },
          error: null,
        }),
      }),
    });
    const supabase = {
      from: vi.fn(() => ({ insert })),
    };

    await createEntityLink({
      supabase: supabase as never,
      userId: USER_ID,
      sourceEntityType: "items",
      sourceEntityId: TASK_ID,
      targetEntityType: "contacts",
      targetEntityId: CONTACT_ID,
    });

    expect(insert).toHaveBeenCalledWith({
      user_id: USER_ID,
      source_entity_type: "contacts",
      source_entity_id: CONTACT_ID,
      target_entity_type: "items",
      target_entity_id: TASK_ID,
      relation_type: "related",
    });
  });

  it("createEntityLink rejects invalid UUID payloads", async () => {
    const result = await createEntityLink({
      supabase: { from: vi.fn() } as never,
      userId: "not-a-uuid",
      sourceEntityType: "items",
      sourceEntityId: TASK_ID,
      targetEntityType: "contacts",
      targetEntityId: CONTACT_ID,
    });

    expect(result).toEqual({
      data: null,
      error: { message: "Invalid link input payload." },
    });
  });

  it("deleteEntityLink scopes delete by user id", async () => {
    const eq = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    const deleteFn = vi.fn().mockReturnValue({ eq });
    const supabase = { from: vi.fn(() => ({ delete: deleteFn })) };

    const result = await deleteEntityLink(supabase as never, USER_ID, LINK_ID);

    expect(result).toEqual({ error: null });
    expect(deleteFn).toHaveBeenCalled();
    expect(eq).toHaveBeenCalledWith("id", LINK_ID);
    expect(eq().eq).toHaveBeenCalledWith("user_id", USER_ID);
  });
});
