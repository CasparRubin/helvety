import { describe, expect, it, vi } from "vitest";

import {
  ACCOUNT_DELETION_VERIFICATION_CHECKS,
  verifyDeletionResidualCounts,
} from "./account-deletion-verification";

describe("ACCOUNT_DELETION_VERIFICATION_CHECKS", () => {
  it("matches the post-delete verification surface (update count if tables change)", () => {
    expect(ACCOUNT_DELETION_VERIFICATION_CHECKS).toHaveLength(7);
    const tables = new Set(
      ACCOUNT_DELETION_VERIFICATION_CHECKS.map((c) => c.table)
    );
    for (const required of [
      "contacts",
      "entity_links",
      "items",
      "notes",
      "user_auth_credentials",
      "user_passkey_params",
      "user_profiles",
    ] as const) {
      expect(tables.has(required)).toBe(true);
    }
  });
});

describe("verifyDeletionResidualCounts", () => {
  it("returns counts from each check query", async () => {
    const eq = vi.fn().mockResolvedValue({ count: 0, error: null });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });
    const scopedAdmin = { client: { from } };

    const rows = await verifyDeletionResidualCounts(
      scopedAdmin as never,
      "user-uuid"
    );

    expect(rows).toHaveLength(ACCOUNT_DELETION_VERIFICATION_CHECKS.length);
    expect(rows.every((r) => r.count === 0 && r.error === null)).toBe(true);
    expect(from).toHaveBeenCalled();
  });

  it("records error message when query fails", async () => {
    const eq = vi.fn().mockResolvedValue({
      count: null,
      error: { message: "boom" },
    });
    const from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({ eq }),
    });
    const scopedAdmin = { client: { from } };

    const rows = await verifyDeletionResidualCounts(
      scopedAdmin as never,
      "user-uuid"
    );

    expect(rows.every((r) => r.error === "boom")).toBe(true);
  });

  it("uses count -1 when the client throws", async () => {
    const eq = vi.fn().mockRejectedValue(new Error("network"));
    const from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({ eq }),
    });
    const scopedAdmin = { client: { from } };

    const rows = await verifyDeletionResidualCounts(
      scopedAdmin as never,
      "user-uuid"
    );

    expect(rows.every((r) => r.count === -1 && r.error === "network")).toBe(
      true
    );
  });
});
