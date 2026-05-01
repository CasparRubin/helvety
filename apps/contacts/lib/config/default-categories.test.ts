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

  it("defines valid default_rows_shown for each category", () => {
    for (const category of DEFAULT_CATEGORIES) {
      expect(Number.isInteger(category.default_rows_shown)).toBe(true);
      expect(category.default_rows_shown).toBeGreaterThanOrEqual(0);
    }
  });

  it("uses expected icons for personal and work categories", () => {
    const personal = DEFAULT_CATEGORIES.find((c) => c.id === "personal");
    const work = DEFAULT_CATEGORIES.find((c) => c.id === "work");

    expect(personal?.icon).toBe("heart");
    expect(work?.icon).toBe("briefcase");
  });
});
