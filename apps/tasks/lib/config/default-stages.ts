/**
 * Fixed stage catalog for Tasks entities.
 * Stages are immutable and defined in code.
 */

/** Fixed default stage shape. */
interface DefaultStage {
  id: string;
  name: string;
  color: string;
  icon: string;
  sort_order: number;
  default_rows_shown: number;
}

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

export const DEFAULT_STAGE_CONFIGS = {
  item: ITEM_DEFAULT,
};

/** First stage ID per entity - use when stage_id is required and omitted. */
export const DEFAULT_ITEM_STAGE_ID = DEFAULT_STAGE_CONFIGS.item.stages[0]?.id;

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
