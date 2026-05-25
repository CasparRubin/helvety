"use server";

import "server-only";

import { authenticateAndRateLimit } from "@helvety/shared/action-helpers";
import { ACTION_LIMITS } from "@helvety/shared/constants";
import { ENCRYPTED_PREFETCH_COLUMNS } from "@helvety/shared/encrypted-prefetch-api";
import {
  fetchOwnedEncryptedExport,
  logEncryptedExportRequested,
  mapReorderOwnedEntitiesFailure,
  reorderOwnedEntities,
} from "@helvety/shared/entity-action-primitives";
import {
  parseActionInput,
  unexpectedActionError,
} from "@helvety/shared/server-action-primitives";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { DEFAULT_STAGE_CONFIGS } from "@/lib/config/default-stages";
import { RATE_LIMITS } from "@/lib/rate-limit";

import type {
  ActionResponse,
  ItemRow,
  ReorderUpdate,
  EncryptedTaskExport,
} from "@/lib/types";

const ALLOWED_STAGE_IDS = Object.values(DEFAULT_STAGE_CONFIGS)
  .flatMap((config) => config.stages.map((stage) => stage.id))
  .filter((id, index, allIds) => allIds.indexOf(id) === index) as [
  string,
  ...string[],
];

// =============================================================================
// Input Validation Schemas
// =============================================================================

/** Schema for batch reorder updates (capped to prevent DoS via unbounded parallel queries) */
const ReorderSchema = z
  .array(
    z.object({
      id: z.string().uuid(),
      sort_order: z.number().int().min(0),
      // Accept constrained default stage IDs only
      stage_id: z.enum(ALLOWED_STAGE_IDS).optional(),
    })
  )
  .max(
    ACTION_LIMITS.MAX_REORDER_ITEMS,
    `Too many items to reorder (max ${ACTION_LIMITS.MAX_REORDER_ITEMS})`
  );

const EntityTypeSchema = z.literal("item");

/** Revalidate task routes after reorder mutations. */
function revalidateItemRoutes(): void {
  revalidatePath("/tasks");
}

// =============================================================================
// BATCH REORDER ACTION (for drag-and-drop)
// =============================================================================

/**
 * Batch update sort_order (and optionally stage_id) for multiple entities
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
      rateLimitPrefix: "tasks",
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
      tableName: "items",
      updates: validatedUpdates,
      scope: "Error validating item reorder scope",
      failureMessage: "Failed to reorder items",
      invalidScopeMessage: "Invalid item reorder scope",
      buildUpdateObject: (update, nowIso) => {
        const updateObj: Record<string, unknown> = {
          sort_order: update.sort_order,
          updated_at: nowIso,
        };
        if (update.stage_id !== undefined) {
          updateObj.stage_id = update.stage_id;
        }
        return updateObj;
      },
    });

    const reorderFailure = mapReorderOwnedEntitiesFailure(
      entityType,
      reorderResult,
      `Error reordering ${entityType}`
    );
    if (reorderFailure) {
      return reorderFailure;
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
 * Fetch all encrypted task data for export.
 * Returns all items as encrypted rows.
 * The client is responsible for decrypting the data using the user's
 * encryption key before presenting or saving the export.
 *
 * Security: read-only server action (no CSRF token); requires a session and uses
 * `readRateLimitConfig: RATE_LIMITS.EXPORT` for per-user throttling.
 *
 * Export format and legal context are documented in the product legal pages.
 */
export async function getAllTaskDataForExport(): Promise<
  ActionResponse<EncryptedTaskExport>
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
      tableName: "items",
      selectColumns: ENCRYPTED_PREFETCH_COLUMNS.items,
      logScope: "Error fetching task data for export",
      loadErrorMessage: "Failed to load task data",
    });
    if (!exportResult.success) {
      return { success: false, error: exportResult.error };
    }

    logEncryptedExportRequested("tasks", user.id);

    return {
      success: true,
      data: {
        items: exportResult.rows,
      },
    };
  } catch (error) {
    return unexpectedActionError(
      "Unexpected error in getAllTaskDataForExport",
      error
    );
  }
}
