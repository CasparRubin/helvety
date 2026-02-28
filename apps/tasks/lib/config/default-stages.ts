/**
 * Fixed stage catalog for Tasks entities.
 * One immutable stage exists for each entity type.
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
  id: "default-unit-config",
  name: "Unit Stage",
  isDefault: true,
  stages: [
    {
      id: "default-unit-stage",
      name: "Default",
      color: "#0ea5e9",
      icon: "layers",
      sort_order: 0,
      default_rows_shown: 20,
    },
  ],
};

const SPACE_DEFAULT: DefaultStageConfig = {
  id: "default-space-config",
  name: "Space Stage",
  isDefault: true,
  stages: [
    {
      id: "default-space-stage",
      name: "Default",
      color: "#6366f1",
      icon: "layers",
      sort_order: 0,
      default_rows_shown: 20,
    },
  ],
};

const ITEM_DEFAULT: DefaultStageConfig = {
  id: "default-item-config",
  name: "Item Stage",
  isDefault: true,
  stages: [
    {
      id: "default-item-stage",
      name: "Default",
      color: "#64748b",
      icon: "layers",
      sort_order: 0,
      default_rows_shown: 20,
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
