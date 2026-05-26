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
import type { SupabaseClient } from "@helvety/shared/supabase-types";

const LINKS_TABLE = "links" as const;
const LINK_FOLDERS_TABLE = "link_folders" as const;

/**
 *
 */
function revalidateLinksRoutes(): void {
  revalidatePath("/links");
}

const CreateLinkSchema = z
  .object({
    id: z.string().uuid(),
    encrypted_name: EncryptedDataSchema,
    encrypted_url: EncryptedDataSchema,
    folder_id: z.string().uuid().nullable(),
    sort_order: z.number().int().min(0).optional(),
  })
  .strict();

const UpdateLinkSchema = z
  .object({
    id: z.string().uuid(),
    encrypted_name: EncryptedDataSchema.optional(),
    encrypted_url: EncryptedDataSchema.optional(),
    folder_id: z.string().uuid().nullable().optional(),
    sort_order: z.number().int().min(0).optional(),
  })
  .strict();

/**
 *
 */
async function ensureFolderOwned(
  supabase: SupabaseClient,
  userId: string,
  folderId: string | null
): Promise<boolean> {
  if (folderId === null) {
    return true;
  }
  const { data, error } = await supabase
    .from(LINK_FOLDERS_TABLE)
    .select("id")
    .eq("id", folderId)
    .eq("user_id", userId)
    .maybeSingle();
  return !error && Boolean(data);
}

/**
 *
 */
export async function createLink(
  data: {
    id: string;
    encrypted_name: string;
    encrypted_url: string;
    folder_id: string | null;
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
      schema: CreateLinkSchema,
      data,
      warnMessage: "Invalid link data",
      invalidDataMessage: "Invalid link data",
    });
    if (!validationResult.success) {
      return validationResult;
    }
    const validated = validationResult.data;

    if (!(await ensureFolderOwned(supabase, user.id, validated.folder_id))) {
      return { success: false, error: "Folder not found" };
    }

    const insertObj: Record<string, unknown> = {
      id: validated.id,
      user_id: user.id,
      encrypted_name: validated.encrypted_name,
      encrypted_url: validated.encrypted_url,
      folder_id: validated.folder_id,
    };
    if (validated.sort_order !== undefined) {
      insertObj.sort_order = validated.sort_order;
    }

    const { data: row, error } = await supabase
      .from(LINKS_TABLE)
      .insert(insertObj)
      .select("id")
      .single();

    if (error) {
      logger.logUnexpectedError("Error creating link", error);
      return { success: false, error: "Failed to create link" };
    }
    if (!row) {
      return { success: false, error: "Failed to create link" };
    }

    revalidateLinksRoutes();
    return { success: true, data: { id: row.id } };
  } catch (error) {
    return unexpectedActionError("Unexpected error in createLink", error);
  }
}

/**
 *
 */
export async function updateLink(
  data: {
    id: string;
    encrypted_name?: string;
    encrypted_url?: string;
    folder_id?: string | null;
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
      schema: UpdateLinkSchema,
      data,
      warnMessage: "Invalid link update data",
      invalidDataMessage: "Invalid link data",
    });
    if (!validationResult.success) {
      return validationResult;
    }
    const validated = validationResult.data;

    if (
      validated.folder_id !== undefined &&
      !(await ensureFolderOwned(supabase, user.id, validated.folder_id))
    ) {
      return { success: false, error: "Folder not found" };
    }

    const updateObj: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    assignDefinedField(updateObj, "encrypted_name", validated.encrypted_name);
    assignDefinedField(updateObj, "encrypted_url", validated.encrypted_url);
    assignDefinedField(updateObj, "folder_id", validated.folder_id);
    assignDefinedField(updateObj, "sort_order", validated.sort_order);

    const { error } = await supabase
      .from(LINKS_TABLE)
      .update(updateObj)
      .eq("id", validated.id)
      .eq("user_id", user.id);

    if (error) {
      logger.logUnexpectedError("Error updating link", error);
      return { success: false, error: "Failed to update link" };
    }

    revalidateLinksRoutes();
    return { success: true };
  } catch (error) {
    return unexpectedActionError("Unexpected error in updateLink", error);
  }
}

/**
 *
 */
export async function deleteLink(
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
      return { success: false, error: "Invalid link ID" };
    }

    const { error } = await supabase
      .from(LINKS_TABLE)
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      logger.logUnexpectedError("Error deleting link", error);
      return { success: false, error: "Failed to delete link" };
    }

    revalidateLinksRoutes();
    return { success: true };
  } catch (error) {
    return unexpectedActionError("Unexpected error in deleteLink", error);
  }
}
