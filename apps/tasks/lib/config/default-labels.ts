/**
 * Fixed label catalog for Items.
 * Labels are immutable and defined in code.
 */

import {
  TASK_LABELS,
  type CatalogLabelEntry,
} from "@helvety/shared/e2ee-entity-catalogs";
import { DEFAULT_TASK_LABEL_ID } from "@helvety/shared/e2ee-entity-defaults";

// =============================================================================
// Types for Default Label Configs
// =============================================================================

/**
 * Represents a single label within a default label configuration.
 * These labels are read-only and cannot be modified by users.
 */
type DefaultLabel = CatalogLabelEntry;

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
  labels: TASK_LABELS,
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
export const DEFAULT_ITEM_LABEL_ID = DEFAULT_TASK_LABEL_ID;

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
