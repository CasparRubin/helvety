"use server";

import "server-only";

import { authenticateAndRateLimit } from "@/lib/action-helpers";
import { logger } from "@/lib/logger";

import type {
  ActionResponse,
  ContactRow,
  CategoryConfigRow,
  CategoryAssignment,
} from "@/lib/types";

// =============================================================================
// Batch Response Types
// =============================================================================

/** Data returned by the Contacts dashboard batch fetch */
export interface ContactsDashboardData {
  contacts: ContactRow[];
  categoryConfigs: CategoryConfigRow[];
  categoryAssignment: CategoryAssignment | null;
}

// =============================================================================
// BATCH READ ACTIONS
// =============================================================================

/**
 * Batch fetch all data needed for the Contacts dashboard.
 * Performs a single auth + rate-limit check, then runs all DB queries in parallel.
 *
 * Replaces 3 separate server actions on initial load:
 *   getContacts, getCategoryConfigs, getCategoryAssignment
 */
export async function getContactsDashboardData(): Promise<
  ActionResponse<ContactsDashboardData>
> {
  try {
    const auth = await authenticateAndRateLimit({
      rateLimitPrefix: "contacts",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const [contactsResult, categoryConfigsResult, assignmentResult] =
      await Promise.all([
        supabase
          .from("contacts")
          .select("*")
          .eq("user_id", user.id)
          .order("sort_order", { ascending: true })
          .returns<ContactRow[]>(),
        supabase
          .from("category_configs")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true })
          .returns<CategoryConfigRow[]>(),
        supabase
          .from("category_assignments")
          .select("*")
          .eq("user_id", user.id)
          .limit(1),
      ]);

    if (
      contactsResult.error ||
      categoryConfigsResult.error ||
      assignmentResult.error
    ) {
      logger.error("Error in getContactsDashboardData:", {
        contacts: contactsResult.error,
        categoryConfigs: categoryConfigsResult.error,
        categoryAssignment: assignmentResult.error,
      });
      return { success: false, error: "Failed to load dashboard data" };
    }

    return {
      success: true,
      data: {
        contacts: contactsResult.data ?? [],
        categoryConfigs: categoryConfigsResult.data ?? [],
        categoryAssignment:
          (assignmentResult.data?.[0] as CategoryAssignment) ?? null,
      },
    };
  } catch (error) {
    logger.error("Unexpected error in getContactsDashboardData:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
