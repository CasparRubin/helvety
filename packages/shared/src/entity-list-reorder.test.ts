import { describe, expect, it } from "vitest";

import { computeReorderUpdates } from "./entity-list-reorder";

describe("entity-list-reorder", () => {
  it("returns sort-order updates when moving an entity over another", () => {
    const updates = computeReorderUpdates({
      entities: [
        { id: "a", sort_order: 0, category_id: "x" },
        { id: "b", sort_order: 1, category_id: "x" },
        { id: "c", sort_order: 2, category_id: "x" },
      ],
      activeId: "a",
      overId: "c",
      activeEntity: { id: "a", sort_order: 0, category_id: "x" },
      targetGroupId: "x",
      groupKey: "category_id",
      droppedOnGroupContainer: false,
    });

    expect(updates).toEqual([
      { id: "b", sort_order: 0 },
      { id: "c", sort_order: 1 },
      { id: "a", sort_order: 2 },
    ]);
  });

  it("adds a group update when dropped on another group container", () => {
    const updates = computeReorderUpdates({
      entities: [
        { id: "a", sort_order: 0, stage_id: "todo" },
        { id: "b", sort_order: 1, stage_id: "todo" },
      ],
      activeId: "a",
      overId: "stage-done",
      activeEntity: { id: "a", sort_order: 0, stage_id: "todo" },
      targetGroupId: "done",
      groupKey: "stage_id",
      droppedOnGroupContainer: true,
    });

    expect(updates).toEqual([
      { id: "b", sort_order: 0 },
      { id: "a", sort_order: 1, stage_id: "done" },
    ]);
  });
});
