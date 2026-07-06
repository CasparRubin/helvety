/**
 * Fixed stage catalog for Tasks entities.
 * Stages are immutable and defined in code.
 */

import {
  TASK_STAGES,
  type CatalogEntry,
} from "@helvety/shared/e2ee-entity-catalogs";
import { DEFAULT_TASK_STAGE_ID } from "@helvety/shared/e2ee-entity-defaults";

/** Fixed default stage shape. */
type DefaultStage = CatalogEntry;

/** Fixed default stage config shape. */
interface DefaultStageConfig {
  id: string;
  name: string;
  isDefault: true;
  stages: DefaultStage[];
}

const ITEM_DEFAULT: DefaultStageConfig = {
  id: "default-item",
  name: "Items Default",
  isDefault: true,
  stages: TASK_STAGES,
};

export const DEFAULT_STAGE_CONFIGS = {
  item: ITEM_DEFAULT,
};

/** First stage ID per entity - use when stage_id is required and omitted. */
export const DEFAULT_ITEM_STAGE_ID = DEFAULT_TASK_STAGE_ID;

/** Returns true when a config ID is a built-in default ID. */
export function isDefaultConfigId(configId: string): boolean {
  return configId.startsWith("default-");
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
