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

const DOCS_TABLE = "docs" as const;

/** Revalidate docs app routes after vault mutations. */
function revalidateDocsRoutes(): void {
  revalidatePath("/docs");
}

const CreateDocSchema = z
  .object({
    id: z.string().uuid(),
    encrypted_title: EncryptedDataSchema,
    encrypted_docx: EncryptedDataSchema,
  })
  .strict();

const UpdateDocSchema = z
  .object({
    id: z.string().uuid(),
    encrypted_title: EncryptedDataSchema.optional(),
    encrypted_docx: EncryptedDataSchema.optional(),
  })
  .strict();

/** Create a new vault document. */
export async function createDoc(
  data: {
    id: string;
    encrypted_title: string;
    encrypted_docx: string;
  },
  csrfToken: string
): Promise<ActionResponse<{ id: string }>> {
  try {
    const auth = await authenticateAndRateLimit({
      csrfToken,
      rateLimitPrefix: "docs",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const validationResult = parseActionInput({
      schema: CreateDocSchema,
      data,
      warnMessage: "Invalid document data",
      invalidDataMessage: "Invalid document data",
    });
    if (!validationResult.success) {
      return validationResult;
    }
    const validatedData = validationResult.data;

    const { data: doc, error } = await supabase
      .from(DOCS_TABLE)
      .insert({
        id: validatedData.id,
        user_id: user.id,
        encrypted_title: validatedData.encrypted_title,
        encrypted_docx: validatedData.encrypted_docx,
      })
      .select("id")
      .single();

    if (error || !doc) {
      logger.logUnexpectedError("Error creating document", error);
      return { success: false, error: "Failed to save document" };
    }

    revalidateDocsRoutes();
    return { success: true, data: { id: doc.id } };
  } catch (error) {
    return unexpectedActionError("Unexpected error in createDoc", error);
  }
}

/** Update a vault document. */
export async function updateDoc(
  data: {
    id: string;
    encrypted_title?: string;
    encrypted_docx?: string;
  },
  csrfToken: string
): Promise<ActionResponse> {
  try {
    const auth = await authenticateAndRateLimit({
      csrfToken,
      rateLimitPrefix: "docs",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const validationResult = parseActionInput({
      schema: UpdateDocSchema,
      data,
      warnMessage: "Invalid document update data",
      invalidDataMessage: "Invalid document data",
    });
    if (!validationResult.success) {
      return validationResult;
    }
    const validatedData = validationResult.data;

    const updateObj: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    assignDefinedField(
      updateObj,
      "encrypted_title",
      validatedData.encrypted_title
    );
    assignDefinedField(
      updateObj,
      "encrypted_docx",
      validatedData.encrypted_docx
    );

    const { error } = await supabase
      .from(DOCS_TABLE)
      .update(updateObj)
      .eq("id", validatedData.id)
      .eq("user_id", user.id);

    if (error) {
      logger.logUnexpectedError("Error updating document", error);
      return { success: false, error: "Failed to update document" };
    }

    revalidateDocsRoutes();
    return { success: true };
  } catch (error) {
    return unexpectedActionError("Unexpected error in updateDoc", error);
  }
}

/** Delete a vault document. */
export async function deleteDoc(
  id: string,
  csrfToken: string
): Promise<ActionResponse> {
  try {
    const auth = await authenticateAndRateLimit({
      csrfToken,
      rateLimitPrefix: "docs",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    if (!isUuidString(id)) {
      return { success: false, error: "Invalid document ID" };
    }

    const { error } = await supabase
      .from(DOCS_TABLE)
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      logger.logUnexpectedError("Error deleting document", error);
      return { success: false, error: "Failed to delete document" };
    }

    revalidateDocsRoutes();
    return { success: true };
  } catch (error) {
    return unexpectedActionError("Unexpected error in deleteDoc", error);
  }
}
