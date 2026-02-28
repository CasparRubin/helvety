/** Residual row count summary for a specific table/column check. */
export interface ResidualRowSummary {
  table: string;
  column: string;
  count: number;
}

/** Query error summary for a table/column residual check. */
export interface ResidualErrorSummary {
  table: string;
  column: string;
  error: string;
}

/** Verification payload generated after account deletion runs. */
export interface AccountDeletionVerificationReport {
  userId: string;
  authStillExists: boolean;
  residualRows: ResidualRowSummary[];
  residualErrors: ResidualErrorSummary[];
  residualStoragePathCount: number;
}

/** Returns true when any post-deletion residual artifact is detected. */
export function hasAccountDeletionVerificationFailures(
  report: AccountDeletionVerificationReport
): boolean {
  return (
    report.authStillExists ||
    report.residualRows.length > 0 ||
    report.residualErrors.length > 0 ||
    report.residualStoragePathCount > 0
  );
}
