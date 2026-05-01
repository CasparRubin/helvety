"use server";

import "server-only";

import { authenticateAndRateLimit } from "@helvety/shared/action-helpers";
import { ACTION_LIMITS } from "@helvety/shared/constants";
import {
  isExportWithinCap,
  reorderOwnedEntities,
} from "@helvety/shared/entity-action-primitives";
import { logger } from "@helvety/shared/logger";
import {
  parseActionInput,
  unexpectedActionError,
} from "@helvety/shared/server-action-primitives";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { ALLOWED_NOTE_CATEGORY_IDS } from "@/lib/config/default-note-categories";
import { RATE_LIMITS } from "@/lib/rate-limit";

import type {
  ActionResponse,
  ItemRow,
  ReorderUpdate,
  EncryptedNoteExport,
} from "@/lib/types";

const NOTES_ITEMS_TABLE = "notes" as const;

const NoteCategoryIdSchema = z.enum(ALLOWED_NOTE_CATEGORY_IDS);

// =============================================================================
// Input Validation Schemas
// =============================================================================

/** Schema for batch reorder updates (capped to prevent DoS via unbounded parallel queries) */
const ReorderSchema = z
  .array(
    z.object({
      id: z.string().uuid(),
      sort_order: z.number().int().min(0),
      category_id: NoteCategoryIdSchema.optional(),
    })
  )
  .max(
    ACTION_LIMITS.MAX_REORDER_ITEMS,
    `Too many items to reorder (max ${ACTION_LIMITS.MAX_REORDER_ITEMS})`
  );

const EntityTypeSchema = z.literal("item");

/** Revalidate notes routes after reorder mutations. */
function revalidateItemRoutes(): void {
  revalidatePath("/notes");
}

// =============================================================================
// BATCH REORDER ACTION (for drag-and-drop)
// =============================================================================

/**
 * Batch update sort_order for multiple entities
 * Used during drag-and-drop reordering
 */
export async function reorderEntities(
  entityType: "item",
  updates: ReorderUpdate[],
  csrfToken: string
): Promise<ActionResponse> {
  try {
    const auth = await authenticateAndRateLimit({
      csrfToken,
      rateLimitPrefix: "notes",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const typeResult = EntityTypeSchema.safeParse(entityType);
    if (!typeResult.success) {
      return { success: false, error: "Invalid entity type" };
    }

    const validationResult = parseActionInput({
      schema: ReorderSchema,
      data: updates,
      warnMessage: "Invalid reorder data",
      invalidDataMessage: "Invalid reorder data",
    });
    if (!validationResult.success) {
      return validationResult;
    }
    const validatedUpdates = validationResult.data;

    if (validatedUpdates.length === 0) {
      return { success: true };
    }

    const reorderResult = await reorderOwnedEntities({
      supabase,
      userId: user.id,
      tableName: NOTES_ITEMS_TABLE,
      updates: validatedUpdates,
      scope: "Error validating item reorder scope",
      failureMessage: "Failed to reorder items",
      invalidScopeMessage: "Invalid item reorder scope",
      buildUpdateObject: (update, nowIso) => {
        const updateObj: Record<string, unknown> = {
          sort_order: update.sort_order,
          updated_at: nowIso,
        };
        if (update.category_id !== undefined) {
          updateObj.category_id = update.category_id;
        }
        return updateObj;
      },
    });
    if (!reorderResult.success) {
      if (reorderResult.cause === undefined) {
        return { success: false, error: reorderResult.error };
      }
      logger.logUnexpectedError(
        `Error reordering ${entityType}`,
        reorderResult.cause
      );
      return { success: false, error: `Failed to reorder ${entityType}s` };
    }

    revalidateItemRoutes();
    return { success: true };
  } catch (error) {
    return unexpectedActionError("Unexpected error in reorderEntities", error);
  }
}

// =============================================================================
// DATA EXPORT
// =============================================================================

/**
 * Fetch all encrypted note data for export.
 * Returns all items as encrypted rows.
 * The client is responsible for decrypting the data using the user's
 * encryption key before presenting or saving the export.
 *
 * Security: read-only server action (no CSRF token); requires a session and uses
 * `readRateLimitConfig: RATE_LIMITS.EXPORT` for per-user throttling.
 *
 * Export format and legal context are documented in the product legal pages.
 */
export async function getAllNoteDataForExport(): Promise<
  ActionResponse<EncryptedNoteExport>
> {
  try {
    const auth = await authenticateAndRateLimit({
      rateLimitPrefix: "export",
      readRateLimitConfig: RATE_LIMITS.EXPORT,
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    // Fetch bounded data to prevent oversized in-memory exports.
    const { data: items, error: itemsError } = await supabase
      .from(NOTES_ITEMS_TABLE)
      .select("*")
      .eq("user_id", user.id)
      .order("sort_order")
      .limit(ACTION_LIMITS.MAX_EXPORT_ROWS_PER_TABLE + 1)
      .overrideTypes<ItemRow[], { merge: false }>();

    if (itemsError) {
      logger.logUnexpectedError(
        "Error fetching note data for export",
        itemsError
      );
      return { success: false, error: "Failed to fetch note data" };
    }

    if (!isExportWithinCap(items?.length ?? 0)) {
      logger.warn("Export exceeds maximum row cap", {
        userId: user.id,
        items: items?.length ?? 0,
        cap: ACTION_LIMITS.MAX_EXPORT_ROWS_PER_TABLE,
      });
      return {
        success: false,
        error:
          "Export too large for a single request. Please reduce dataset size and retry.",
      };
    }

    logger.info("Data export requested", { source: "notes" });

    return {
      success: true,
      data: {
        items: items ?? [],
      },
    };
  } catch (error) {
    return unexpectedActionError(
      "Unexpected error in getAllNoteDataForExport",
      error
    );
  }
}
