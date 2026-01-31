/**
 * Application-wide constants
 */

/**
 * Breakpoint values for responsive column layout (in pixels)
 */
export const BREAKPOINTS = {
  /** Minimum width for multi-column layout (2+ columns) */
  MULTI_COLUMN: 1231,
  /** Minimum width for three-column layout */
  THREE_COLUMN: 1655,
} as const;

/**
 * Column configuration
 */
export const COLUMNS = {
  /** Minimum number of columns for validation (allows defaults) */
  MIN: 2,
  /** Maximum number of columns */
  MAX: 6,
  /** Minimum number of columns in slider (user input) */
  SLIDER_MIN: 3,
  /** Default number of columns for small screens */
  DEFAULT_SMALL: 1,
  /** Default number of columns for medium screens */
  DEFAULT_MEDIUM: 2,
  /** Default number of columns for large screens */
  DEFAULT_LARGE: 3,
} as const;

/**
 * Timeout delays (in milliseconds)
 */
export const DELAYS = {
  /** Delay before revoking blob URLs after download */
  BLOB_URL_CLEANUP: 100,
  /** Delay before auto-dismissing non-critical errors */
  ERROR_AUTO_DISMISS: 8000,
} as const;

/**
 * LocalStorage keys
 */
export const STORAGE_KEYS = {
  /** Key for storing column preference */
  COLUMNS: "helvety-pdf-columns",
} as const;

/**
 * Thumbnail quality configuration
 */
export const THUMBNAIL_QUALITY = {
  /** Device pixel ratio for mobile screens (< 768px) */
  MOBILE_DPR: 0.75,
  /** Device pixel ratio for tablet screens (768px - 1230px) */
  TABLET_DPR: 1.0,
  /** Device pixel ratio for desktop screens (≥ 1230px) */
  DESKTOP_DPR: 1.25,
  /** Maximum device pixel ratio (cap) */
  MAX_DPR: 1.5,
  /** Minimum device pixel ratio */
  MIN_DPR: 0.5,
} as const;

/**
 * Thumbnail dimension limits
 */
export const THUMBNAIL_DIMENSIONS = {
  /** Maximum thumbnail width in pixels */
  MAX_WIDTH: 800,
  /** Minimum thumbnail width in pixels */
  MIN_WIDTH: 100,
} as const;

/**
 * Intersection Observer configuration
 */
export const INTERSECTION_OBSERVER = {
  /** Root margin for loading thumbnails (start loading before visible) */
  LOAD_MARGIN: "200px",
  /** Root margin for unloading thumbnails (unload when far from viewport) */
  UNLOAD_MARGIN: "-100px",
  /** Threshold for intersection detection */
  THRESHOLD: 0.01,
} as const;

/**
 * Progressive quality loading delays
 */
export const QUALITY_UPGRADE = {
  /** Delay before upgrading quality after initial render (ms) */
  DELAY: 1000,
  /** Delay after scroll stops before upgrading quality (ms) */
  SCROLL_DEBOUNCE: 500,
} as const;

/**
 * Screen size breakpoints for quality calculation
 */
export const SCREEN_BREAKPOINTS = {
  /** Mobile breakpoint (below this is mobile) */
  MOBILE: 768,
  /** Tablet breakpoint (below this is tablet, above is desktop) */
  TABLET: 1230,
} as const;

/**
 * PDF rendering delays and configuration
 */
export const PDF_RENDER = {
  /** Delay after worker initialization before allowing document load (ms) */
  WORKER_INIT_DELAY: 100,
  /** Delay after document load before allowing page render (ms) */
  DOCUMENT_READY_DELAY: 500,
  /** Delay between render retry attempts (ms) */
  RENDER_RETRY_DELAY: 1000,
  /** Additional delay before page render after document ready (ms) */
  PAGE_RENDER_DELAY: 200,
  /** Distance in pixels from viewport before unmounting thumbnails */
  UNMOUNT_DISTANCE: 500,
} as const;

/**
 * File upload limits and validation
 */
