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

import { RATE_LIMITS } from "@/lib/rate-limit";

import type {
  ActionResponse,
  EncryptedLinksExport,
  FolderReorderUpdate,
  LinkFolderRow,
  LinkReorderUpdate,
  LinkRow,
} from "@/lib/types";
import type { validateOwnedReorderScope } from "@helvety/shared/entity-action-primitives";

const LINK_FOLDERS_TABLE = "link_folders" as const;
const LINKS_TABLE = "links" as const;

/**
 *
 */
function revalidateLinksRoutes(): void {
  revalidatePath("/links");
}

const FolderReorderSchema = z
  .array(
    z.object({
      id: z.string().uuid(),
      sort_order: z.number().int().min(0),
      parent_folder_id: z.string().uuid().nullable().optional(),
    })
  )
  .max(ACTION_LIMITS.MAX_REORDER_ITEMS);

const LinkReorderSchema = z
  .array(
    z.object({
      id: z.string().uuid(),
      sort_order: z.number().int().min(0),
      folder_id: z.string().uuid().nullable().optional(),
    })
  )
  .max(ACTION_LIMITS.MAX_REORDER_ITEMS);

/**
 *
 */
async function validateSameParentFolder(
  supabase: Parameters<typeof validateOwnedReorderScope>[0]["supabase"],
  userId: string,
  updates: FolderReorderUpdate[]
): Promise<{ success: true } | { success: false; error: string }> {
  const ids = updates.map((u) => u.id);
  const { data, error } = await supabase
    .from(LINK_FOLDERS_TABLE)
    .select("id, parent_folder_id")
    .eq("user_id", userId)
    .in("id", ids);

  if (error) {
    logger.logUnexpectedError("Error validating folder reorder scope", error);
    return { success: false, error: "Failed to reorder folders" };
  }

  const rows = (data ?? []) as Pick<LinkFolderRow, "id" | "parent_folder_id">[];
  if (rows.length !== ids.length) {
    return { success: false, error: "Invalid folder reorder scope" };
  }

  const parents = new Set(rows.map((r) => r.parent_folder_id ?? null));
  if (parents.size !== 1) {
    return {
      success: false,
      error: "Reorder folders within one parent only",
    };
  }

  return { success: true };
}

/**
 *
 */
async function validateSameLinkFolder(
  supabase: Parameters<typeof validateOwnedReorderScope>[0]["supabase"],
  userId: string,
  updates: LinkReorderUpdate[]
): Promise<{ success: true } | { success: false; error: string }> {
  const ids = updates.map((u) => u.id);
  const { data, error } = await supabase
    .from(LINKS_TABLE)
    .select("id, folder_id")
    .eq("user_id", userId)
    .in("id", ids);

  if (error) {
    logger.logUnexpectedError("Error validating link reorder scope", error);
    return { success: false, error: "Failed to reorder links" };
  }

  const rows = (data ?? []) as Pick<LinkRow, "id" | "folder_id">[];
  if (rows.length !== ids.length) {
    return { success: false, error: "Invalid link reorder scope" };
  }

  const folders = new Set(rows.map((r) => r.folder_id ?? null));
  if (folders.size !== 1) {
    return {
      success: false,
      error: "Reorder links within one folder only",
    };
  }

  return { success: true };
}

/**
 *
 */
