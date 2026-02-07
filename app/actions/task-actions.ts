"use server";

import "server-only";

import { z } from "zod";

import { requireCSRFToken } from "@/lib/csrf";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";

import type {
  ActionResponse,
  UnitRow,
  SpaceRow,
  ItemRow,
  EntityType,
  ReorderUpdate,
} from "@/lib/types";

// =============================================================================
// Input Validation Schemas
// =============================================================================

/**
 * Schema for encrypted data fields
 * Validates that the encrypted data is valid JSON with required fields
 */
const EncryptedDataSchema = z
  .string()
  .min(1)
  .max(100000) // 100KB max for encrypted data
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
    { message: "Invalid encrypted data format" }
  );

/** Schema for stage_id - accepts both UUIDs (custom stages) and default stage IDs */
const StageIdSchema = z
  .union([z.string().uuid(), z.string().startsWith("default-")])
  .nullable()
  .optional();

/** Schema for creating a Unit */
const CreateUnitSchema = z.object({
  encrypted_title: EncryptedDataSchema,
  encrypted_description: EncryptedDataSchema.nullable(),
  stage_id: StageIdSchema,
  sort_order: z.number().int().min(0).optional(),
});

/** Schema for updating a Unit */
const UpdateUnitSchema = z.object({
  id: z.string().uuid(),
  encrypted_title: EncryptedDataSchema.optional(),
  encrypted_description: EncryptedDataSchema.nullable().optional(),
  stage_id: StageIdSchema,
  sort_order: z.number().int().min(0).optional(),
});

/** Schema for creating a Space */
const CreateSpaceSchema = z.object({
  unit_id: z.string().uuid(),
  encrypted_title: EncryptedDataSchema,
  encrypted_description: EncryptedDataSchema.nullable(),
  stage_id: StageIdSchema,
  sort_order: z.number().int().min(0).optional(),
});

/** Schema for updating a Space */
const UpdateSpaceSchema = z.object({
  id: z.string().uuid(),
  encrypted_title: EncryptedDataSchema.optional(),
  encrypted_description: EncryptedDataSchema.nullable().optional(),
  stage_id: StageIdSchema,
  sort_order: z.number().int().min(0).optional(),
});

/** Priority validation: smallint 0–3 */
const PrioritySchema = z.number().int().min(0).max(3).optional();

/** Schema for label_id - accepts both UUIDs (custom labels) and default label IDs */
const LabelIdSchema = z
  .union([z.string().uuid(), z.string().startsWith("default-")])
  .nullable()
  .optional();

/** Schema for creating an Item */
const CreateItemSchema = z.object({
  space_id: z.string().uuid(),
  encrypted_title: EncryptedDataSchema,
  encrypted_description: EncryptedDataSchema.nullable(),
  stage_id: StageIdSchema,
  label_id: LabelIdSchema,
  priority: PrioritySchema,
  sort_order: z.number().int().min(0).optional(),
});

/** Schema for updating an Item */
const UpdateItemSchema = z.object({
  id: z.string().uuid(),
  encrypted_title: EncryptedDataSchema.optional(),
  encrypted_description: EncryptedDataSchema.nullable().optional(),
  stage_id: StageIdSchema,
  label_id: LabelIdSchema,
  priority: PrioritySchema,
  sort_order: z.number().int().min(0).optional(),
});

/** Schema for batch reorder updates */
const ReorderSchema = z.array(
  z.object({
    id: z.string().uuid(),
    sort_order: z.number().int().min(0),
    // Accept both UUIDs (custom stages) and default stage IDs (e.g., "default-item-backlog")
    stage_id: z
      .union([z.string().uuid(), z.string().startsWith("default-")])
      .nullable()
      .optional(),
  })
);

const EntityTypeSchema = z.enum(["unit", "space", "item"]);

// =============================================================================
// UNIT ACTIONS
// =============================================================================

/**
 * Create a new Unit
 * Receives pre-encrypted data from the client
 */
