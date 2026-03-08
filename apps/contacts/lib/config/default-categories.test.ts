import { describe, expect, it } from "vitest";

import { DEFAULT_CATEGORIES } from "./default-categories";

describe("DEFAULT_CATEGORIES", () => {
  it("defines a non-empty icon for every category", () => {
    for (const category of DEFAULT_CATEGORIES) {
      expect(typeof category.icon).toBe("string");
      expect(category.icon.length).toBeGreaterThan(0);
    }
  });

  it("has unique ids and sort orders", () => {
    const ids = DEFAULT_CATEGORIES.map((c) => c.id);
    const sortOrders = DEFAULT_CATEGORIES.map((c) => c.sort_order);

    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(sortOrders).size).toBe(sortOrders.length);
  });
});
