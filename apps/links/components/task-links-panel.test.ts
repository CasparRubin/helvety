import { buildE2eeDeepLink } from "@helvety/shared/e2ee-deep-link";
import { describe, expect, it } from "vitest";

describe("buildE2eeDeepLink (tasks from links)", () => {
  it("builds a tasks deep link with item query parameter", () => {
    const href = buildE2eeDeepLink("tasks", "item-123");
    const url = new URL(href);

    expect(url.pathname).toBe("/tasks");
    expect(url.searchParams.get("item")).toBe("item-123");
  });
});
