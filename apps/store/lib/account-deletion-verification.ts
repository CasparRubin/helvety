import type { createScopedAdminQuery } from "@helvety/shared/supabase/admin";

/** Tables/columns checked for residual rows after account deletion. */
export const ACCOUNT_DELETION_VERIFICATION_CHECKS = [
  { table: "user_auth_credentials", column: "user_id" },
  { table: "user_passkey_params", column: "user_id" },
  { table: "items", column: "user_id" },
  { table: "contacts", column: "user_id" },
  { table: "entity_links", column: "user_id" },
  { table: "notes", column: "user_id" },
  { table: "user_profiles", column: "id" },
] as const;

/** Verification check tuple describing which table/column must be fully detached. */
export type AccountDeletionVerificationCheck =
  (typeof ACCOUNT_DELETION_VERIFICATION_CHECKS)[number];

/** Scoped Supabase admin client used for head count queries. */
type ScopedAdmin = ReturnType<typeof createScopedAdminQuery>;

/** Counts any residual rows still linked to the deleted user id. */
export async function verifyDeletionResidualCounts(
  scopedAdmin: ScopedAdmin,
  userId: string
): Promise<
  Array<
    AccountDeletionVerificationCheck & {
      count: number;
      error: string | null;
    }
  >
> {
  const checks = ACCOUNT_DELETION_VERIFICATION_CHECKS.map(async (check) => {
    try {
      const baseQuery = scopedAdmin.client
        .from(check.table as never)
        .select("id", { count: "exact", head: true });
      const { count, error } = await baseQuery.eq(check.column, userId);
      return {
        ...check,
        count: count ?? 0,
        error: error?.message ?? null,
      };
    } catch (error) {
      return {
        ...check,
        count: -1,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  return Promise.all(checks);
}
