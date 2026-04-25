import { describe, expect, it } from "vitest";

import { patchEntityInList, patchSingleEntity } from "./optimistic-entity";

describe("optimistic-entity", () => {
  it("patches only the targeted entity in list", () => {
    const rows = [
      { id: "a", updated_at: "2026-01-01T00:00:00.000Z", category_id: "work" },
      { id: "b", updated_at: "2026-01-01T00:00:00.000Z", category_id: "home" },
    ];

    const next = patchEntityInList(rows, "a", { category_id: "home" });

    expect(next[0]).toMatchObject({ id: "a", category_id: "home" });
    expect(next[1]).toEqual(rows[1]);
    expect(next[0]?.updated_at).not.toBe(rows[0]?.updated_at);
  });

  it("returns original list when entity id is missing", () => {
    const rows = [{ id: "a", updated_at: "2026-01-01T00:00:00.000Z" }];
    const next = patchEntityInList(rows, "missing", {});

    expect(next).toBe(rows);
  });

  it("patches single entity and refreshes updated_at", () => {
    const row = {
      id: "a",
      updated_at: "2026-01-01T00:00:00.000Z",
      stage_id: "todo",
    };

    const next = patchSingleEntity(row, { stage_id: "done" });

    expect(next).toMatchObject({ id: "a", stage_id: "done" });
    expect(next?.updated_at).not.toBe(row.updated_at);
  });

  it("keeps null entity unchanged", () => {
    expect(patchSingleEntity(null, { stage_id: "done" })).toBeNull();
  });
});
