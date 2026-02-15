"use server";

import "server-only";

import { z } from "zod";

import { authenticateAndRateLimit } from "@/lib/action-helpers";
import { logger } from "@/lib/logger";
import { EncryptedDataSchema } from "@/lib/validation-schemas";

import type {
  ActionResponse,
  CategoryConfigRow,
  CategoryRow,
  CategoryAssignment,
} from "@/lib/types";

// =============================================================================
// Input Validation Schemas
// =============================================================================

const HexColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/)
  .nullable()
  .optional();

// Lucide icon name validation (lowercase with hyphens, e.g., "check-circle")
const IconNameSchema = z
  .string()
  .regex(/^[a-z][a-z0-9-]*$/)
  .max(50)
  .optional();

const CreateCategoryConfigSchema = z.object({
  id: z.string().uuid(),
  encrypted_name: EncryptedDataSchema,
});

const UpdateCategoryConfigSchema = z.object({
  id: z.string().uuid(),
  encrypted_name: EncryptedDataSchema.optional(),
});

const CreateCategorySchema = z.object({
  id: z.string().uuid(),
  config_id: z.string().uuid(),
  encrypted_name: EncryptedDataSchema,
  color: HexColorSchema,
  icon: IconNameSchema,
  sort_order: z.number().int().min(0).default(0),
  default_rows_shown: z.number().int().min(0).max(1000).default(20),
});

const UpdateCategorySchema = z.object({
  id: z.string().uuid(),
  encrypted_name: EncryptedDataSchema.optional(),
  color: HexColorSchema,
  icon: IconNameSchema,
  sort_order: z.number().int().min(0).optional(),
  default_rows_shown: z.number().int().min(0).max(1000).optional(),
});

const ReorderCategoriesSchema = z
  .array(
    z.object({
      id: z.string().uuid(),
      sort_order: z.number().int().min(0),
    })
  )
  .max(50, "Too many categories to reorder");

// =============================================================================
// CATEGORY CONFIG ACTIONS
// =============================================================================

/**
 * Create a new CategoryConfig
 */
