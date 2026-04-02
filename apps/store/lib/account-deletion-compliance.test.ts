import { describe, expect, it } from "vitest";

import {
  hasAccountDeletionVerificationFailures,
  type AccountDeletionVerificationReport,
} from "./account-deletion-compliance";

/** Builds a baseline verification report with overridable fields. */
function buildReport(
  overrides: Partial<AccountDeletionVerificationReport> = {}
): AccountDeletionVerificationReport {
  return {
    userId: "7d72c0a4-f2ff-4d02-8f5a-0458d0fdd5f9",
    authStillExists: false,
    residualRows: [],
    residualErrors: [],
    ...overrides,
  };
}

describe("account deletion verification", () => {
  it("passes when no residuals exist", () => {
    expect(hasAccountDeletionVerificationFailures(buildReport())).toBe(false);
  });

  it("fails when auth user still exists", () => {
    expect(
      hasAccountDeletionVerificationFailures(
        buildReport({ authStillExists: true })
      )
    ).toBe(true);
  });

  it("fails when any residual rows remain", () => {
    expect(
      hasAccountDeletionVerificationFailures(
        buildReport({
          residualRows: [{ table: "items", column: "user_id", count: 1 }],
        })
      )
    ).toBe(true);
  });

  it("fails when any residual query errors are reported", () => {
    expect(
      hasAccountDeletionVerificationFailures(
        buildReport({
          residualErrors: [
            {
              column: "user_id",
              error: "permission denied",
              table: "notes",
            },
          ],
        })
      )
    ).toBe(true);
  });
});
