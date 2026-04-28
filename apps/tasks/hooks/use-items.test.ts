import { describe, expect, it } from "vitest";

import { getTasksApiPath } from "./use-items";

describe("getTasksApiPath", () => {
  it("prefixes task API routes with the tasks base path", () => {
    expect(getTasksApiPath("/api/items")).toBe("/tasks/api/items");
    expect(getTasksApiPath("/api/items/abc-123")).toBe(
      "/tasks/api/items/abc-123"
    );
  });
});
