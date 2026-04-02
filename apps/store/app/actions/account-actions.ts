"use server";

import "server-only";

/**
 * Server actions for account management
 * Handle user profile updates, account deletion, and data export
 */

import { authenticateAndRateLimit } from "@helvety/shared/action-helpers";
import { CONTACT_EMAIL } from "@helvety/shared/config";
import { logger } from "@helvety/shared/logger";
import { createScopedAdminQuery } from "@helvety/shared/supabase/admin";
import { z } from "zod";

import { hasAccountDeletionVerificationFailures } from "@/lib/account-deletion-compliance";
import { verifyDeletionResidualCounts } from "@/lib/account-deletion-verification";
import { RATE_LIMITS } from "@/lib/rate-limit";

import type { ActionResponse } from "@/lib/types";
import type { UserDataExport } from "@/lib/types/store";

// =============================================================================
// INPUT VALIDATION SCHEMAS
// =============================================================================

/**
 * Email validation schema
 */
const EmailSchema = z
  .string()
  .min(1, "Email is required")
  .max(254, "Email too long")
  .email("Invalid email format");

/**
 * Get current user profile information
 */
export async function getCurrentUser(): Promise<
  ActionResponse<{
    id: string;
    email: string;
    createdAt: string;
  }>
> {
  try {
    const auth = await authenticateAndRateLimit({
      rateLimitPrefix: "acct",
    });
    if (!auth.ok) return auth.response;
    const { user } = auth.ctx;

    return {
      success: true,
      data: {
        id: user.id,
        email: user.email ?? "",
        createdAt: user.created_at,
      },
    };
  } catch (error) {
    logger.error("Error in getCurrentUser:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Update user email address
 * Supabase will send a confirmation email to the new address
 * The user must confirm both the old and new email addresses
 *
 * @param newEmail - The new email address
 * @param csrfToken - CSRF token for security validation
 */
export async function updateUserEmail(
  newEmail: string,
  csrfToken: string
): Promise<ActionResponse<void>> {
  try {
    const parseResult = EmailSchema.safeParse(newEmail);
    if (!parseResult.success) {
      const errorMessage =
        parseResult.error.issues[0]?.message ?? "Invalid email";
      return { success: false, error: errorMessage };
    }

    const auth = await authenticateAndRateLimit({
      csrfToken,
      rateLimitPrefix: "acct",
      rateLimitConfig: RATE_LIMITS.ACCOUNT_MUTATE,
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    // Check if new email is same as current
    if (user.email?.toLowerCase() === newEmail.toLowerCase()) {
      return {
        success: false,
        error: "New email must be different from current email",
      };
    }

    // Update email - Supabase will send confirmation email
    const { error } = await supabase.auth.updateUser({
      email: newEmail,
    });

    if (error) {
      logger.error("Error updating email:", error);

      // Handle common errors
      if (error.message.includes("already registered")) {
        return { success: false, error: "This email is already in use" };
      }

      return {
        success: false,
        error: `We couldn't update your email. Please try again, or contact us at ${CONTACT_EMAIL}.`,
      };
    }

    logger.info(`Email change requested for user ${user.id}`);
    return { success: true };
  } catch (error) {
    logger.error("Error in updateUserEmail:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// =============================================================================
// ACCOUNT DELETION
// =============================================================================

/**
 * Permanently delete the user's account.
 *
 * This action:
 * 1. Deletes the user via Supabase Admin API (cascade deletes handle
 *    all user-owned rows in current product tables; post-delete
 *    verification below enforces cleanup expectations)
 *
 * Legal basis: nDSG Art. 32(2) (right to request deletion) + Art. 6(4)
 * (purpose limitation). Certain security/compliance records may be retained
 * where required by applicable legal obligations and documented policy.
 *
 * @param csrfToken - CSRF token for security validation
 */
export async function requestAccountDeletion(
  csrfToken: string
): Promise<ActionResponse<void>> {
  try {
    const auth = await authenticateAndRateLimit({
      csrfToken,
      rateLimitPrefix: "acct",
      rateLimitConfig: RATE_LIMITS.ACCOUNT_MUTATE,
    });
    if (!auth.ok) return auth.response;
    const { user } = auth.ctx;

    const scopedAdmin = createScopedAdminQuery(user.id);
    const adminClient = scopedAdmin.client;

    // 1. Delete the user via Supabase Admin API.
    // Post-delete verification provides the source of truth for table-level cleanup.
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(
      user.id
    );

    if (deleteError) {
      logger.error("Error deleting user:", deleteError);
      return {
        success: false,
        error: "Failed to delete account. Please try again or contact support.",
      };
    }

    // 3. Post-delete verification to prove data cleanup completeness.
    const [residualCounts, authLookup] = await Promise.all([
      verifyDeletionResidualCounts(scopedAdmin, user.id),
      adminClient.auth.admin.getUserById(user.id),
    ]);

    const residualRows = residualCounts.filter((row) => row.count > 0);
    const residualErrors = residualCounts.filter((row) => row.error !== null);
    const authStillExists = Boolean(authLookup.data?.user) && !authLookup.error;

    const verificationReport = {
      userId: user.id,
      authStillExists,
      residualRows: residualRows.map((row) => ({
        table: row.table,
        column: row.column,
        count: row.count,
      })),
      residualErrors: residualErrors.map((row) => ({
        table: row.table,
        column: row.column,
        error: row.error ?? "unknown_error",
      })),
    };

    if (hasAccountDeletionVerificationFailures(verificationReport)) {
      logger.error("Account deletion verification failed:", verificationReport);
      return {
        success: false,
        error:
          "Account deletion was processed but verification found cleanup issues. Please contact support immediately.",
      };
    }

    logger.info(`Account deleted for user ${user.id}`, verificationReport);
    return { success: true };
  } catch (error) {
    logger.error("Error in requestAccountDeletion:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// =============================================================================
// DATA EXPORT (nDSG Art. 28, Right to Data Portability)
// =============================================================================

export type { UserDataExport } from "@/lib/types/store";

/**
 * Export account profile data in a structured JSON format.
 *
 * Returns profile info only. Legacy tenant-specific datasets were removed from
 * the export shape. Encrypted app data (Tasks, Contacts, Notes) is NOT
 * included; that content must be exported client-side from within those apps
 * while the user is authenticated with their passkey.
 *
 * Legal basis: nDSG Art. 28 (right to data portability; data should be
 * provided in a structured, commonly used format).
 */
export async function exportUserData(): Promise<
  ActionResponse<UserDataExport>
> {
  try {
    const auth = await authenticateAndRateLimit({
      rateLimitPrefix: "data-export",
      readRateLimitConfig: RATE_LIMITS.DATA_EXPORT,
    });
    if (!auth.ok) return auth.response;
    const { user } = auth.ctx;

    const scopedAdmin = createScopedAdminQuery(user.id);

    const { data: profile } = await scopedAdmin
      .from("user_profiles")
      .select("email, display_name, created_at")
      .single();

    const exportData: UserDataExport = {
      exportedAt: new Date().toISOString(),
      profile: {
        email: profile?.email ?? user.email ?? "",
        displayName: profile?.display_name ?? null,
        createdAt: profile?.created_at ?? user.created_at,
      },
    };

    logger.info(`Data export requested for user ${user.id}`);
    return { success: true, data: exportData };
  } catch (error) {
    logger.error("Error in exportUserData:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
