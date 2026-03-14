"use server";

import "server-only";

import { authenticateAndRateLimit } from "@helvety/shared/action-helpers";
import { ENTITY_LIMITS } from "@helvety/shared/constants";
import { logger } from "@helvety/shared/logger";
import { after } from "next/server";
import { z } from "zod";

import { RATE_LIMITS } from "@/lib/rate-limit";

import type {
  ActionResponse,
  ItemRow,
  ReorderUpdate,
  EncryptedNoteExport,
} from "@/lib/types";

const NOTES_ITEMS_TABLE = "notes" as const;
const MAX_REORDER_ITEMS = ENTITY_LIMITS.MAX_NOTES_PER_USER;
const REORDER_CHUNK_SIZE = 50;
const MAX_EXPORT_ROWS_PER_TABLE = 5000;

// =============================================================================
// Input Validation Schemas
// =============================================================================

/** Schema for batch reorder updates (capped to prevent DoS via unbounded parallel queries) */
const ReorderSchema = z
  .array(
    z.object({
      id: z.string().uuid(),
      sort_order: z.number().int().min(0),
    })
  )
  .max(
    MAX_REORDER_ITEMS,
    `Too many items to reorder (max ${MAX_REORDER_ITEMS})`
  );

const EntityTypeSchema = z.literal("item");

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
  csrfToken: string,
  parentId?: string
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

    const validationResult = ReorderSchema.safeParse(updates);
    if (!validationResult.success) {
      logger.warn("Invalid reorder data", {
        fields: validationResult.error.issues.map((issue) =>
          issue.path.join(".")
        ),
        issueCount: validationResult.error.issues.length,
      });
      return { success: false, error: "Invalid reorder data" };
    }
    const validatedUpdates = validationResult.data;

    if (validatedUpdates.length === 0) {
      return { success: true };
    }

    void parentId;

    // Ensure all entities being reordered belong to the current user.
    const updateIds = validatedUpdates.map((update) => update.id);
    const { data: allowedRows, error: allowedRowsError } = await supabase
      .from(NOTES_ITEMS_TABLE)
      .select("id")
      .eq("user_id", user.id)
      .in("id", updateIds);
    if (allowedRowsError) {
      logger.error("Error validating item reorder scope:", allowedRowsError);
      return { success: false, error: "Failed to reorder items" };
    }
    if ((allowedRows ?? []).length !== updateIds.length) {
      return { success: false, error: "Invalid item reorder scope" };
    }
    // Batch updates in chunks to avoid saturating DB connections.
    const now = new Date().toISOString();
    const results = [];
    for (let i = 0; i < validatedUpdates.length; i += REORDER_CHUNK_SIZE) {
      const chunk = validatedUpdates.slice(i, i + REORDER_CHUNK_SIZE);
      const chunkResults = await Promise.all(
        chunk.map((update) => {
          const updateObj: Record<string, unknown> = {
            sort_order: update.sort_order,
            updated_at: now,
          };

          return supabase
            .from(NOTES_ITEMS_TABLE)
            .update(updateObj)
            .eq("id", update.id)
            .eq("user_id", user.id);
        })
      );
      results.push(...chunkResults);
    }

    const failedResult = results.find((r) => r.error);
    if (failedResult?.error) {
      logger.error(`Error reordering ${entityType}:`, failedResult.error);
      return { success: false, error: `Failed to reorder ${entityType}s` };
    }

    return { success: true };
  } catch (error) {
    after(() => logger.error("Unexpected error in reorderEntities:", error));
    return { success: false, error: "An unexpected error occurred" };
  }
}

// =============================================================================
// DATA EXPORT (nDSG Art. 28, Right to Data Portability)
// =============================================================================

export type { EncryptedNoteExport } from "@/lib/types";

/**
 * Fetch all encrypted note data for export.
 * Returns all items as encrypted rows.
 * The client is responsible for decrypting the data using the user's
 * encryption key before presenting or saving the export.
 *
 * Legal basis: nDSG Art. 28 (right to data portability)
 */
export async function getAllNoteDataForExport(): Promise<
  ActionResponse<EncryptedNoteExport>
> {
  try {
    const auth = await authenticateAndRateLimit({
      rateLimitPrefix: "export",
      rateLimitConfig: { maxRequests: 5, windowMs: RATE_LIMITS.API.windowMs },
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    // Fetch bounded data to prevent oversized in-memory exports.
    const { data: items, error: itemsError } = await supabase
      .from(NOTES_ITEMS_TABLE)
      .select("*")
      .eq("user_id", user.id)
      .order("sort_order")
      .limit(MAX_EXPORT_ROWS_PER_TABLE + 1)
      .returns<ItemRow[]>();

    if (itemsError) {
      logger.error("Error fetching note data for export:", {
        items: itemsError,
      });
      return { success: false, error: "Failed to fetch note data" };
    }

    if ((items?.length ?? 0) > MAX_EXPORT_ROWS_PER_TABLE) {
      logger.warn("Export exceeds maximum row cap", {
        userId: user.id,
        items: items?.length ?? 0,
        cap: MAX_EXPORT_ROWS_PER_TABLE,
      });
      return {
        success: false,
        error:
          "Export too large for a single request. Please reduce dataset size and retry.",
      };
    }

    logger.info(`Data export requested for user ${user.id}`);

    return {
      success: true,
      data: {
        items: items ?? [],
      },
    };
  } catch (error) {
    after(() =>
      logger.error("Unexpected error in getAllNoteDataForExport:", error)
    );
    return { success: false, error: "An unexpected error occurred" };
  }
}