export async function createCategoryConfig(
  data: { id: string; encrypted_name: string },
  csrfToken: string
): Promise<ActionResponse<{ id: string }>> {
  try {
    const auth = await authenticateAndRateLimit({
      csrfToken,
      rateLimitPrefix: "categories",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const validationResult = CreateCategoryConfigSchema.safeParse(data);
    if (!validationResult.success) {
      logger.warn(
        "Invalid category config data:",
        validationResult.error.format()
      );
      return { success: false, error: "Invalid category config data" };
    }
    const validatedData = validationResult.data;

    const { data: config, error } = await supabase
      .from("category_configs")
      .insert({
        id: validatedData.id,
        user_id: user.id,
        encrypted_name: validatedData.encrypted_name,
      })
      .select("id")
      .single();

    if (error || !config) {
      logger.error("Error creating category config:", error);
      return { success: false, error: "Failed to create category config" };
    }

    return { success: true, data: { id: config.id } };
  } catch (error) {
    logger.error("Unexpected error in createCategoryConfig:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Get all CategoryConfigs for the current user
 */
export async function getCategoryConfigs(): Promise<
  ActionResponse<CategoryConfigRow[]>
> {
  try {
    const auth = await authenticateAndRateLimit({
      rateLimitPrefix: "categories",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const { data: configs, error } = await supabase
      .from("category_configs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .returns<CategoryConfigRow[]>();

    if (error) {
      logger.error("Error getting category configs:", error);
      return { success: false, error: "Failed to get category configs" };
    }

    return { success: true, data: configs ?? [] };
  } catch (error) {
    logger.error("Unexpected error in getCategoryConfigs:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Update a CategoryConfig
 */
export async function updateCategoryConfig(
  data: { id: string; encrypted_name?: string },
  csrfToken: string
): Promise<ActionResponse> {
  try {
    const auth = await authenticateAndRateLimit({
      csrfToken,
      rateLimitPrefix: "categories",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const validationResult = UpdateCategoryConfigSchema.safeParse(data);
    if (!validationResult.success) {
      return { success: false, error: "Invalid category config data" };
    }
    const validatedData = validationResult.data;

    const updateObj: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (validatedData.encrypted_name !== undefined) {
      updateObj.encrypted_name = validatedData.encrypted_name;
    }

    const { error } = await supabase
      .from("category_configs")
      .update(updateObj)
      .eq("id", validatedData.id)
      .eq("user_id", user.id);

    if (error) {
      logger.error("Error updating category config:", error);
      return { success: false, error: "Failed to update category config" };
    }

    return { success: true };
  } catch (error) {
    logger.error("Unexpected error in updateCategoryConfig:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Delete a CategoryConfig (cascades to categories and assignments)
 */
export async function deleteCategoryConfig(
  id: string,
  csrfToken: string
): Promise<ActionResponse> {
  try {
    const auth = await authenticateAndRateLimit({
      csrfToken,
      rateLimitPrefix: "categories",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    if (!z.string().uuid().safeParse(id).success) {
      return { success: false, error: "Invalid category config ID" };
    }

    const { error } = await supabase
      .from("category_configs")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      logger.error("Error deleting category config:", error);
      return { success: false, error: "Failed to delete category config" };
    }

    return { success: true };
  } catch (error) {
    logger.error("Unexpected error in deleteCategoryConfig:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// =============================================================================
// CATEGORY ACTIONS
// =============================================================================

/**
 * Create a new Category within a config
 */
export async function createCategory(
  data: {
    id: string;
    config_id: string;
    encrypted_name: string;
    color?: string | null;
    icon?: string;
    sort_order: number;
    default_rows_shown?: number;
  },
  csrfToken: string
): Promise<ActionResponse<{ id: string }>> {
  try {
    const auth = await authenticateAndRateLimit({
      csrfToken,
      rateLimitPrefix: "categories",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const validationResult = CreateCategorySchema.safeParse(data);
    if (!validationResult.success) {
      logger.warn("Invalid category data:", validationResult.error.format());
      return { success: false, error: "Invalid category data" };
    }
    const validatedData = validationResult.data;

    // Verify user owns the config (defense-in-depth: explicit user_id check)
    const { data: config, error: configError } = await supabase
      .from("category_configs")
      .select("id")
      .eq("id", validatedData.config_id)
      .eq("user_id", user.id)
      .single();

    if (configError || !config) {
      return { success: false, error: "Category config not found" };
    }

    const { data: category, error } = await supabase
      .from("categories")
      .insert({
        id: validatedData.id,
        config_id: validatedData.config_id,
        user_id: user.id,
        encrypted_name: validatedData.encrypted_name,
        color: validatedData.color ?? null,
        icon: validatedData.icon ?? "circle",
        sort_order: validatedData.sort_order,
        default_rows_shown: validatedData.default_rows_shown,
      })
      .select("id")
      .single();

    if (error || !category) {
      logger.error("Error creating category:", error);
      return { success: false, error: "Failed to create category" };
    }

    return { success: true, data: { id: category.id } };
  } catch (error) {
    logger.error("Unexpected error in createCategory:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Get all Categories for a config
 */
export async function getCategories(
  configId: string
): Promise<ActionResponse<CategoryRow[]>> {
  try {
    const auth = await authenticateAndRateLimit({
      rateLimitPrefix: "categories",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    if (!z.string().uuid().safeParse(configId).success) {
      return { success: false, error: "Invalid config ID" };
    }

    const { data: categories, error } = await supabase
      .from("categories")
      .select("*")
      .eq("config_id", configId)
      .eq("user_id", user.id)
      .order("sort_order", { ascending: true })
      .returns<CategoryRow[]>();

    if (error) {
      logger.error("Error getting categories:", error);
      return { success: false, error: "Failed to get categories" };
    }

    return { success: true, data: categories ?? [] };
  } catch (error) {
    logger.error("Unexpected error in getCategories:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Update a Category
 */
export async function updateCategory(
  data: {
    id: string;
    encrypted_name?: string;
    color?: string | null;
    icon?: string;
    sort_order?: number;
    default_rows_shown?: number;
  },
  csrfToken: string
): Promise<ActionResponse> {
  try {
    const auth = await authenticateAndRateLimit({
      csrfToken,
      rateLimitPrefix: "categories",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const validationResult = UpdateCategorySchema.safeParse(data);
    if (!validationResult.success) {
      return { success: false, error: "Invalid category data" };
    }
    const validatedData = validationResult.data;

    const updateObj: Record<string, unknown> = {};
    if (validatedData.encrypted_name !== undefined) {
      updateObj.encrypted_name = validatedData.encrypted_name;
    }
    if (validatedData.color !== undefined) {
      updateObj.color = validatedData.color;
    }
    if (validatedData.icon !== undefined) {
      updateObj.icon = validatedData.icon;
    }
    if (validatedData.sort_order !== undefined) {
      updateObj.sort_order = validatedData.sort_order;
    }
    if (validatedData.default_rows_shown !== undefined) {
      updateObj.default_rows_shown = validatedData.default_rows_shown;
    }

    const { error } = await supabase
      .from("categories")
      .update(updateObj)
      .eq("id", validatedData.id)
      .eq("user_id", user.id);

    if (error) {
      logger.error("Error updating category:", error);
      return { success: false, error: "Failed to update category" };
    }

    return { success: true };
  } catch (error) {
    logger.error("Unexpected error in updateCategory:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Delete a Category
 */
export async function deleteCategory(
  id: string,
  csrfToken: string
): Promise<ActionResponse> {
  try {
    const auth = await authenticateAndRateLimit({
      csrfToken,
      rateLimitPrefix: "categories",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    if (!z.string().uuid().safeParse(id).success) {
      return { success: false, error: "Invalid category ID" };
    }

    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      logger.error("Error deleting category:", error);
      return { success: false, error: "Failed to delete category" };
    }

    return { success: true };
  } catch (error) {
    logger.error("Unexpected error in deleteCategory:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Batch reorder categories within a config
 */
export async function reorderCategories(
  updates: { id: string; sort_order: number }[],
  csrfToken: string
): Promise<ActionResponse> {
  try {
    const auth = await authenticateAndRateLimit({
      csrfToken,
      rateLimitPrefix: "categories",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const validationResult = ReorderCategoriesSchema.safeParse(updates);
    if (!validationResult.success) {
      return { success: false, error: "Invalid reorder data" };
    }
    const validatedUpdates = validationResult.data;

    // Update all categories in parallel for better performance
    const results = await Promise.all(
      validatedUpdates.map((update) =>
        supabase
          .from("categories")
          .update({ sort_order: update.sort_order })
          .eq("id", update.id)
          .eq("user_id", user.id)
      )
    );

    const failedResult = results.find((r) => r.error);
    if (failedResult?.error) {
      logger.error("Error reordering category:", failedResult.error);
      return { success: false, error: "Failed to reorder categories" };
    }

    return { success: true };
  } catch (error) {
    logger.error("Unexpected error in reorderCategories:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// =============================================================================
// CATEGORY ASSIGNMENT ACTIONS
// =============================================================================

/**
 * Get the category assignment for the contacts list
 */
export async function getCategoryAssignment(): Promise<
  ActionResponse<CategoryAssignment | null>
> {
  try {
    const auth = await authenticateAndRateLimit({
      rateLimitPrefix: "categories",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const { data: assignments, error } = await supabase
      .from("category_assignments")
      .select("*")
      .eq("user_id", user.id)
      .limit(1);

    if (error) {
      logger.error("Error getting category assignment:", error);
      return { success: false, error: "Failed to get category assignment" };
    }

    const first = assignments?.[0];
    const assignment = first ?? null;

    return { success: true, data: assignment };
  } catch (error) {
    logger.error("Unexpected error in getCategoryAssignment:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Set (upsert) the category assignment for the contacts list
 */
export async function setCategoryAssignment(
  configId: string,
  csrfToken: string
): Promise<ActionResponse<{ id: string }>> {
  try {
    const auth = await authenticateAndRateLimit({
      csrfToken,
      rateLimitPrefix: "categories",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    if (!z.string().uuid().safeParse(configId).success) {
      return { success: false, error: "Invalid config ID" };
    }

    // Verify user owns the config (defense-in-depth: prevent assigning another user's config)
    const { data: config, error: configError } = await supabase
      .from("category_configs")
      .select("id")
      .eq("id", configId)
      .eq("user_id", user.id)
      .single();

    if (configError || !config) {
      return { success: false, error: "Category config not found" };
    }

    // Upsert: try to find existing assignment first
    const { data: existing } = await supabase
      .from("category_assignments")
      .select("id")
      .eq("user_id", user.id)
      .limit(1);

    const existingFirst = existing?.[0];
    if (existingFirst) {
      // Update existing assignment
      const existingId = existingFirst.id;
      const { error } = await supabase
        .from("category_assignments")
        .update({ config_id: configId })
        .eq("id", existingId);

      if (error) {
        logger.error("Error updating category assignment:", error);
        return {
          success: false,
          error: "Failed to update category assignment",
        };
      }

      return { success: true, data: { id: existingId } };
    } else {
      // Insert new assignment
      const { data: assignment, error } = await supabase
        .from("category_assignments")
        .insert({
          user_id: user.id,
          config_id: configId,
        })
        .select("id")
        .single();

      if (error || !assignment) {
        logger.error("Error creating category assignment:", error);
        return {
          success: false,
          error: "Failed to create category assignment",
        };
      }

      return { success: true, data: { id: assignment.id } };
    }
  } catch (error) {
    logger.error("Unexpected error in setCategoryAssignment:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Remove the category assignment for the contacts list
 */
export async function removeCategoryAssignment(
  csrfToken: string
): Promise<ActionResponse> {
  try {
    const auth = await authenticateAndRateLimit({
      csrfToken,
      rateLimitPrefix: "categories",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const { error } = await supabase
      .from("category_assignments")
      .delete()
      .eq("user_id", user.id);

    if (error) {
      logger.error("Error removing category assignment:", error);
      return { success: false, error: "Failed to remove category assignment" };
    }

    return { success: true };
  } catch (error) {
    logger.error("Unexpected error in removeCategoryAssignment:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
