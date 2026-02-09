import * as LucideIcons from "lucide-react";
import { CircleIcon } from "lucide-react";
import React from "react";

// =============================================================================
// Helper: Convert kebab-case to PascalCase for Lucide icons
// =============================================================================

/**
 * Converts a kebab-case string to PascalCase.
 * Used to transform icon names like "check-circle" to "CheckCircle" for Lucide.
 */
export function toPascalCase(str: string): string {
  return str
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
}

// =============================================================================
// Helper: Get Lucide icon component by name
// =============================================================================

/**
 * Type for a Lucide icon component with optional className and style props.
 */
export type LucideIconComponent = React.ComponentType<{
  className?: string;
  style?: React.CSSProperties;
}>;

/**
 * Retrieves a Lucide icon component by its kebab-case name.
 * Falls back to CircleIcon if the icon is not found.
 */
export function getLucideIcon(iconName: string): LucideIconComponent {
  const pascalName = toPascalCase(iconName);
  const icons = LucideIcons as unknown as Record<string, LucideIconComponent>;
  const IconComponent = icons[pascalName];
  return IconComponent ?? CircleIcon;
}

/**
 * Renders a category icon by its kebab-case name.
 * Uses React.createElement to avoid "component created during render" lint errors.
 */
export function renderCategoryIcon(
  iconName: string,
  className?: string,
  style?: React.CSSProperties
): React.ReactElement {
  const IconComponent = getLucideIcon(iconName);
  return React.createElement(IconComponent, { className, style });
}
