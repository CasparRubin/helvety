"use server";

/**
 * Server actions for account management
 * Handle user profile updates like email changes
 */

import { logger } from "@/lib/logger";
import { createServerComponentClient } from "@/lib/supabase/client-factory";

import type { ActionResponse } from "@/lib/types/entities";

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
    const supabase = await createServerComponentClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return { success: false, error: "Not authenticated" };
    }

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
 * @param newEmail
 */
export async function updateUserEmail(
  newEmail: string
): Promise<ActionResponse<void>> {
  try {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return { success: false, error: "Invalid email format" };
    }

    const supabase = await createServerComponentClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

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

      return { success: false, error: error.message };
    }

    logger.info(`Email change requested for user ${user.id}`);
    return { success: true };
  } catch (error) {
    logger.error("Error in updateUserEmail:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