export async function reorderFolders(
  updates: FolderReorderUpdate[],
  csrfToken: string
): Promise<ActionResponse> {
  try {
    const auth = await authenticateAndRateLimit({
      csrfToken,
      rateLimitPrefix: "links",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const validationResult = parseActionInput({
      schema: FolderReorderSchema,
      data: updates,
      warnMessage: "Invalid folder reorder data",
      invalidDataMessage: "Invalid folder reorder data",
    });
    if (!validationResult.success) {
      return validationResult;
    }
    const validated = validationResult.data;
    if (validated.length === 0) {
      return { success: true };
    }

    const scopeCheck = await validateSameParentFolder(
      supabase,
      user.id,
      validated
    );
    if (!scopeCheck.success) {
      return scopeCheck;
    }

    const reorderResult = await reorderOwnedEntities({
      supabase,
      userId: user.id,
      tableName: LINK_FOLDERS_TABLE,
      updates: validated,
      scope: "Error validating folder reorder scope",
      failureMessage: "Failed to reorder folders",
      invalidScopeMessage: "Invalid folder reorder scope",
      buildUpdateObject: (update, nowIso) => ({
        sort_order: update.sort_order,
        updated_at: nowIso,
        ...(update.parent_folder_id !== undefined
          ? { parent_folder_id: update.parent_folder_id }
          : {}),
      }),
    });

    if (!reorderResult.success) {
      if (reorderResult.cause === undefined) {
        return { success: false, error: reorderResult.error };
      }
      logger.logUnexpectedError(
        "Error reordering folders",
        reorderResult.cause
      );
      return { success: false, error: "Failed to reorder folders" };
    }

    revalidateLinksRoutes();
    return { success: true };
  } catch (error) {
    return unexpectedActionError("Unexpected error in reorderFolders", error);
  }
}

/**
 *
 */
export async function reorderLinks(
  updates: LinkReorderUpdate[],
  csrfToken: string
): Promise<ActionResponse> {
  try {
    const auth = await authenticateAndRateLimit({
      csrfToken,
      rateLimitPrefix: "links",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const validationResult = parseActionInput({
      schema: LinkReorderSchema,
      data: updates,
      warnMessage: "Invalid link reorder data",
      invalidDataMessage: "Invalid link reorder data",
    });
    if (!validationResult.success) {
      return validationResult;
    }
    const validated = validationResult.data;
    if (validated.length === 0) {
      return { success: true };
    }

    const scopeCheck = await validateSameLinkFolder(
      supabase,
      user.id,
      validated
    );
    if (!scopeCheck.success) {
      return scopeCheck;
    }

    const reorderResult = await reorderOwnedEntities({
      supabase,
      userId: user.id,
      tableName: LINKS_TABLE,
      updates: validated,
      scope: "Error validating link reorder scope",
      failureMessage: "Failed to reorder links",
      invalidScopeMessage: "Invalid link reorder scope",
      buildUpdateObject: (update, nowIso) => ({
        sort_order: update.sort_order,
        updated_at: nowIso,
        ...(update.folder_id !== undefined
          ? { folder_id: update.folder_id }
          : {}),
      }),
    });

    if (!reorderResult.success) {
      if (reorderResult.cause === undefined) {
        return { success: false, error: reorderResult.error };
      }
      logger.logUnexpectedError("Error reordering links", reorderResult.cause);
      return { success: false, error: "Failed to reorder links" };
    }

    revalidateLinksRoutes();
    return { success: true };
  } catch (error) {
    return unexpectedActionError("Unexpected error in reorderLinks", error);
  }
}

/**
 *
 */
export async function getAllLinkDataForExport(): Promise<
  ActionResponse<EncryptedLinksExport>
> {
  try {
    const auth = await authenticateAndRateLimit({
      rateLimitPrefix: "export",
      readRateLimitConfig: RATE_LIMITS.EXPORT,
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const [foldersResult, linksResult] = await Promise.all([
      supabase
        .from(LINK_FOLDERS_TABLE)
        .select("*")
        .eq("user_id", user.id)
        .order("sort_order")
        .limit(ACTION_LIMITS.MAX_EXPORT_ROWS_PER_TABLE + 1)
        .overrideTypes<LinkFolderRow[], { merge: false }>(),
      supabase
        .from(LINKS_TABLE)
        .select("*")
        .eq("user_id", user.id)
        .order("sort_order")
        .limit(ACTION_LIMITS.MAX_EXPORT_ROWS_PER_TABLE + 1)
        .overrideTypes<LinkRow[], { merge: false }>(),
    ]);

    if (foldersResult.error || linksResult.error) {
      logger.logUnexpectedError(
        "Error fetching link data for export",
        foldersResult.error ?? linksResult.error
      );
      return { success: false, error: "Failed to load link data" };
    }

    if (
      !isExportWithinCap(foldersResult.data?.length ?? 0) ||
      !isExportWithinCap(linksResult.data?.length ?? 0)
    ) {
      return {
        success: false,
        error:
          "Export too large for a single request. Please reduce dataset size and retry.",
      };
    }

    logger.info("Data export requested", { source: "links" });

    return {
      success: true,
      data: {
        folders: foldersResult.data ?? [],
        links: linksResult.data ?? [],
      },
    };
  } catch (error) {
    return unexpectedActionError(
      "Unexpected error in getAllLinkDataForExport",
      error
    );
  }
}
