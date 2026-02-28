/**
 * Fixed label catalog for Items.
 * One immutable label exists across all items.
 */

// =============================================================================
// Types for Default Label Configs
// =============================================================================

/**
 * Represents a single label within a default label configuration.
 * These labels are read-only and cannot be modified by users.
 */
export interface DefaultLabel {
  id: string;
  name: string;
  color: string;
  icon: string;
  sort_order: number;
}

/**
 * Represents a default label configuration.
 * Default configs are hardcoded and cannot be edited by users.
 */
export interface DefaultLabelConfig {
  id: string;
  name: string;
  isDefault: true;
  labels: DefaultLabel[];
}

// =============================================================================
// Default Label Configuration
// =============================================================================

const ITEM_DEFAULT: DefaultLabelConfig = {
  id: "default-item-label-config",
  name: "Item Label",
  isDefault: true,
  labels: [
    {
      id: "default-item-label",
      name: "Default",
      color: "#4f46e5",
      icon: "tag",
      sort_order: 0,
    },
  ],
};

// =============================================================================
// Exports
// =============================================================================

/**
 * The default label config (applied to every space)
 */
export const DEFAULT_LABEL_CONFIG: DefaultLabelConfig = ITEM_DEFAULT;

/**
 * Check if a config ID is a default label config
 */
export function isDefaultLabelConfigId(configId: string): boolean {
  return configId.startsWith("default-");
}

/**
 * Get the default label config
 */
export function getDefaultLabelConfig(): DefaultLabelConfig {
  return DEFAULT_LABEL_CONFIG;
}

/**
 * Get labels for a default config by ID
 */
export function getDefaultLabels(configId: string): DefaultLabel[] | null {
  if (configId === DEFAULT_LABEL_CONFIG.id) {
    return DEFAULT_LABEL_CONFIG.labels;
  }
  return null;
}
