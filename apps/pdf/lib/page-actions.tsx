/**
 * Utilities for creating page action button configurations.
 * Extracted from components to improve code organization and reusability.
 */

import {
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Trash2,
  RotateCw,
  RotateCcw,
  RefreshCw,
  Download,
} from "lucide-react";

import { ROTATION_ANGLES } from "./constants";

import type { ReactNode } from "react";

/**
 * Action button configuration.
 * Matches the ActionButton interface from pdf-action-buttons.tsx
 *
 * @property icon - React node for the button icon
 * @property onClick - Click handler function
 * @property ariaLabel - Accessibility label for screen readers
 * @property title - Optional tooltip title
 * @property description - Optional tooltip description
 * @property disabled - Whether the button is disabled
 * @property className - Optional CSS class name
 * @property variant - Optional button variant style
 */
export interface PageAction {
  icon: ReactNode;
  onClick: () => void;
  ariaLabel: string;
  title?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
  variant?: "destructive" | "secondary" | "default" | "outline" | "ghost";
}

/**
 * Parameters for creating page actions.
 * Contains all callbacks and state needed to generate action buttons.
 */
export interface CreatePageActionsParams {
  index: number;
  unifiedPageNumber: number;
  totalPages: number;
  isDeleted: boolean;
  hasRotation: boolean;
  rotation: number;
  isProcessing: boolean;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onMoveLeft: (index: number) => void;
  onMoveRight: (index: number) => void;
  onToggleDelete: (unifiedPageNumber: number) => void;
  onRotate: (unifiedPageNumber: number, angle: number) => void;
  onResetRotation: (unifiedPageNumber: number) => void;
  onExtract: (unifiedPageNumber: number) => void;
}

/**
 * Creates an array of action button configurations for a page.
 *
 * @param params - Parameters for creating actions
 * @returns Array of action button configurations
 */
export function createPageActions(
  params: CreatePageActionsParams
): PageAction[] {
  const {
    index,
    unifiedPageNumber,
    totalPages,
    isDeleted,
    hasRotation,
    isProcessing,
    onMoveUp,
    onMoveDown,
    onMoveLeft,
    onMoveRight,
    onToggleDelete,
    onRotate,
    onResetRotation,
    onExtract,
  } = params;

  return [
    // Reorder buttons
    {
      icon: <ChevronUpIcon className="h-4 w-4" />,
      onClick: () => onMoveUp(index),
      ariaLabel: `Move page ${unifiedPageNumber} up`,
      title: index === 0 ? "Already at top" : "Move up",
      disabled: index === 0 || isProcessing,
      className: "sm:hidden",
    },
    {
      icon: <ChevronDownIcon className="h-4 w-4" />,
      onClick: () => onMoveDown(index),
      ariaLabel: `Move page ${unifiedPageNumber} down`,
      title: index === totalPages - 1 ? "Already at bottom" : "Move down",
      disabled: index === totalPages - 1 || isProcessing,
      className: "sm:hidden",
    },
    {
      icon: <ChevronLeftIcon className="h-4 w-4" />,
      onClick: () => onMoveLeft(index),
      ariaLabel: `Move page ${unifiedPageNumber} left`,
      title: index === 0 ? "Already at start" : "Move left",
      disabled: index === 0 || isProcessing,
      className: "hidden sm:flex",
    },
    {
      icon: <ChevronRightIcon className="h-4 w-4" />,
      onClick: () => onMoveRight(index),
      ariaLabel: `Move page ${unifiedPageNumber} right`,
      title: index === totalPages - 1 ? "Already at end" : "Move right",
      disabled: index === totalPages - 1 || isProcessing,
      className: "hidden sm:flex",
    },
    // Delete button
    {
      icon: isDeleted ? (
        <RefreshCw className="h-4 w-4" />
      ) : (
        <Trash2 className="h-4 w-4" />
      ),
      onClick: () => onToggleDelete(unifiedPageNumber),
      ariaLabel: isDeleted
        ? `Restore page ${unifiedPageNumber}`
        : `Delete page ${unifiedPageNumber}`,
      title: isDeleted ? "Restore" : "Delete",
      disabled: isProcessing,
      variant: isDeleted ? "destructive" : "secondary",
    },
    // Rotate buttons
    {
      icon: <RotateCw className="h-4 w-4" />,
      onClick: () => onRotate(unifiedPageNumber, ROTATION_ANGLES.INCREMENT),
      ariaLabel: `Rotate page ${unifiedPageNumber} 90° clockwise`,
      title: "Rotate 90° clockwise",
      disabled: isProcessing,
    },
    {
      icon: <RotateCcw className="h-4 w-4" />,
      onClick: () => onRotate(unifiedPageNumber, -ROTATION_ANGLES.INCREMENT),
      ariaLabel: `Rotate page ${unifiedPageNumber} 90° counter-clockwise`,
      title: "Rotate 90° counter-clockwise",
      disabled: isProcessing,
    },
    // Reset rotation button (only show if rotated)
    ...(hasRotation
      ? [
          {
            icon: <RefreshCw className="h-4 w-4" />,
            onClick: () => onResetRotation(unifiedPageNumber),
            ariaLabel: `Reset rotation for page ${unifiedPageNumber}`,
            title: "Reset rotation",
            disabled: isProcessing,
            variant: "destructive" as const,
          },
        ]
      : []),
    // Extract button
    {
      icon: <Download className="h-4 w-4" />,
      onClick: () => onExtract(unifiedPageNumber),
      ariaLabel: `Extract page ${unifiedPageNumber} as single PDF`,
      title: "Extract as single PDF",
      disabled: isProcessing,
    },
  ];
}
