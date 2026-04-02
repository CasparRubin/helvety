import { describe, expect, it } from "vitest";

import { ACTION_LIMITS } from "./constants";

describe("ACTION_LIMITS", () => {
  it("matches historical server-action caps", () => {
    expect(ACTION_LIMITS.MAX_REORDER_ITEMS).toBe(2000);
    expect(ACTION_LIMITS.REORDER_CHUNK_SIZE).toBe(50);
    expect(ACTION_LIMITS.MAX_EXPORT_ROWS_PER_TABLE).toBe(5000);
  });

  it("chunk loop covers max reorder size without gaps", () => {
    const n = ACTION_LIMITS.MAX_REORDER_ITEMS;
    const chunk = ACTION_LIMITS.REORDER_CHUNK_SIZE;
    let covered = 0;
    for (let i = 0; i < n; i += chunk) {
      covered += Math.min(chunk, n - i);
    }
    expect(covered).toBe(n);
  });
});
