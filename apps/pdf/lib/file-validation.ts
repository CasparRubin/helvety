/**
 * File validation utilities for PDFs and images.
 * Provides consistent validation logic and error messages.
 * Enforces maximum file size (100MB).
 */

import { PDF_FILE_SIZE_LIMIT_BYTES } from "@helvety/shared/product-file-limit-copy";

/**
 * Type guard to check if a file is a PDF based on validation.
 * Uses synchronous validation for performance.
 *
 * @param file - The file to check
 * @returns True if the file is a PDF and is a valid File object
 */
export function isPdfFile(file: File | null | undefined): file is File {
  if (!file || !(file instanceof File)) {
    return false;
  }
  return isValidPdfFileSync(file);
}

/**
 * Type guard to check if a file is an image based on validation.
 * Uses synchronous validation for performance.
 *
 * @param file - The file to check
 * @returns True if the file is an image and is a valid File object
 */
export function isImageFile(file: File | null | undefined): file is File {
  if (!file || !(file instanceof File)) {
    return false;
  }
  return isValidImageFileSync(file);
}

/**
 * Valid MIME types for PDF files
 */
const VALID_PDF_MIME_TYPES = new Set<string>(["application/pdf"]);

/**
 * Valid MIME types for image files
 */
const VALID_IMAGE_MIME_TYPES = new Set<string>([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/bmp",
  "image/tiff",
  // SVG intentionally excluded: SVGs can contain <script> tags, onload handlers,
  // and external entity references which create XSS risks when rendered.
]);

/**
 * Valid file extensions for PDF files
 */
const VALID_PDF_EXTENSIONS = new Set<string>([".pdf"]);

/**
 * Valid file extensions for image files
 */
const VALID_IMAGE_EXTENSIONS = new Set<string>([
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".bmp",
  ".tiff",
  ".tif",
  // .svg intentionally excluded (XSS risk - see VALID_IMAGE_MIME_TYPES comment)
]);

/**
 * Gets the file extension from a filename (lowercase, with dot).
 *
 * @param filename - The filename to extract extension from
 * @returns The file extension (e.g., ".pdf", ".jpg") or empty string
 */
function getFileExtension(filename: string): string {
  if (!filename || typeof filename !== "string") {
    return "";
  }
  const lastDot: number = filename.lastIndexOf(".");
  if (lastDot === -1 || lastDot === filename.length - 1) {
    return "";
  }
  return filename.substring(lastDot).toLowerCase();
}

/**
 * Synchronous PDF check from MIME type and extension.
 * Use this when you need a quick check without async overhead.
 *
 * @param file - The file to validate
 * @returns True if the file appears to be a PDF based on MIME type and extension
 */
export function isValidPdfFileSync(file: File): boolean {
  const mimeType = file.type.toLowerCase();
  const extension = getFileExtension(file.name);

  // Check MIME type
  if (VALID_PDF_MIME_TYPES.has(mimeType)) {
    return true;
  }

  // Fallback to extension check if MIME type is missing or generic
  if (!mimeType || mimeType === "application/octet-stream") {
    return VALID_PDF_EXTENSIONS.has(extension);
  }

  return false;
}

/**
 * Synchronous image check from MIME type and extension.
 * Use this when you need a quick check without async overhead.
 *
 * @param file - The file to validate
 * @returns True if the file appears to be an image based on MIME type and extension
 */
export function isValidImageFileSync(file: File): boolean {
  const mimeType = file.type.toLowerCase();
  const extension = getFileExtension(file.name);

  // Check MIME type
  if (mimeType && VALID_IMAGE_MIME_TYPES.has(mimeType)) {
    return true;
  }

  // Fallback to extension check if MIME type is missing or generic
  if (!mimeType || mimeType === "application/octet-stream") {
    return VALID_IMAGE_EXTENSIONS.has(extension);
  }

  return false;
}

/**
 * Validates if a file is a valid PDF or image.
 *
 * @param file - The file to validate
 * @returns Object with validation result and error message if invalid
 */
export function validateFileType(
  file: File
): Readonly<{ valid: boolean; error?: string }> {
  if (isValidPdfFileSync(file)) {
    return { valid: true };
  }

  if (isValidImageFileSync(file)) {
    return { valid: true };
  }

  // Check if MIME type and extension mismatch
  const extension = getFileExtension(file.name);
  const hasPdfExtension = VALID_PDF_EXTENSIONS.has(extension);
  const hasImageExtension = VALID_IMAGE_EXTENSIONS.has(extension);

  if (hasPdfExtension && file.type && !file.type.includes("pdf")) {
    return {
      valid: false,
      error: `'${file.name}' has a PDF extension but MIME type '${file.type}' doesn't match. The file may be corrupted or incorrectly named.`,
    };
  }

  if (hasImageExtension && file.type && !file.type.startsWith("image/")) {
    return {
      valid: false,
      error: `'${file.name}' has an image extension but MIME type '${file.type}' doesn't match. The file may be corrupted or incorrectly named.`,
    };
  }

  return {
    valid: false,
    error: `'${file.name}' is not a supported file type. Please upload a PDF or image file (JPEG, PNG, GIF, WebP, BMP, or TIFF).`,
  };
}

/**
 * Validates file size - checks max size and empty files.
 *
 * @param file - The file to validate
 * @returns Object with validation result and error message if invalid
 */
export function validateFileSize(
  file: File
): Readonly<{ valid: boolean; error?: string }> {
  if (file.size > PDF_FILE_SIZE_LIMIT_BYTES) {
    return {
      valid: false,
      error: `File exceeds maximum size of 100MB.`,
    };
  }

  if (file.size === 0) {
    return {
      valid: false,
      error: `'${file.name}' is empty.`,
    };
  }

  return { valid: true };
}
