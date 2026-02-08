"use server";

import "server-only";

import { z } from "zod";

import { authenticateAndRateLimit } from "@/lib/action-helpers";
import { ATTACHMENT_BUCKET } from "@/lib/constants";
import { logger } from "@/lib/logger";
import { createAdminClient } from "@/lib/supabase/admin";

import type { ActionResponse, AttachmentRow } from "@/lib/types";

// =============================================================================
// Input Validation Schemas
// =============================================================================

/**
 * Schema for encrypted metadata
 * Validates that the encrypted data is valid JSON with required fields
 */
const EncryptedMetadataSchema = z
  .string()
  .min(1)
  .max(100000) // 100KB max for encrypted metadata
  .refine(
    (val) => {
      try {
        const parsed = JSON.parse(val);
        return (
          typeof parsed.iv === "string" &&
          typeof parsed.ciphertext === "string" &&
          typeof parsed.version === "number"
        );
      } catch {
        return false;
      }
    },
    { message: "Invalid encrypted metadata format" }
  );

/** Schema for creating an attachment */
const CreateAttachmentSchema = z.object({
  item_id: z.string().uuid(),
  storage_path: z.string().min(1).max(500),
  encrypted_metadata: EncryptedMetadataSchema,
  sort_order: z.number().int().min(0).optional(),
});

// =============================================================================
// ATTACHMENT ACTIONS
// =============================================================================

/**
 * Create a new attachment record in the database.
 * The actual encrypted file blob has already been uploaded to Supabase Storage
 * by the client before this action is called.
 */
export async function createAttachment(
  data: {
    item_id: string;
    storage_path: string;
    encrypted_metadata: string;
    sort_order?: number;
  },
  csrfToken: string
): Promise<ActionResponse<{ id: string }>> {
  try {
    const auth = await authenticateAndRateLimit({
      csrfToken,
      rateLimitPrefix: "attachments",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    // Validate input
    const validationResult = CreateAttachmentSchema.safeParse(data);
    if (!validationResult.success) {
      logger.warn("Invalid attachment data:", validationResult.error.format());
      return { success: false, error: "Invalid attachment data" };
    }
    const validatedData = validationResult.data;

    // Verify the storage path starts with the user's ID (defense-in-depth)
    if (!validatedData.storage_path.startsWith(`${user.id}/`)) {
      logger.warn("Attachment storage path does not match user ID:", {
        userId: user.id,
        storagePath: validatedData.storage_path,
      });
      return { success: false, error: "Invalid storage path" };
    }

    // Verify user owns the item
    const { data: item, error: itemError } = await supabase
      .from("items")
      .select("id")
      .eq("id", validatedData.item_id)
      .single();

    if (itemError || !item) {
      return { success: false, error: "Item not found" };
    }

    // Insert attachment record
    const { data: attachment, error } = await supabase
      .from("item_attachments")
      .insert({
        item_id: validatedData.item_id,
        user_id: user.id,
        storage_path: validatedData.storage_path,
        encrypted_metadata: validatedData.encrypted_metadata,
        sort_order: validatedData.sort_order ?? 0,
      })
      .select("id")
      .single();

    if (error || !attachment) {
      logger.error("Error creating attachment:", error);
      return { success: false, error: "Failed to create attachment" };
    }

    return { success: true, data: { id: attachment.id } };
  } catch (error) {
    logger.error("Unexpected error in createAttachment:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Get all attachments for an item.
 * Returns encrypted attachment rows that must be decrypted client-side.
 */
export async function getAttachments(
  itemId: string
): Promise<ActionResponse<AttachmentRow[]>> {
  try {
    const auth = await authenticateAndRateLimit({
      rateLimitPrefix: "attachments",
    });
    if (!auth.ok) return auth.response;
    const { supabase } = auth.ctx;

    if (!z.string().uuid().safeParse(itemId).success) {
      return { success: false, error: "Invalid item ID" };
    }

    // Get attachments (RLS ensures only user's own attachments are returned)
    const { data: attachments, error } = await supabase
      .from("item_attachments")
      .select("*")
      .eq("item_id", itemId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      logger.error("Error getting attachments:", error);
      return { success: false, error: "Failed to get attachments" };
    }

    return { success: true, data: attachments as AttachmentRow[] };
  } catch (error) {
    logger.error("Unexpected error in getAttachments:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Delete an attachment record and its associated file in Supabase Storage.
 * Uses the admin client for storage deletion to ensure we can clean up
 * the file even if there are RLS timing issues.
 */
export async function deleteAttachment(
  id: string,
  csrfToken: string
): Promise<ActionResponse> {
  try {
    const auth = await authenticateAndRateLimit({
      csrfToken,
      rateLimitPrefix: "attachments",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    if (!z.string().uuid().safeParse(id).success) {
      return { success: false, error: "Invalid attachment ID" };
    }

    // Get the attachment record first (to know the storage path)
    const { data: attachment, error: fetchError } = await supabase
      .from("item_attachments")
      .select("id, storage_path")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !attachment) {
      if (fetchError?.code === "PGRST116") {
        return { success: false, error: "Attachment not found" };
      }
      logger.error("Error fetching attachment for deletion:", fetchError);
      return { success: false, error: "Failed to find attachment" };
    }

    // Delete the file from Supabase Storage using admin client
    // (admin client bypasses storage RLS for reliable cleanup)
    const adminClient = createAdminClient();
    const { error: storageError } = await adminClient.storage
      .from(ATTACHMENT_BUCKET)
      .remove([attachment.storage_path]);

    if (storageError) {
      // Log but don't fail the whole operation - the DB record is more important
      logger.error(
        "Error deleting file from storage (continuing with DB deletion):",
        storageError
      );
    }

    // Delete the database record (RLS + explicit user_id check for defense-in-depth)
    const { error: deleteError } = await supabase
      .from("item_attachments")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (deleteError) {
      logger.error("Error deleting attachment record:", deleteError);
      return { success: false, error: "Failed to delete attachment" };
    }

    return { success: true };
  } catch (error) {
    logger.error("Unexpected error in deleteAttachment:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
