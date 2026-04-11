import { describe, expect, it } from "vitest";

import {
  ALLOWED_NOTE_CATEGORY_IDS,
  DEFAULT_NOTE_CATEGORIES,
  DEFAULT_NOTE_CATEGORY_ID,
} from "./default-note-categories";

describe("DEFAULT_NOTE_CATEGORIES", () => {
  it("defines exactly Personal, Work, and Other", () => {
    expect(DEFAULT_NOTE_CATEGORIES).toHaveLength(3);
    const ids = DEFAULT_NOTE_CATEGORIES.map((c) => c.id);
    expect(ids).toEqual(["personal", "work", "other"]);
  });

  it("defines a non-empty icon for every category", () => {
    for (const category of DEFAULT_NOTE_CATEGORIES) {
      expect(typeof category.icon).toBe("string");
      expect(category.icon.length).toBeGreaterThan(0);
    }
  });

  it("has unique ids and sort orders", () => {
    const ids = DEFAULT_NOTE_CATEGORIES.map((c) => c.id);
    const sortOrders = DEFAULT_NOTE_CATEGORIES.map((c) => c.sort_order);

    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(sortOrders).size).toBe(sortOrders.length);
  });

  it("defines valid default_rows_shown for each category", () => {
    for (const category of DEFAULT_NOTE_CATEGORIES) {
      expect(Number.isInteger(category.default_rows_shown)).toBe(true);
      expect(category.default_rows_shown).toBeGreaterThanOrEqual(0);
    }
  });

  it("keeps ALLOWED_NOTE_CATEGORY_IDS in sync with config", () => {
    expect(ALLOWED_NOTE_CATEGORY_IDS).toEqual(
      DEFAULT_NOTE_CATEGORIES.map((c) => c.id)
    );
  });

  it("uses personal as the default category id", () => {
    expect(DEFAULT_NOTE_CATEGORY_ID).toBe("personal");
  });
});
