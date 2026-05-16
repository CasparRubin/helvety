import { describe, expect, it } from "vitest";

import {
  E2EE_LIST_UNTITLED_LABEL,
  getE2eeListTitle,
  isDraftSnapshotUnchanged,
} from "./e2ee-draft";

describe("e2ee-draft", () => {
  it("getE2eeListTitle returns fallback for blank titles", () => {
    expect(getE2eeListTitle("")).toBe(E2EE_LIST_UNTITLED_LABEL);
    expect(getE2eeListTitle("  ")).toBe(E2EE_LIST_UNTITLED_LABEL);
    expect(getE2eeListTitle("Hello")).toBe("Hello");
  });

  it("isDraftSnapshotUnchanged compares snapshot keys", () => {
    const snapshot = { title: "", category_id: "personal" };
    expect(
      isDraftSnapshotUnchanged({ title: "", category_id: "personal" }, snapshot)
    ).toBe(true);
    expect(
      isDraftSnapshotUnchanged(
        { title: "x", category_id: "personal" },
        snapshot
      )
    ).toBe(false);
  });
});
