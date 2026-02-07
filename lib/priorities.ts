import {
  ArrowDownIcon,
  MinusIcon,
  ArrowUpIcon,
  AlertTriangleIcon,
} from "lucide-react";

// =============================================================================
// Priority Type & Constants
// =============================================================================

/** Numeric priority values stored in the database (smallint 0–3) */
export type Priority = 0 | 1 | 2 | 3;

export const PRIORITY_LOW: Priority = 0;
export const PRIORITY_NORMAL: Priority = 1;
export const PRIORITY_HIGH: Priority = 2;
export const PRIORITY_URGENT: Priority = 3;

/** Default priority for new items and fallback for null/undefined */
export const DEFAULT_PRIORITY: Priority = PRIORITY_NORMAL;

// =============================================================================
// Priority Configuration
// =============================================================================

/** Display configuration for a single priority level */
export interface PriorityConfig {
  value: Priority;
  label: string;
  color: string;
  icon: typeof ArrowDownIcon;
}

/** All priority levels in ascending order */
export const PRIORITIES: readonly PriorityConfig[] = [
  { value: PRIORITY_LOW, label: "Low", color: "#4b5563", icon: ArrowDownIcon },
  {
    value: PRIORITY_NORMAL,
    label: "Normal",
    color: "#2563eb",
    icon: MinusIcon,
  },
  {
    value: PRIORITY_HIGH,
    label: "High",
    color: "#d97706",
    icon: ArrowUpIcon,
  },
  {
    value: PRIORITY_URGENT,
    label: "Urgent",
    color: "#dc2626",
    icon: AlertTriangleIcon,
  },
] as const;

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