export async function createUnit(
  data: {
    encrypted_title: string;
    encrypted_description: string | null;
    stage_id?: string | null;
  },
  csrfToken: string
): Promise<ActionResponse<{ id: string }>> {
  try {
    // Validate CSRF token
    try {
      await requireCSRFToken(csrfToken);
    } catch {
      return {
        success: false,
        error: "Security validation failed. Please refresh and try again.",
      };
    }

    // Validate input
    const validationResult = CreateUnitSchema.safeParse(data);
    if (!validationResult.success) {
      logger.warn("Invalid unit data:", validationResult.error.format());
      return { success: false, error: "Invalid unit data" };
    }
    const validatedData = validationResult.data;

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    // Insert unit
    const { data: unit, error } = await supabase
      .from("units")
      .insert({
        user_id: user.id,
        encrypted_title: validatedData.encrypted_title,
        encrypted_description: validatedData.encrypted_description,
        stage_id: validatedData.stage_id ?? null,
      })
      .select("id")
      .single();

    if (error) {
      logger.error("Error creating unit:", error);
      return { success: false, error: "Failed to create unit" };
    }

    return { success: true, data: { id: unit.id } };
  } catch (error) {
    logger.error("Unexpected error in createUnit:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Get all Units for the current user
 * Returns encrypted data that must be decrypted client-side
 */
export async function getUnits(): Promise<ActionResponse<UnitRow[]>> {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    // Get units (RLS ensures only user's own units are returned)
    const { data: units, error } = await supabase
      .from("units")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Error getting units:", error);
      return { success: false, error: "Failed to get units" };
    }

    return { success: true, data: units as UnitRow[] };
  } catch (error) {
    logger.error("Unexpected error in getUnits:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Get a single Unit by ID
 */
export async function getUnit(id: string): Promise<ActionResponse<UnitRow>> {
  try {
    if (!z.string().uuid().safeParse(id).success) {
      return { success: false, error: "Invalid unit ID" };
    }

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    // Get unit (RLS ensures only user's own unit can be accessed)
    const { data: unit, error } = await supabase
      .from("units")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return { success: false, error: "Unit not found" };
      }
      logger.error("Error getting unit:", error);
      return { success: false, error: "Failed to get unit" };
    }

    return { success: true, data: unit as UnitRow };
  } catch (error) {
    logger.error("Unexpected error in getUnit:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Update a Unit
 */
export async function updateUnit(
  data: {
    id: string;
    encrypted_title?: string;
    encrypted_description?: string | null;
    stage_id?: string | null;
    sort_order?: number;
  },
  csrfToken: string
): Promise<ActionResponse> {
  try {
    // Validate CSRF token
    try {
      await requireCSRFToken(csrfToken);
    } catch {
      return {
        success: false,
        error: "Security validation failed. Please refresh and try again.",
      };
    }

    // Validate input
    const validationResult = UpdateUnitSchema.safeParse(data);
    if (!validationResult.success) {
      logger.warn("Invalid unit update data:", validationResult.error.format());
      return { success: false, error: "Invalid unit data" };
    }
    const validatedData = validationResult.data;

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    // Build update object (only include provided fields)
    const updateObj: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (validatedData.encrypted_title !== undefined) {
      updateObj.encrypted_title = validatedData.encrypted_title;
    }
    if (validatedData.encrypted_description !== undefined) {
      updateObj.encrypted_description = validatedData.encrypted_description;
    }
    if (validatedData.stage_id !== undefined) {
      updateObj.stage_id = validatedData.stage_id;
    }
    if (validatedData.sort_order !== undefined) {
      updateObj.sort_order = validatedData.sort_order;
    }

    // Update unit (RLS + explicit user_id check for defense-in-depth)
    const { error } = await supabase
      .from("units")
      .update(updateObj)
      .eq("id", validatedData.id)
      .eq("user_id", user.id);

    if (error) {
      logger.error("Error updating unit:", error);
      return { success: false, error: "Failed to update unit" };
    }

    return { success: true };
  } catch (error) {
    logger.error("Unexpected error in updateUnit:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Delete a Unit (cascades to all Spaces and Items)
 */
export async function deleteUnit(
  id: string,
  csrfToken: string
): Promise<ActionResponse> {
  try {
    // Validate CSRF token
    try {
      await requireCSRFToken(csrfToken);
    } catch {
      return {
        success: false,
        error: "Security validation failed. Please refresh and try again.",
      };
    }

    if (!z.string().uuid().safeParse(id).success) {
      return { success: false, error: "Invalid unit ID" };
    }

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    // Delete unit (RLS + explicit user_id check for defense-in-depth)
    // CASCADE will delete all associated Spaces and Items
    const { error } = await supabase
      .from("units")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      logger.error("Error deleting unit:", error);
      return { success: false, error: "Failed to delete unit" };
    }

    return { success: true };
  } catch (error) {
    logger.error("Unexpected error in deleteUnit:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// =============================================================================
// SPACE ACTIONS
// =============================================================================

/**
 * Create a new Space
 */
export async function createSpace(
  data: {
    unit_id: string;
    encrypted_title: string;
    encrypted_description: string | null;
    stage_id?: string | null;
  },
  csrfToken: string
): Promise<ActionResponse<{ id: string }>> {
  try {
    // Validate CSRF token
    try {
      await requireCSRFToken(csrfToken);
    } catch {
      return {
        success: false,
        error: "Security validation failed. Please refresh and try again.",
      };
    }

    // Validate input
    const validationResult = CreateSpaceSchema.safeParse(data);
    if (!validationResult.success) {
      logger.warn("Invalid space data:", validationResult.error.format());
      return { success: false, error: "Invalid space data" };
    }
    const validatedData = validationResult.data;

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify user owns the unit (RLS will also check this on insert)
    const { data: unit, error: unitError } = await supabase
      .from("units")
      .select("id")
      .eq("id", validatedData.unit_id)
      .single();

    if (unitError || !unit) {
      return { success: false, error: "Unit not found" };
    }

    // Insert space
    const { data: space, error } = await supabase
      .from("spaces")
      .insert({
        unit_id: validatedData.unit_id,
        user_id: user.id,
        encrypted_title: validatedData.encrypted_title,
        encrypted_description: validatedData.encrypted_description,
        stage_id: validatedData.stage_id ?? null,
      })
      .select("id")
      .single();

    if (error) {
      logger.error("Error creating space:", error);
      return { success: false, error: "Failed to create space" };
    }

    return { success: true, data: { id: space.id } };
  } catch (error) {
    logger.error("Unexpected error in createSpace:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Get all Spaces for a Unit
 */
export async function getSpaces(
  unitId: string
): Promise<ActionResponse<SpaceRow[]>> {
  try {
    if (!z.string().uuid().safeParse(unitId).success) {
      return { success: false, error: "Invalid unit ID" };
    }

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    // Get spaces (RLS ensures only user's own spaces are returned)
    const { data: spaces, error } = await supabase
      .from("spaces")
      .select("*")
      .eq("unit_id", unitId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Error getting spaces:", error);
      return { success: false, error: "Failed to get spaces" };
    }

    return { success: true, data: spaces as SpaceRow[] };
  } catch (error) {
    logger.error("Unexpected error in getSpaces:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Get a single Space by ID
 */
export async function getSpace(id: string): Promise<ActionResponse<SpaceRow>> {
  try {
    if (!z.string().uuid().safeParse(id).success) {
      return { success: false, error: "Invalid space ID" };
    }

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    // Get space
    const { data: space, error } = await supabase
      .from("spaces")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return { success: false, error: "Space not found" };
      }
      logger.error("Error getting space:", error);
      return { success: false, error: "Failed to get space" };
    }

    return { success: true, data: space as SpaceRow };
  } catch (error) {
    logger.error("Unexpected error in getSpace:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Update a Space
 */
export async function updateSpace(
  data: {
    id: string;
    encrypted_title?: string;
    encrypted_description?: string | null;
    stage_id?: string | null;
    sort_order?: number;
  },
  csrfToken: string
): Promise<ActionResponse> {
  try {
    // Validate CSRF token
    try {
      await requireCSRFToken(csrfToken);
    } catch {
      return {
        success: false,
        error: "Security validation failed. Please refresh and try again.",
      };
    }

    // Validate input
    const validationResult = UpdateSpaceSchema.safeParse(data);
    if (!validationResult.success) {
      logger.warn(
        "Invalid space update data:",
        validationResult.error.format()
      );
      return { success: false, error: "Invalid space data" };
    }
    const validatedData = validationResult.data;

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    // Build update object
    const updateObj: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (validatedData.encrypted_title !== undefined) {
      updateObj.encrypted_title = validatedData.encrypted_title;
    }
    if (validatedData.encrypted_description !== undefined) {
      updateObj.encrypted_description = validatedData.encrypted_description;
    }
    if (validatedData.stage_id !== undefined) {
      updateObj.stage_id = validatedData.stage_id;
    }
    if (validatedData.sort_order !== undefined) {
      updateObj.sort_order = validatedData.sort_order;
    }

    // Update space (RLS + explicit user_id check for defense-in-depth)
    const { error } = await supabase
      .from("spaces")
      .update(updateObj)
      .eq("id", validatedData.id)
      .eq("user_id", user.id);

    if (error) {
      logger.error("Error updating space:", error);
      return { success: false, error: "Failed to update space" };
    }

    return { success: true };
  } catch (error) {
    logger.error("Unexpected error in updateSpace:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Delete a Space (cascades to all Items)
 */
export async function deleteSpace(
  id: string,
  csrfToken: string
): Promise<ActionResponse> {
  try {
    // Validate CSRF token
    try {
      await requireCSRFToken(csrfToken);
    } catch {
      return {
        success: false,
        error: "Security validation failed. Please refresh and try again.",
      };
    }

    if (!z.string().uuid().safeParse(id).success) {
      return { success: false, error: "Invalid space ID" };
    }

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    // Delete space (RLS + explicit user_id check for defense-in-depth)
    const { error } = await supabase
      .from("spaces")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      logger.error("Error deleting space:", error);
      return { success: false, error: "Failed to delete space" };
    }

    return { success: true };
  } catch (error) {
    logger.error("Unexpected error in deleteSpace:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// =============================================================================
// ITEM ACTIONS
// =============================================================================

/**
 * Create a new Item
 */
export async function createItem(
  data: {
    space_id: string;
    encrypted_title: string;
    encrypted_description: string | null;
    stage_id?: string | null;
    label_id?: string | null;
    priority?: number;
  },
  csrfToken: string
): Promise<ActionResponse<{ id: string }>> {
  try {
    // Validate CSRF token
    try {
      await requireCSRFToken(csrfToken);
    } catch {
      return {
        success: false,
        error: "Security validation failed. Please refresh and try again.",
      };
    }

    // Validate input
    const validationResult = CreateItemSchema.safeParse(data);
    if (!validationResult.success) {
      logger.warn("Invalid item data:", validationResult.error.format());
      return { success: false, error: "Invalid item data" };
    }
    const validatedData = validationResult.data;

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify user owns the space
    const { data: space, error: spaceError } = await supabase
      .from("spaces")
      .select("id")
      .eq("id", validatedData.space_id)
      .single();

    if (spaceError || !space) {
      return { success: false, error: "Space not found" };
    }

    // Insert item
    const insertObj: Record<string, unknown> = {
      space_id: validatedData.space_id,
      user_id: user.id,
      encrypted_title: validatedData.encrypted_title,
      encrypted_description: validatedData.encrypted_description,
      stage_id: validatedData.stage_id ?? null,
      label_id: validatedData.label_id ?? null,
    };
    if (validatedData.priority !== undefined) {
      insertObj.priority = validatedData.priority;
    }

    const { data: item, error } = await supabase
      .from("items")
      .insert(insertObj)
      .select("id")
      .single();

    if (error) {
      logger.error("Error creating item:", error);
      return { success: false, error: "Failed to create item" };
    }

    return { success: true, data: { id: item.id } };
  } catch (error) {
    logger.error("Unexpected error in createItem:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Get all Items for a Space
 */
export async function getItems(
  spaceId: string
): Promise<ActionResponse<ItemRow[]>> {
  try {
    if (!z.string().uuid().safeParse(spaceId).success) {
      return { success: false, error: "Invalid space ID" };
    }

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    // Get items
    const { data: items, error } = await supabase
      .from("items")
      .select("*")
      .eq("space_id", spaceId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Error getting items:", error);
      return { success: false, error: "Failed to get items" };
    }

    return { success: true, data: items as ItemRow[] };
  } catch (error) {
    logger.error("Unexpected error in getItems:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Get a single Item by ID
 */
export async function getItem(id: string): Promise<ActionResponse<ItemRow>> {
  try {
    if (!z.string().uuid().safeParse(id).success) {
      return { success: false, error: "Invalid item ID" };
    }

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    // Get item
    const { data: item, error } = await supabase
      .from("items")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return { success: false, error: "Item not found" };
      }
      logger.error("Error getting item:", error);
      return { success: false, error: "Failed to get item" };
    }

    return { success: true, data: item as ItemRow };
  } catch (error) {
    logger.error("Unexpected error in getItem:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Update an Item
 */
export async function updateItem(
  data: {
    id: string;
    encrypted_title?: string;
    encrypted_description?: string | null;
    stage_id?: string | null;
    label_id?: string | null;
    priority?: number;
    sort_order?: number;
  },
  csrfToken: string
): Promise<ActionResponse> {
  try {
    // Validate CSRF token
    try {
      await requireCSRFToken(csrfToken);
    } catch {
      return {
        success: false,
        error: "Security validation failed. Please refresh and try again.",
      };
    }

    // Validate input
    const validationResult = UpdateItemSchema.safeParse(data);
    if (!validationResult.success) {
      logger.warn("Invalid item update data:", validationResult.error.format());
      return { success: false, error: "Invalid item data" };
    }
    const validatedData = validationResult.data;

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    // Build update object
    const updateObj: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (validatedData.encrypted_title !== undefined) {
      updateObj.encrypted_title = validatedData.encrypted_title;
    }
    if (validatedData.encrypted_description !== undefined) {
      updateObj.encrypted_description = validatedData.encrypted_description;
    }
    if (validatedData.stage_id !== undefined) {
      updateObj.stage_id = validatedData.stage_id;
    }
    if (validatedData.label_id !== undefined) {
      updateObj.label_id = validatedData.label_id;
    }
    if (validatedData.priority !== undefined) {
      updateObj.priority = validatedData.priority;
    }
    if (validatedData.sort_order !== undefined) {
      updateObj.sort_order = validatedData.sort_order;
    }

    // Update item (RLS + explicit user_id check for defense-in-depth)
    const { error } = await supabase
      .from("items")
      .update(updateObj)
      .eq("id", validatedData.id)
      .eq("user_id", user.id);

    if (error) {
      logger.error("Error updating item:", error);
      return { success: false, error: "Failed to update item" };
    }

    return { success: true };
  } catch (error) {
    logger.error("Unexpected error in updateItem:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Delete an Item
 */
export async function deleteItem(
  id: string,
  csrfToken: string
): Promise<ActionResponse> {
  try {
    // Validate CSRF token
    try {
      await requireCSRFToken(csrfToken);
    } catch {
      return {
        success: false,
        error: "Security validation failed. Please refresh and try again.",
      };
    }

    if (!z.string().uuid().safeParse(id).success) {
      return { success: false, error: "Invalid item ID" };
    }

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    // Delete item (RLS + explicit user_id check for defense-in-depth)
    const { error } = await supabase
      .from("items")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      logger.error("Error deleting item:", error);
      return { success: false, error: "Failed to delete item" };
    }

    return { success: true };
  } catch (error) {
    logger.error("Unexpected error in deleteItem:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// =============================================================================
// BATCH REORDER ACTION (for drag-and-drop)
// =============================================================================

/**
 * Batch update sort_order (and optionally stage_id) for multiple entities
 * Used during drag-and-drop reordering
 */
export async function reorderEntities(
  entityType: EntityType,
  updates: ReorderUpdate[],
  csrfToken: string
): Promise<ActionResponse> {
  try {
    // Validate CSRF token
    try {
      await requireCSRFToken(csrfToken);
    } catch {
      return {
        success: false,
        error: "Security validation failed. Please refresh and try again.",
      };
    }

    const typeResult = EntityTypeSchema.safeParse(entityType);
    if (!typeResult.success) {
      return { success: false, error: "Invalid entity type" };
    }

    const validationResult = ReorderSchema.safeParse(updates);
    if (!validationResult.success) {
      logger.warn("Invalid reorder data:", validationResult.error.format());
      return { success: false, error: "Invalid reorder data" };
    }
    const validatedUpdates = validationResult.data;

    if (validatedUpdates.length === 0) {
      return { success: true };
    }

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    const tableName =
      entityType === "unit"
        ? "units"
        : entityType === "space"
          ? "spaces"
          : "items";

    // Batch update each entity's sort_order and optionally stage_id
    for (const update of validatedUpdates) {
      const updateObj: Record<string, unknown> = {
        sort_order: update.sort_order,
        updated_at: new Date().toISOString(),
      };
      if (update.stage_id !== undefined) {
        updateObj.stage_id = update.stage_id;
      }

      const { error } = await supabase
        .from(tableName)
        .update(updateObj)
        .eq("id", update.id)
        .eq("user_id", user.id);

      if (error) {
        logger.error(`Error reordering ${entityType}:`, error);
        return { success: false, error: `Failed to reorder ${entityType}s` };
      }
    }

    return { success: true };
  } catch (error) {
    logger.error("Unexpected error in reorderEntities:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// =============================================================================
// CHILD COUNT ACTIONS (for displaying counts in entity lists)
// =============================================================================

/**
 * Get the number of spaces per unit for the current user.
 * Returns a map of unit_id -> space count.
 */
export async function getSpaceCounts(): Promise<
  ActionResponse<Record<string, number>>
> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    // Get all spaces for this user, selecting only the unit_id
    const { data: spaces, error } = await supabase
      .from("spaces")
      .select("unit_id");

    if (error) {
      logger.error("Error getting space counts:", error);
      return { success: false, error: "Failed to get space counts" };
    }

    // Aggregate counts by unit_id
    const counts: Record<string, number> = {};
    for (const space of spaces ?? []) {
      counts[space.unit_id] = (counts[space.unit_id] ?? 0) + 1;
    }

    return { success: true, data: counts };
  } catch (error) {
    logger.error("Unexpected error in getSpaceCounts:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Get the number of items per space for a given unit.
 * Returns a map of space_id -> item count.
 */
export async function getItemCounts(
  unitId: string
): Promise<ActionResponse<Record<string, number>>> {
  try {
    if (!z.string().uuid().safeParse(unitId).success) {
      return { success: false, error: "Invalid unit ID" };
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    // First get the space IDs for this unit
    const { data: spaces, error: spacesError } = await supabase
      .from("spaces")
      .select("id")
      .eq("unit_id", unitId);

    if (spacesError) {
      logger.error("Error getting spaces for item counts:", spacesError);
      return { success: false, error: "Failed to get item counts" };
    }

    const spaceIds = (spaces ?? []).map((s) => s.id);
    if (spaceIds.length === 0) {
      return { success: true, data: {} };
    }

    // Get all items for these spaces, selecting only the space_id
    const { data: items, error: itemsError } = await supabase
      .from("items")
      .select("space_id")
      .in("space_id", spaceIds);

    if (itemsError) {
      logger.error("Error getting item counts:", itemsError);
      return { success: false, error: "Failed to get item counts" };
    }

    // Aggregate counts by space_id
    const counts: Record<string, number> = {};
    for (const item of items ?? []) {
      counts[item.space_id] = (counts[item.space_id] ?? 0) + 1;
    }

    return { success: true, data: counts };
  } catch (error) {
    logger.error("Unexpected error in getItemCounts:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
