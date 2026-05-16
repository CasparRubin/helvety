import { describe, expect, it } from "vitest";

import { DEFAULT_NOTE_CATEGORY_ID } from "@/lib/config/default-note-categories";

import {
  createNoteDraftSnapshot,
  isNoteDraftUnchanged,
} from "./draft-defaults";

describe("notes draft-defaults", () => {
  it("isNoteDraftUnchanged detects matching pristine draft", () => {
    const snapshot = createNoteDraftSnapshot(DEFAULT_NOTE_CATEGORY_ID);
    expect(
      isNoteDraftUnchanged(
        {
          title: "",
          description: null,
          category_id: DEFAULT_NOTE_CATEGORY_ID,
        },
        snapshot
      )
    ).toBe(true);
  });

  it("isNoteDraftUnchanged returns false after title changes", () => {
    const snapshot = createNoteDraftSnapshot(DEFAULT_NOTE_CATEGORY_ID);
    expect(
      isNoteDraftUnchanged(
        {
          title: "My note",
          description: null,
          category_id: DEFAULT_NOTE_CATEGORY_ID,
        },
        snapshot
      )
    ).toBe(false);
  });
});
