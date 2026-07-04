import { describe, expect, it, vi } from "vitest";

import {
  createEntityLink,
  deleteEntityLink,
  ensureOwnedEntityExists,
  ENTITY_LINK_COLUMNS,
  getEntityLinksForEndpoint,
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

  it("toLinkedEntityReferences resolves bookmark endpoints in either direction", () => {
    const rows: EntityLinkRow[] = [
      {
        id: LINK_ID,
        user_id: USER_ID,
        source_entity_type: "links",
        source_entity_id: LINK_ID,
        target_entity_type: "items",
        target_entity_id: TASK_ID,
        relation_type: "related",
        metadata: {},
        created_at: "2026-01-01T00:00:00Z",
      },
    ];

    expect(toLinkedEntityReferences(rows, "links", LINK_ID, "items")).toEqual([
      {
        entity_id: TASK_ID,
        link_id: LINK_ID,
        linked_at: "2026-01-01T00:00:00Z",
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

  it("createEntityLink supports links as endpoints", async () => {
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
      sourceEntityType: "links",
      sourceEntityId: LINK_ID,
      targetEntityType: "items",
      targetEntityId: TASK_ID,
    });

    expect(insert).toHaveBeenCalledWith({
      user_id: USER_ID,
      source_entity_type: "items",
      source_entity_id: TASK_ID,
      target_entity_type: "links",
      target_entity_id: LINK_ID,
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

  it("deleteEntityLink rejects invalid payloads", async () => {
    const result = await deleteEntityLink(
      { from: vi.fn() } as never,
      "not-a-uuid",
      LINK_ID
    );

    expect(result).toEqual({
      error: { message: "Invalid link delete payload." },
    });
  });

  it("ensureOwnedEntityExists queries the links table for bookmark endpoints", async () => {
    const single = vi.fn().mockResolvedValue({
      data: { id: LINK_ID },
      error: null,
    });
    const eqUser = vi.fn(() => ({ single }));
    const eqId = vi.fn(() => ({ eq: eqUser }));
    const select = vi.fn(() => ({ eq: eqId }));
    const from = vi.fn(() => ({ select }));
    const supabase = { from };

    const exists = await ensureOwnedEntityExists(
      supabase as never,
      USER_ID,
      "links",
      LINK_ID
    );

    expect(exists).toBe(true);
    expect(from).toHaveBeenCalledWith("links");
    expect(select).toHaveBeenCalledWith("id");
    expect(eqId).toHaveBeenCalledWith("id", LINK_ID);
    expect(eqUser).toHaveBeenCalledWith("user_id", USER_ID);
  });

  it("getEntityLinksForEndpoint queries both directions for bookmark endpoints", async () => {
    const overrideTypes = vi.fn().mockResolvedValue({
      data: [{ id: LINK_ID }],
      error: null,
    });
    const order = vi.fn(() => ({ overrideTypes }));
    const or = vi.fn(() => ({ order }));
    const eqUser = vi.fn(() => ({ or }));
    const select = vi.fn(() => ({ eq: eqUser }));
    const from = vi.fn(() => ({ select }));
    const supabase = { from };

    const result = await getEntityLinksForEndpoint({
      supabase: supabase as never,
      userId: USER_ID,
      entityType: "links",
      entityId: LINK_ID,
    });

    expect(result).toEqual({ data: [{ id: LINK_ID }], error: null });
    expect(from).toHaveBeenCalledWith("entity_links");
    expect(select).toHaveBeenCalledWith(ENTITY_LINK_COLUMNS);
    expect(or).toHaveBeenCalledWith(
      `and(source_entity_type.eq.links,source_entity_id.eq.${LINK_ID}),and(target_entity_type.eq.links,target_entity_id.eq.${LINK_ID})`
    );
  });

  it("getEntityLinksForEndpoint rejects invalid entity types at runtime", async () => {
    const result = await getEntityLinksForEndpoint({
      supabase: { from: vi.fn() } as never,
      userId: USER_ID,
      entityType: "bogus" as never,
      entityId: LINK_ID,
    });

    expect(result).toEqual({
      data: null,
      error: { message: "Invalid entity type for link query." },
    });
  });
});
