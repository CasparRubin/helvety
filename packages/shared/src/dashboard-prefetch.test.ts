import { describe, expect, it } from "vitest";

import {
  CONTACTS_PREFETCH_TOO_MANY_ROWS_ERROR,
  DASHBOARD_PREFETCH_TOO_MANY_ITEMS_ERROR,
  isDashboardPrefetchOverCap,
} from "./dashboard-prefetch";

describe("isDashboardPrefetchOverCap", () => {
  it("is false at or below the cap", () => {
    expect(isDashboardPrefetchOverCap(0, 100)).toBe(false);
    expect(isDashboardPrefetchOverCap(100, 100)).toBe(false);
  });

  it("is true when one extra row was returned", () => {
    expect(isDashboardPrefetchOverCap(101, 100)).toBe(true);
  });
});

describe("DASHBOARD_PREFETCH_TOO_MANY_ITEMS_ERROR", () => {
  it("is a stable user-facing string", () => {
    expect(DASHBOARD_PREFETCH_TOO_MANY_ITEMS_ERROR).toBe(
      "Too many items to load in one request"
    );
  });
});

describe("CONTACTS_PREFETCH_TOO_MANY_ROWS_ERROR", () => {
  it("is a stable user-facing string", () => {
    expect(CONTACTS_PREFETCH_TOO_MANY_ROWS_ERROR).toBe(
      "Too many contacts to load in one request"
    );
  });
});