export const FILE_LIMITS = {
  /** Maximum number of files that can be uploaded */
  MAX_FILES: 50,
  /** Minimum delay between uploads in milliseconds */
  UPLOAD_RATE_LIMIT: 100,
} as const;

/**
 * Cache management limits
 */
export const CACHE_LIMITS = {
  /** Maximum number of PDF documents to cache in memory (desktop) */
  MAX_CACHED_PDFS: 50,
  /** Maximum number of PDF documents to cache in memory (mobile) */
  MOBILE_MAX_CACHED_PDFS: 20,
} as const;

/**
 * File processing configuration
 */
export const PROCESSING = {
  /** Time between browser yields during file processing (ms) */
  YIELD_INTERVAL: 50,
  /** Time between browser yields on mobile (ms) - more frequent for better responsiveness */
  MOBILE_YIELD_INTERVAL: 25,
  /** File size threshold for considering a file "large" (for adaptive yielding, not blocking) */
  LARGE_FILE_THRESHOLD: 10 * 1024 * 1024, // 10MB
  /** Very large file threshold (for more aggressive yielding) */
  VERY_LARGE_FILE_THRESHOLD: 50 * 1024 * 1024, // 50MB
} as const;

/**
 * Operation timeouts (in milliseconds)
 */
export const TIMEOUTS = {
  /** Timeout for PDF operations (60 seconds) */
  OPERATION_TIMEOUT: 60000,
  /** Timeout for file loading operations (30 seconds) */
  FILE_LOAD_TIMEOUT: 30000,
} as const;

/**
 * Rotation angle constants (in degrees)
 */
export const ROTATION_ANGLES = {
  /** No rotation */
  NONE: 0,
  /** 90 degree rotation (quarter turn clockwise) */
  QUARTER: 90,
  /** 180 degree rotation (half turn) */
  HALF: 180,
  /** 270 degree rotation (three-quarter turn clockwise, or quarter turn counter-clockwise) */
  THREE_QUARTER: 270,
  /** Full rotation (360 degrees) */
  FULL: 360,
  /** Standard rotation increment for user actions */
  INCREMENT: 90,
} as const;

/**
 * Error message limits
 */
export const ERROR_LIMITS = {
  /** Maximum length for error messages before truncation */
  MAX_MESSAGE_LENGTH: 500,
  /** Characters to show when truncating (for "...") */
  TRUNCATE_SUFFIX_LENGTH: 3,
} as const;

/**
 * Critical error patterns that should not be auto-dismissed
 */
export const CRITICAL_ERROR_PATTERNS = [
  "Can't process",
  "Can't load",
  "Can't extract",
  "Download failed",
] as const;

/**
 * Filename constraints for file downloads
 */
export const FILENAME_LIMITS = {
  /** Maximum filename length (Windows has 255 char limit, be conservative) */
  MAX_LENGTH: 200,
  /** Default filename when sanitization results in empty or invalid name */
  DEFAULT_NAME: "download",
} as const;

/**
 * ImageBitmap cache configuration
 */
export const IMAGEBITMAP_CACHE = {
  /** Maximum number of ImageBitmap entries to cache (desktop) */
  MAX_CACHED_IMAGES: 50,
  /** Maximum number of ImageBitmap entries to cache (mobile) */
  MOBILE_MAX_CACHED_IMAGES: 20,
  /** Maximum memory for ImageBitmap cache in bytes (200MB) */
  MAX_MEMORY_BYTES: 200 * 1024 * 1024,
  /** Maximum memory for ImageBitmap cache on mobile in bytes (100MB) */
  MOBILE_MAX_MEMORY_BYTES: 100 * 1024 * 1024,
} as const;

/**
 * Rendering configuration
 */
export const RENDERING = {
  /** Timeout for worker rendering operations (ms) */
  WORKER_RENDER_TIMEOUT: 30000,
  /** Delay before retrying failed worker renders (ms) */
  WORKER_RETRY_DELAY: 1000,
  /** Maximum retry attempts for worker rendering */
  MAX_WORKER_RETRIES: 3,
} as const;
