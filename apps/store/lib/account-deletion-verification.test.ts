import { describe, expect, it, vi } from "vitest";

import {
  TABLE_OWNER_COLUMNS,
  TABLES_REQUIRING_USER_RLS,
} from "../../../scripts/supabase-user-tables.mjs";

import {
  ACCOUNT_DELETION_VERIFICATION_CHECKS,
  verifyDeletionResidualCounts,
} from "./account-deletion-verification";

/** Scoped admin shape expected by verifyDeletionResidualCounts. */
type ScopedAdmin = Parameters<typeof verifyDeletionResidualCounts>[0];

/** Builds the minimal scoped admin client for residual-count tests. */
const buildScopedAdmin = (from: ReturnType<typeof vi.fn>): ScopedAdmin =>
  ({ client: { from } }) as unknown as ScopedAdmin;

describe("ACCOUNT_DELETION_VERIFICATION_CHECKS", () => {
  it("covers every RLS user-data table including auth credentials", () => {
    const deletionTables = new Set<string>(
      ACCOUNT_DELETION_VERIFICATION_CHECKS.map((c) => c.table)
    );

    for (const table of TABLES_REQUIRING_USER_RLS) {
      expect(deletionTables.has(table)).toBe(true);
    }
    expect(ACCOUNT_DELETION_VERIFICATION_CHECKS).toHaveLength(
      TABLES_REQUIRING_USER_RLS.length
    );
  });

  it("uses the shared owner column mapping for each table", () => {
    for (const check of ACCOUNT_DELETION_VERIFICATION_CHECKS) {
      const ownerColumn =
        TABLE_OWNER_COLUMNS[check.table as keyof typeof TABLE_OWNER_COLUMNS] ??
        "user_id";
      expect(check.column).toBe(ownerColumn);
    }
  });
});

describe("verifyDeletionResidualCounts", () => {
  it("returns counts from each check query", async () => {
    const eq = vi.fn().mockResolvedValue({ count: 0, error: null });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });
    const scopedAdmin = buildScopedAdmin(from);

    const rows = await verifyDeletionResidualCounts(scopedAdmin, "user-uuid");

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
    const scopedAdmin = buildScopedAdmin(from);

    const rows = await verifyDeletionResidualCounts(scopedAdmin, "user-uuid");

    expect(rows.every((r) => r.error === "boom")).toBe(true);
  });

  it("uses count -1 when the client throws", async () => {
    const eq = vi.fn().mockRejectedValue(new Error("network"));
    const from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({ eq }),
    });
    const scopedAdmin = buildScopedAdmin(from);

    const rows = await verifyDeletionResidualCounts(scopedAdmin, "user-uuid");

    expect(rows.every((r) => r.count === -1 && r.error === "network")).toBe(
      true
    );
  });
});
