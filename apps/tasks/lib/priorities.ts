import { TASK_PRIORITY_METADATA } from "@helvety/shared/e2ee-entity-catalogs";
import {
  AlertTriangleIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  MinusIcon,
} from "lucide-react";

// =============================================================================
// Priority Type & Constants
// =============================================================================

/** Numeric priority values stored in the database (smallint 0-3) */
type Priority = 0 | 1 | 2 | 3;

const PRIORITY_NORMAL: Priority = 1;

// =============================================================================
// Priority Configuration
// =============================================================================

/** Display configuration for a single priority level */
interface PriorityConfig {
  value: Priority;
  label: string;
  color: string;
  icon: typeof ArrowDownIcon;
}

const PRIORITY_ICONS = [
  ArrowDownIcon,
  MinusIcon,
  ArrowUpIcon,
  AlertTriangleIcon,
] as const;

/** All priority levels in ascending order */
export const PRIORITIES: readonly PriorityConfig[] = TASK_PRIORITY_METADATA.map(
  (meta, index) => ({
    value: meta.value,
    label: meta.label,
    color: meta.color,
    icon: PRIORITY_ICONS[index] ?? MinusIcon,
  })
);

// =============================================================================
// Helpers
// =============================================================================

/**
 * Returns the display configuration for a given priority value.
 * Falls back to Normal if the value is null, undefined, or out of range.
 */
export function getPriorityConfig(
  priority: number | null | undefined
): PriorityConfig {
  return (
    PRIORITIES.find((p) => p.value === priority) ??
    (PRIORITIES[PRIORITY_NORMAL] as PriorityConfig)
  );
}
