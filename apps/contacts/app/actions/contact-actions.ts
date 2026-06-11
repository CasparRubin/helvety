"use server";

import "server-only";

import { authenticateAndRateLimit } from "@helvety/shared/action-helpers";
import { ACTION_LIMITS } from "@helvety/shared/constants";
import { ENCRYPTED_PREFETCH_COLUMNS } from "@helvety/shared/encrypted-prefetch-api";
import {
  assignDefinedField,
  fetchOwnedEncryptedExport,
  logEncryptedExportRequested,
  mapReorderOwnedEntitiesFailure,
  reorderOwnedEntities,
} from "@helvety/shared/entity-action-primitives";
import { logger } from "@helvety/shared/logger";
import {
  parseActionInput,
  unexpectedActionError,
} from "@helvety/shared/server-action-primitives";
import { isUuidString } from "@helvety/shared/uuid-string";
import { EncryptedDataSchema } from "@helvety/shared/validation/encrypted-data";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  ALLOWED_CATEGORY_IDS,
  DEFAULT_CONTACT_CATEGORY_ID,
} from "@/lib/config/default-categories";
import { RATE_LIMITS } from "@/lib/rate-limit";

import type { ActionResponse, ContactRow, ReorderUpdate } from "@/lib/types";

/** Revalidate the contacts list route after structural contact mutations. */
function revalidateContactRoutes(contactId?: string): void {
  revalidatePath("/contacts");
  void contactId;
}

const CategoryIdSchema = z.enum(ALLOWED_CATEGORY_IDS);
const CONTACTS_TABLE = "contacts" as const;

// =============================================================================
// Input Validation Schemas
// =============================================================================

/** Schema for creating a Contact */
const CreateContactSchema = z
  .object({
    id: z.string().uuid(),
    encrypted_first_name: EncryptedDataSchema,
    encrypted_last_name: EncryptedDataSchema,
    encrypted_description: EncryptedDataSchema.nullable(),
    encrypted_email: EncryptedDataSchema.nullable(),
    encrypted_phone: EncryptedDataSchema.nullable(),
    encrypted_birthday: EncryptedDataSchema.nullable(),
    encrypted_notes: EncryptedDataSchema.nullable(),
    category_id: CategoryIdSchema.optional(),
    sort_order: z.number().int().min(0).optional(),
  })
  .strict();

/** Schema for updating a Contact */
const UpdateContactSchema = z
  .object({
    id: z.string().uuid(),
    encrypted_first_name: EncryptedDataSchema.optional(),
    encrypted_last_name: EncryptedDataSchema.optional(),
    encrypted_description: EncryptedDataSchema.nullable().optional(),
    encrypted_email: EncryptedDataSchema.nullable().optional(),
    encrypted_phone: EncryptedDataSchema.nullable().optional(),
    encrypted_birthday: EncryptedDataSchema.nullable().optional(),
    encrypted_notes: EncryptedDataSchema.nullable().optional(),
    category_id: CategoryIdSchema.optional(),
    sort_order: z.number().int().min(0).optional(),
  })
  .strict();

/** Schema for batch reorder updates (capped to prevent DoS via unbounded parallel queries) */
const ReorderSchema = z
  .array(
    z.object({
      id: z.string().uuid(),
      sort_order: z.number().int().min(0),
      category_id: CategoryIdSchema.optional(),
    })
  )
  .max(
    ACTION_LIMITS.MAX_REORDER_ITEMS,
    `Too many items to reorder (max ${ACTION_LIMITS.MAX_REORDER_ITEMS})`
  );

// =============================================================================
// CONTACT ACTIONS
// =============================================================================

/**
 * Create a new Contact
 * Receives pre-encrypted data from the client
 */
