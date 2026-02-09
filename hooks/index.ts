/**
 * Hooks index
 * Re-exports all custom hooks for convenient importing
 */

// Device detection
export {
  useIsMobile,
  isMobileDevice,
  MOBILE_BREAKPOINT,
} from "./use-is-mobile";

// Contact hooks with E2EE
export { useContacts, useContact } from "./use-contacts";

// Category hooks with E2EE
export { useCategoryConfigs } from "./use-category-configs";
export { useCategories } from "./use-categories";
export { useCategoryAssignment } from "./use-category-assignment";

// Task link hooks with E2EE (cross-app, read-only)
export { useTaskLinks } from "./use-task-links";
export type { UseTaskLinksReturn } from "./use-task-links";
