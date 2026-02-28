/**
 * Fixed stage catalog for Tasks entities.
 * Stages are immutable and defined in code.
 */

import type { EntityType } from "@/lib/types";

/** Fixed default stage shape. */
export interface DefaultStage {
  id: string;
  name: string;
  color: string;
  icon: string;
  sort_order: number;
  default_rows_shown: number;
}

/** Fixed default stage config shape. */
export interface DefaultStageConfig {
  id: string;
  name: string;
  isDefault: true;
  stages: DefaultStage[];
}

const UNIT_DEFAULT: DefaultStageConfig = {
  id: "default-unit",
  name: "Units Default",
  isDefault: true,
  stages: [
    {
      id: "default-unit-work",
      name: "Work",
      color: "#0ea5e9",
      icon: "briefcase",
      sort_order: 0,
      default_rows_shown: 20,
    },
    {
      id: "default-unit-home",
      name: "Home",
      color: "#84cc16",
      icon: "home",
      sort_order: 1,
      default_rows_shown: 20,
    },
  ],
};

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
      color: "#eab308",
      icon: "loader",
      sort_order: 3,
      default_rows_shown: 20,
    },
    {
      id: "default-item-testing",
      name: "Testing",
      color: "#d946ef",
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
      color: "#10b981",
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

export const DEFAULT_STAGE_CONFIGS: Record<EntityType, DefaultStageConfig> = {
  unit: UNIT_DEFAULT,
  space: SPACE_DEFAULT,
  item: ITEM_DEFAULT,
};

/** Returns true when a config ID is a built-in default ID. */
export function isDefaultConfigId(configId: string): boolean {
  return configId.startsWith("default-");
}

/** Returns the immutable default config for an entity type. */
export function getDefaultConfigForEntityType(
  entityType: EntityType
): DefaultStageConfig {
  return DEFAULT_STAGE_CONFIGS[entityType];
}

/** Returns default stages for a specific built-in config ID. */
export function getDefaultStages(configId: string): DefaultStage[] | null {
  for (const config of Object.values(DEFAULT_STAGE_CONFIGS)) {
    if (config.id === configId) {
      return config.stages;
    }
  }
  return null;
}
