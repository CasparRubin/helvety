/**
 * Default stage configurations for Units, Spaces, and Items.
 * These are hardcoded and read-only - users cannot modify them.
 * If users want custom stages, they must create their own configuration.
 */

import type { EntityType } from "@/lib/types";

// =============================================================================
// Types for Default Stage Configs
// =============================================================================

/**
 * Represents a single stage within a default stage configuration.
 * These stages are read-only and cannot be modified by users.
 */
export interface DefaultStage {
  id: string;
  name: string;
  color: string;
  icon: string;
  sort_order: number;
  /** Number of rows to show by default (0 = collapsed) */
  default_rows_shown: number;
}

/**
 * Represents a default stage configuration for an entity type.
 * Default configs are hardcoded and cannot be edited by users.
 */
export interface DefaultStageConfig {
  id: string;
  name: string;
  isDefault: true;
  stages: DefaultStage[];
}

// =============================================================================
// Default Stage Configurations
// =============================================================================

/**
 * Default stage config for Units
 * Simple 2-stage setup: Work and Home
 */
const UNIT_DEFAULT: DefaultStageConfig = {
  id: "default-unit",
  name: "Units Default",
  isDefault: true,
  stages: [
    {
      id: "default-unit-work",
      name: "Work",
      color: "#3b82f6",
      icon: "briefcase",
      sort_order: 0,
      default_rows_shown: 20,
    },
    {
      id: "default-unit-home",
      name: "Home",
      color: "#22c55e",
      icon: "home",
      sort_order: 1,
      default_rows_shown: 20,
    },
  ],
};

/**
 * Default stage config for Spaces
 * 3-stage workflow: Upcoming, In Progress, Completed
 */
const SPACE_DEFAULT: DefaultStageConfig = {
  id: "default-space",
  name: "Spaces Default",
  isDefault: true,
  stages: [
    {
      id: "default-space-upcoming",
      name: "Upcoming",
      color: "#6366f1",
      icon: "calendar",
      sort_order: 0,
      default_rows_shown: 20,
    },
    {
      id: "default-space-progress",
      name: "In Progress",
      color: "#f97316",
      icon: "loader",
      sort_order: 1,
      default_rows_shown: 20,
    },
    {
      id: "default-space-completed",
      name: "Completed",
      color: "#22c55e",
      icon: "check-circle",
      sort_order: 2,
      default_rows_shown: 5,
    },
  ],
};

/**
 * Default stage config for Items
 * Full workflow: Backlog -> Discovery -> Read -> In Progress -> Testing -> Acceptance -> Completed -> The Void
 */
const ITEM_DEFAULT: DefaultStageConfig = {
  id: "default-item",
  name: "Items Default",
  isDefault: true,
  stages: [
    {
      id: "default-item-backlog",
      name: "Backlog",
      color: "#64748b",
      icon: "inbox",
      sort_order: 0,
      default_rows_shown: 5,
    },
    {
      id: "default-item-discovery",
      name: "Discovery",
      color: "#8b5cf6",
      icon: "search",
      sort_order: 1,
      default_rows_shown: 20,
    },
    {
      id: "default-item-ready",
      name: "Ready",
      color: "#06b6d4",
      icon: "clock-arrow-down",
      sort_order: 2,
      default_rows_shown: 20,
    },
    {
      id: "default-item-progress",
      name: "In Progress",
      color: "#f97316",
      icon: "loader",
      sort_order: 3,
      default_rows_shown: 20,
    },
    {
      id: "default-item-testing",
      name: "Testing",
      color: "#eab308",
      icon: "flask-conical",
      sort_order: 4,
      default_rows_shown: 20,
    },
    {
      id: "default-item-acceptance",
      name: "Acceptance",
      color: "#ec4899",
      icon: "thumbs-up",
      sort_order: 5,
      default_rows_shown: 20,
    },
    {
      id: "default-item-completed",
      name: "Completed",
      color: "#22c55e",
      icon: "check-circle",
      sort_order: 6,
      default_rows_shown: 5,
    },
    {
      id: "default-item-void",
      name: "The Void",
      color: "#581c87",
      icon: "circle-off",
      sort_order: 7,
      default_rows_shown: 0,
    },
  ],
};

// =============================================================================
// Exports
// =============================================================================

/**
 * Map of entity type to default stage config
 */
export const DEFAULT_STAGE_CONFIGS: Record<EntityType, DefaultStageConfig> = {
  unit: UNIT_DEFAULT,
  space: SPACE_DEFAULT,
  item: ITEM_DEFAULT,
};

/**
 * Check if a config ID is a default config
 */
export function isDefaultConfigId(configId: string): boolean {
  return configId.startsWith("default-");
}

/**
 * Get the default config for an entity type
 */
export function getDefaultConfigForEntityType(
  entityType: EntityType
): DefaultStageConfig {
  return DEFAULT_STAGE_CONFIGS[entityType];
}

/**
 * Get stages for a default config by ID
 */
export function getDefaultStages(configId: string): DefaultStage[] | null {
  for (const config of Object.values(DEFAULT_STAGE_CONFIGS)) {
    if (config.id === configId) {
      return config.stages;
    }
  }
  return null;
}
