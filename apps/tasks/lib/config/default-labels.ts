/**
 * Fixed label catalog for Items.
 * Labels are immutable and defined in code.
 */

// =============================================================================
// Types for Default Label Configs
// =============================================================================

/**
 * Represents a single label within a default label configuration.
 * These labels are read-only and cannot be modified by users.
 */
interface DefaultLabel {
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
interface DefaultLabelConfig {
  id: string;
  name: string;
  isDefault: true;
  labels: DefaultLabel[];
}

// =============================================================================
// Default Label Configuration
// =============================================================================

const ITEM_DEFAULT: DefaultLabelConfig = {
  id: "default-labels",
  name: "Default Labels",
  isDefault: true,
  labels: [
    {
      id: "default-label-bug",
      name: "Bug",
      color: "#f87171",
      icon: "bug",
      sort_order: 0,
    },
    {
      id: "default-label-change-request",
      name: "Change Request",
      color: "#fb923c",
      icon: "refresh-cw",
      sort_order: 1,
    },
    {
      id: "default-label-feature",
      name: "Feature",
      color: "#4ade80",
      icon: "star",
      sort_order: 2,
    },
    {
      id: "default-label-improvement",
      name: "Improvement",
      color: "#60a5fa",
      icon: "trending-up",
      sort_order: 3,
    },
    {
      id: "default-label-internal-task",
      name: "Internal Task",
      color: "#a78bfa",
      icon: "briefcase",
      sort_order: 4,
    },
  ],
};

// =============================================================================
// Exports
// =============================================================================

/**
 * Default label ID for items without a user-selected label.
 * Must remain aligned with the database CHECK constraint for `items.label_id`
 * and the built-in fixed label IDs below. Use when creating items without
 * a specific label.
 */
export const DEFAULT_ITEM_LABEL_ID = "default-item-label";

/**
 * The default label config used for task items.
 */
export const DEFAULT_LABEL_CONFIG: DefaultLabelConfig = ITEM_DEFAULT;

/**
 * Check if a config ID is a default label config
 */
export function isDefaultLabelConfigId(configId: string): boolean {
  return configId.startsWith("default-");
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
