"use server";

import "server-only";

import { authenticateAndRateLimit } from "@helvety/shared/action-helpers";
import { ACTION_LIMITS } from "@helvety/shared/constants";
import { ENCRYPTED_PREFETCH_COLUMNS } from "@helvety/shared/encrypted-prefetch-api";
import {
  fetchOwnedEncryptedExport,
  logEncryptedExportRequested,
} from "@helvety/shared/entity-action-primitives";
import { runOwnedReorderAction } from "@helvety/shared/reorder-action-helper";
import { unexpectedActionError } from "@helvety/shared/server-action-primitives";
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
    const typeResult = EntityTypeSchema.safeParse(entityType);
    if (!typeResult.success) {
      return { success: false, error: "Invalid entity type" };
    }

    return await runOwnedReorderAction({
      csrfToken,
      rateLimitPrefix: "notes",
      schema: ReorderSchema,
      updates,
      warnMessage: "Invalid reorder data",
      invalidDataMessage: "Invalid reorder data",
      tableName: NOTES_ITEMS_TABLE,
      entityType,
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
      onSuccess: revalidateItemRoutes,
    });
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

    const exportResult = await fetchOwnedEncryptedExport<ItemRow>({
      supabase,
      userId: user.id,
      tableName: NOTES_ITEMS_TABLE,
      selectColumns: ENCRYPTED_PREFETCH_COLUMNS.notes,
      logScope: "Error fetching note data for export",
      loadErrorMessage: "Failed to load note data",
    });
    if (!exportResult.success) {
      return { success: false, error: exportResult.error };
    }

    logEncryptedExportRequested("notes", user.id);

    return {
      success: true,
      data: {
        items: exportResult.rows,
      },
    };
  } catch (error) {
    return unexpectedActionError(
      "Unexpected error in getAllNoteDataForExport",
      error
    );
  }
}
