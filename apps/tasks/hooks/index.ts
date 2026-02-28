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

// Task entity hooks with E2EE
export { useUnits, useUnit } from "./use-units";
export { useSpaces, useSpace } from "./use-spaces";
export { useItems, useItem } from "./use-items";

// Child counts
export { useChildCounts } from "./use-child-counts";

// Stage hooks
export { useStages } from "./use-stages";

// Label hooks
export { useLabels } from "./use-labels";

// Attachment hooks with E2EE
export { useAttachments } from "./use-attachments";
export type { UploadProgress } from "./use-attachments";

// Contact link hooks with E2EE
export { useContactLinks } from "./use-contact-links";
export type { LinkedContact } from "./use-contact-links";

// Data export
export { useDataExport } from "./use-data-export";
