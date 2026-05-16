import { describe, expect, it } from "vitest";

import {
  createTaskDraftSnapshot,
  isTaskDraftUnchanged,
} from "./draft-defaults";

describe("tasks draft-defaults", () => {
  it("isTaskDraftUnchanged detects matching pristine draft", () => {
    const snapshot = createTaskDraftSnapshot("default-item-backlog");
    expect(
      isTaskDraftUnchanged(
        {
          title: "",
          description: null,
          stage_id: "default-item-backlog",
        },
        snapshot
      )
    ).toBe(true);
  });

  it("isTaskDraftUnchanged returns false after title changes", () => {
    const snapshot = createTaskDraftSnapshot("default-item-backlog");
    expect(
      isTaskDraftUnchanged(
        {
          title: "Ship feature",
          description: null,
          stage_id: "default-item-backlog",
        },
        snapshot
      )
    ).toBe(false);
  });
});
