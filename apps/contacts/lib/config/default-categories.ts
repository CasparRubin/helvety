/**
 * Fixed category catalog for Contacts.
 * Categories are immutable and defined in code.
 */

// =============================================================================
// Types for Default Category Configs
// =============================================================================

/**
 * Represents a single category within a default category configuration.
 * These categories are read-only and cannot be modified by users.
 */
export interface DefaultCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
  sort_order: number;
  /** Number of rows to show by default (0 = collapsed) */
  default_rows_shown: number;
}

/**
 * Represents a default category configuration.
 * Default configs are hardcoded and cannot be edited by users.
 */
export interface DefaultCategoryConfig {
  id: string;
  name: string;
  isDefault: true;
  categories: DefaultCategory[];
}

// =============================================================================
// Default Category Configuration
// =============================================================================

const CONTACT_DEFAULT: DefaultCategoryConfig = {
  id: "default-contact",
  name: "Contacts Default",
  isDefault: true,
  categories: [
    {
      id: "default-contact-work",
      name: "Work",
      color: "#0ea5e9",
      icon: "briefcase",
      sort_order: 0,
      default_rows_shown: 20,
    },
    {
      id: "default-contact-family",
      name: "Family",
      color: "#22c55e",
      icon: "home",
      sort_order: 1,
      default_rows_shown: 20,
    },
    {
      id: "default-contact-friends",
      name: "Friends",
      color: "#8b5cf6",
      icon: "users",
      sort_order: 2,
      default_rows_shown: 20,
    },
  ],
};

// =============================================================================
// Exports
// =============================================================================

/**
 * The default category config for contacts
 */
export const DEFAULT_CATEGORY_CONFIG: DefaultCategoryConfig = CONTACT_DEFAULT;

/**
 * First category ID — use when category_id is required and omitted.
 */
export const DEFAULT_CONTACT_CATEGORY_ID =
  DEFAULT_CATEGORY_CONFIG.categories[0]?.id;

/**
 * Check if a config ID is a default config
 */
export function isDefaultConfigId(configId: string): boolean {
  return configId.startsWith("default-");
}

/**
 * Get the default category config
 */
export function getDefaultCategoryConfig(): DefaultCategoryConfig {
  return DEFAULT_CATEGORY_CONFIG;
}

/**
 * Get categories for a default config by ID
 */
export function getDefaultCategories(
  configId: string
): DefaultCategory[] | null {
  if (configId === DEFAULT_CATEGORY_CONFIG.id) {
    return DEFAULT_CATEGORY_CONFIG.categories;
  }
  return null;
}
