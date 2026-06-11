"use server";

import "server-only";

import { authenticateAndRateLimit } from "@helvety/shared/action-helpers";
import { assignDefinedField } from "@helvety/shared/entity-action-primitives";
import { logger } from "@helvety/shared/logger";
import {
  parseActionInput,
  unexpectedActionError,
} from "@helvety/shared/server-action-primitives";
import { isUuidString } from "@helvety/shared/uuid-string";
import { EncryptedDataSchema } from "@helvety/shared/validation/encrypted-data";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ActionResponse } from "@/lib/types";

const LINK_FOLDERS_TABLE = "link_folders" as const;

/**
 *
 */
function revalidateLinksRoutes(): void {
  revalidatePath("/links");
}

const CreateFolderSchema = z
  .object({
    id: z.string().uuid(),
    encrypted_name: EncryptedDataSchema,
    parent_folder_id: z.string().uuid().nullable(),
    sort_order: z.number().int().min(0).optional(),
  })
  .strict();

const UpdateFolderSchema = z
  .object({
    id: z.string().uuid(),
    encrypted_name: EncryptedDataSchema.optional(),
    parent_folder_id: z.string().uuid().nullable().optional(),
    sort_order: z.number().int().min(0).optional(),
  })
  .strict();

/**
 *
 */
export async function createFolder(
  data: {
    id: string;
    encrypted_name: string;
    parent_folder_id: string | null;
    sort_order?: number;
  },
  csrfToken: string
): Promise<ActionResponse<{ id: string }>> {
  try {
    const auth = await authenticateAndRateLimit({
      csrfToken,
      rateLimitPrefix: "links",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const validationResult = parseActionInput({
      schema: CreateFolderSchema,
      data,
      warnMessage: "Invalid folder data",
      invalidDataMessage: "Invalid folder data",
    });
    if (!validationResult.success) {
      return validationResult;
    }
    const validated = validationResult.data;

    if (validated.parent_folder_id !== null) {
      const { data: parent, error: parentError } = await supabase
        .from(LINK_FOLDERS_TABLE)
        .select("id")
        .eq("id", validated.parent_folder_id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (parentError || !parent) {
        return { success: false, error: "Parent folder not found" };
      }
    }

    const insertObj: Record<string, unknown> = {
      id: validated.id,
      user_id: user.id,
      encrypted_name: validated.encrypted_name,
      parent_folder_id: validated.parent_folder_id,
    };
    if (validated.sort_order !== undefined) {
      insertObj.sort_order = validated.sort_order;
    }

    const { data: row, error } = await supabase
      .from(LINK_FOLDERS_TABLE)
      .insert(insertObj)
      .select("id")
      .single();

    if (error) {
      logger.logUnexpectedError("Error creating folder", error);
      return { success: false, error: "Failed to create folder" };
    }
    if (!row) {
      return { success: false, error: "Failed to create folder" };
    }

    revalidateLinksRoutes();
    return { success: true, data: { id: row.id } };
  } catch (error) {
    return unexpectedActionError("Unexpected error in createFolder", error);
  }
}

/**
 *
 */
export async function updateFolder(
  data: {
    id: string;
    encrypted_name?: string;
    parent_folder_id?: string | null;
    sort_order?: number;
  },
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
      schema: UpdateFolderSchema,
      data,
      warnMessage: "Invalid folder update data",
      invalidDataMessage: "Invalid folder data",
    });
    if (!validationResult.success) {
      return validationResult;
    }
    const validated = validationResult.data;

    if (
      validated.parent_folder_id !== undefined &&
      validated.parent_folder_id !== null
    ) {
      if (validated.parent_folder_id === validated.id) {
        return { success: false, error: "A folder cannot be its own parent" };
      }
      const { data: parent, error: parentError } = await supabase
        .from(LINK_FOLDERS_TABLE)
        .select("id")
        .eq("id", validated.parent_folder_id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (parentError || !parent) {
        return { success: false, error: "Parent folder not found" };
      }
    }

    const updateObj: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    assignDefinedField(updateObj, "encrypted_name", validated.encrypted_name);
    assignDefinedField(
      updateObj,
      "parent_folder_id",
      validated.parent_folder_id
    );
    assignDefinedField(updateObj, "sort_order", validated.sort_order);

    const { error } = await supabase
      .from(LINK_FOLDERS_TABLE)
      .update(updateObj)
      .eq("id", validated.id)
      .eq("user_id", user.id);

    if (error) {
      logger.logUnexpectedError("Error updating folder", error);
      return { success: false, error: "Failed to update folder" };
    }

    revalidateLinksRoutes();
    return { success: true };
  } catch (error) {
    return unexpectedActionError("Unexpected error in updateFolder", error);
  }
}

/**
 *
 */
export async function deleteFolder(
  id: string,
  csrfToken: string
): Promise<ActionResponse> {
  try {
    const auth = await authenticateAndRateLimit({
      csrfToken,
      rateLimitPrefix: "links",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    if (!isUuidString(id)) {
      return { success: false, error: "Invalid folder ID" };
    }

    const { error } = await supabase
      .from(LINK_FOLDERS_TABLE)
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      logger.logUnexpectedError("Error deleting folder", error);
      return { success: false, error: "Failed to delete folder" };
    }

    revalidateLinksRoutes();
    return { success: true };
  } catch (error) {
    return unexpectedActionError("Unexpected error in deleteFolder", error);
  }
}
