import { describe, expect, it } from "vitest";

import {
  filterE2eeDashboardItems,
  resolveE2eeEmptySearchMessage,
} from "./e2ee-dashboard-search";

/** Minimal item shape used to exercise dashboard search helpers. */
interface Item {
  title: string;
  body: string;
}

const items: Item[] = [
  { title: "Grocery list", body: "milk and eggs" },
  { title: "Work notes", body: "quarterly report" },
  { title: "Travel plan", body: "milk run to the airport" },
];

const fields = (item: Item) => [item.title, item.body];

describe("filterE2eeDashboardItems", () => {
  it("returns all items for an empty or whitespace query", () => {
    expect(filterE2eeDashboardItems(items, "", fields)).toEqual(items);
    expect(filterE2eeDashboardItems(items, "   ", fields)).toEqual(items);
  });

  it("matches across all searchable fields, case-insensitively", () => {
    const result = filterE2eeDashboardItems(items, "MILK", fields);
    expect(result).toHaveLength(2);
    expect(result.map((item) => item.title)).toEqual([
      "Grocery list",
      "Travel plan",
    ]);
  });

  it("requires every token to match (AND semantics)", () => {
    expect(filterE2eeDashboardItems(items, "milk airport", fields)).toEqual([
      items[2],
    ]);
  });

  it("returns an empty array when nothing matches", () => {
    expect(filterE2eeDashboardItems(items, "nonexistent", fields)).toEqual([]);
  });
});

describe("resolveE2eeEmptySearchMessage", () => {
  it("returns the empty message when an active search hides all items", () => {
    expect(
      resolveE2eeEmptySearchMessage({
        searchQuery: "zzz",
        totalCount: 3,
        filteredCount: 0,
        emptyMessage: "No matches",
      })
    ).toBe("No matches");
  });

  it("returns undefined when the search is inactive", () => {
    expect(
      resolveE2eeEmptySearchMessage({
        searchQuery: "  ",
        totalCount: 3,
        filteredCount: 0,
        emptyMessage: "No matches",
      })
    ).toBeUndefined();
  });

  it("returns undefined when there are matches", () => {
    expect(
      resolveE2eeEmptySearchMessage({
        searchQuery: "milk",
        totalCount: 3,
        filteredCount: 2,
        emptyMessage: "No matches",
      })
    ).toBeUndefined();
  });

  it("returns undefined when there are no items at all", () => {
    expect(
      resolveE2eeEmptySearchMessage({
        searchQuery: "milk",
        totalCount: 0,
        filteredCount: 0,
        emptyMessage: "No matches",
      })
    ).toBeUndefined();
  });
});
