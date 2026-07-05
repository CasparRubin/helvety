import { describe, expect, it } from "vitest";

import { pickDefinedStructuralFields } from "./e2ee-structural-payload";

/** Test fixture for task structural merge fields. */
type TaskStructuralInput = {
  stage_id: string;
  label_id: string | null;
  priority: number;
};

describe("pickDefinedStructuralFields", () => {
  it("merges only defined keys from partial input", () => {
    expect(
      pickDefinedStructuralFields(
        { stage_id: "default-item-backlog", label_id: null, priority: 2 },
        ["stage_id", "label_id", "priority"] as const
      )
    ).toEqual({
      stage_id: "default-item-backlog",
      label_id: null,
      priority: 2,
    });
  });

  it("omits keys that are undefined", () => {
    expect(
      pickDefinedStructuralFields<
        Partial<TaskStructuralInput>,
        keyof TaskStructuralInput
      >({ stage_id: "default-item-backlog", priority: 1 }, [
        "stage_id",
        "label_id",
        "priority",
      ])
    ).toEqual({
      stage_id: "default-item-backlog",
      priority: 1,
    });
  });

  it("returns an empty object when no keys are defined", () => {
    expect(
      pickDefinedStructuralFields<
        Partial<{ category_id: string }>,
        "category_id"
      >({}, ["category_id"])
    ).toEqual({});
  });
});
