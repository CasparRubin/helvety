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

// Category hooks
export { useCategories } from "./use-categories";

// Task link hooks with E2EE (cross-app, bidirectional)
export { useTaskLinks } from "./use-task-links";
export type { UseTaskLinksReturn, AllEntities } from "./use-task-links";
