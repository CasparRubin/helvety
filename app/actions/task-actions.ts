/**
 * Barrel re-export for task actions.
 *
 * Individual actions are now split by entity for maintainability:
 * - unit-actions.ts   – Unit CRUD
 * - space-actions.ts  – Space CRUD
 * - item-actions.ts   – Item CRUD
 * - entity-actions.ts – Cross-entity operations (reorder, counts, export)
 */

export {
  createUnit,
  getUnits,
  getUnit,
  updateUnit,
  deleteUnit,
} from "@/app/actions/unit-actions";

export {
  createSpace,
  getSpaces,
  getSpace,
  updateSpace,
  deleteSpace,
} from "@/app/actions/space-actions";

export {
  createItem,
  getItems,
  getItem,
  updateItem,
  deleteItem,
} from "@/app/actions/item-actions";

export {
  reorderEntities,
  getSpaceCounts,
  getItemCounts,
  getAllTaskDataForExport,
} from "@/app/actions/entity-actions";

export type { EncryptedTaskExport } from "@/lib/types";
