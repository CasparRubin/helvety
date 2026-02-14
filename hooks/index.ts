/**
 * Hooks index
 * Re-exports all custom hooks for convenient importing
 */

// Generic encrypted list hook
export { useEncryptedList } from "./use-encrypted-list";
export type {
  UseEncryptedListConfig,
  UseEncryptedListReturn,
} from "./use-encrypted-list";

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

// Task link hooks with E2EE (cross-app, bidirectional)
export { useTaskLinks } from "./use-task-links";
export type { UseTaskLinksReturn, AllEntities } from "./use-task-links";