export async function createContact(
  data: {
    id: string;
    encrypted_first_name: string;
    encrypted_last_name: string;
    encrypted_description: string | null;
    encrypted_email: string | null;
    encrypted_phone: string | null;
    encrypted_birthday: string | null;
    encrypted_notes: string | null;
    category_id?: string;
  },
  csrfToken: string
): Promise<ActionResponse<{ id: string }>> {
  try {
    const auth = await authenticateAndRateLimit({
      csrfToken,
      rateLimitPrefix: "contacts",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    // Validate input
    const validationResult = parseActionInput({
      schema: CreateContactSchema,
      data,
      warnMessage: "Invalid contact data",
      invalidDataMessage: "Invalid contact data",
    });
    if (!validationResult.success) {
      return validationResult;
    }
    const validatedData = validationResult.data;

    // Insert contact
    const { data: contact, error } = await supabase
      .from(CONTACTS_TABLE)
      .insert({
        id: validatedData.id,
        user_id: user.id,
        encrypted_first_name: validatedData.encrypted_first_name,
        encrypted_last_name: validatedData.encrypted_last_name,
        encrypted_description: validatedData.encrypted_description,
        encrypted_email: validatedData.encrypted_email,
        encrypted_phone: validatedData.encrypted_phone,
        encrypted_birthday: validatedData.encrypted_birthday,
        encrypted_notes: validatedData.encrypted_notes,
        category_id: validatedData.category_id ?? DEFAULT_CONTACT_CATEGORY_ID,
      })
      .select("id")
      .single();

    if (error || !contact) {
      logger.logUnexpectedError("Error creating contact", error);
      return { success: false, error: "Failed to create contact" };
    }

    revalidateContactRoutes();
    return { success: true, data: { id: contact.id } };
  } catch (error) {
    return unexpectedActionError("Unexpected error in createContact", error);
  }
}

/**
 * Update a Contact
 */
export async function updateContact(
  data: {
    id: string;
    encrypted_first_name?: string;
    encrypted_last_name?: string;
    encrypted_description?: string | null;
    encrypted_email?: string | null;
    encrypted_phone?: string | null;
    encrypted_birthday?: string | null;
    encrypted_notes?: string | null;
    category_id?: string;
    sort_order?: number;
  },
  csrfToken: string
): Promise<ActionResponse> {
  try {
    const auth = await authenticateAndRateLimit({
      csrfToken,
      rateLimitPrefix: "contacts",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    // Validate input
    const validationResult = parseActionInput({
      schema: UpdateContactSchema,
      data,
      warnMessage: "Invalid contact update data",
      invalidDataMessage: "Invalid contact data",
    });
    if (!validationResult.success) {
      return validationResult;
    }
    const validatedData = validationResult.data;

    // Build update object (only include provided fields)
    const updateObj: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    assignDefinedField(
      updateObj,
      "encrypted_first_name",
      validatedData.encrypted_first_name
    );
    assignDefinedField(
      updateObj,
      "encrypted_last_name",
      validatedData.encrypted_last_name
    );
    assignDefinedField(
      updateObj,
      "encrypted_description",
      validatedData.encrypted_description
    );
    assignDefinedField(
      updateObj,
      "encrypted_email",
      validatedData.encrypted_email
    );
    assignDefinedField(
      updateObj,
      "encrypted_phone",
      validatedData.encrypted_phone
    );
    assignDefinedField(
      updateObj,
      "encrypted_birthday",
      validatedData.encrypted_birthday
    );
    assignDefinedField(
      updateObj,
      "encrypted_notes",
      validatedData.encrypted_notes
    );
    assignDefinedField(updateObj, "category_id", validatedData.category_id);
    assignDefinedField(updateObj, "sort_order", validatedData.sort_order);

    // Update contact (RLS + explicit user_id check for defense-in-depth)
    const { error } = await supabase
      .from(CONTACTS_TABLE)
      .update(updateObj)
      .eq("id", validatedData.id)
      .eq("user_id", user.id);

    if (error) {
      logger.logUnexpectedError("Error updating contact", error);
      return { success: false, error: "Failed to update contact" };
    }

    revalidateContactRoutes(validatedData.id);
    return { success: true };
  } catch (error) {
    return unexpectedActionError("Unexpected error in updateContact", error);
  }
}

/**
 * Delete a Contact
 */
export async function deleteContact(
  id: string,
  csrfToken: string
): Promise<ActionResponse> {
  try {
    const auth = await authenticateAndRateLimit({
      csrfToken,
      rateLimitPrefix: "contacts",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    if (!isUuidString(id)) {
      return { success: false, error: "Invalid contact ID" };
    }

    // Delete contact (RLS + explicit user_id check for defense-in-depth)
    const { error } = await supabase
      .from(CONTACTS_TABLE)
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      logger.logUnexpectedError("Error deleting contact", error);
      return { success: false, error: "Failed to delete contact" };
    }

    revalidateContactRoutes(id);
    return { success: true };
  } catch (error) {
    return unexpectedActionError("Unexpected error in deleteContact", error);
  }
}

/**
 * Batch update sort_order for multiple contacts
 * Used during drag-and-drop reordering
 */
export async function reorderContacts(
  updates: ReorderUpdate[],
  csrfToken: string
): Promise<ActionResponse> {
  try {
    const auth = await authenticateAndRateLimit({
      csrfToken,
      rateLimitPrefix: "contacts",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

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
      tableName: CONTACTS_TABLE,
      updates: validatedUpdates,
      scope: "Error validating contact reorder scope",
      failureMessage: "Failed to reorder contacts",
      invalidScopeMessage: "Invalid contact reorder scope",
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
    const reorderFailure = mapReorderOwnedEntitiesFailure(
      "contact",
      reorderResult,
      "Error reordering contact"
    );
    if (reorderFailure) {
      return reorderFailure;
    }

    revalidateContactRoutes();
    return { success: true };
  } catch (error) {
    return unexpectedActionError("Unexpected error in reorderContacts", error);
  }
}

// =============================================================================
// DATA EXPORT
// =============================================================================

/**
 * Fetch all encrypted contact data for export.
 * Returns all contacts as encrypted rows.
 * The client is responsible for decrypting the data using the user's
 * encryption key before presenting or saving the export.
 *
 * Security: read-only server action (no CSRF token); requires a session and uses
 * `readRateLimitConfig: RATE_LIMITS.EXPORT` for per-user throttling.
 *
 * Export format and legal context are documented in the product legal pages.
 */
export async function getAllContactDataForExport(): Promise<
  ActionResponse<ContactRow[]>
> {
  try {
    const auth = await authenticateAndRateLimit({
      rateLimitPrefix: "export",
      readRateLimitConfig: RATE_LIMITS.EXPORT,
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const exportResult = await fetchOwnedEncryptedExport<ContactRow>({
      supabase,
      userId: user.id,
      tableName: CONTACTS_TABLE,
      selectColumns: ENCRYPTED_PREFETCH_COLUMNS.contacts,
      logScope: "Error fetching contact data for export",
      loadErrorMessage: "Failed to load contact data",
    });
    if (!exportResult.success) {
      return { success: false, error: exportResult.error };
    }

    logEncryptedExportRequested("contacts", user.id);

    return { success: true, data: exportResult.rows };
  } catch (error) {
    return unexpectedActionError(
      "Unexpected error in getAllContactDataForExport",
      error
    );
  }
}
