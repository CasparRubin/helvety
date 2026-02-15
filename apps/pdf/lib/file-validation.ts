/**
 * File validation utilities for PDFs and images.
 * Provides consistent validation logic and error messages.
 * Uses magic number checks for additional security.
 * Enforces maximum file size (100MB).
 */

/**
 * PDF magic number (file signature): %PDF
 */
const PDF_MAGIC_NUMBER = new Uint8Array([0x25, 0x50, 0x44, 0x46]); // "%PDF"

/**
 * PNG magic number: 89 50 4E 47 0D 0A 1A 0A
 */
const PNG_MAGIC_NUMBER = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

/**
 * JPEG magic number: FF D8 FF
 */
const JPEG_MAGIC_NUMBER = new Uint8Array([0xff, 0xd8, 0xff]);

/**
 * GIF magic number: 47 49 46 38 (GIF8)
 */
const GIF_MAGIC_NUMBER = new Uint8Array([0x47, 0x49, 0x46, 0x38]); // "GIF8"

/**
 * WebP magic number: RIFF ... WEBP
 */
const WEBP_MAGIC_NUMBER = new Uint8Array([0x52, 0x49, 0x46, 0x46]); // "RIFF"

/**
 * Checks if the file's magic number matches the expected signature.
 *
 * @param file - The file to check
 * @param expectedMagicNumber - The expected magic number bytes
 * @returns Promise that resolves to true if magic number matches
 */
async function verifyMagicNumber(
  file: File,
  expectedMagicNumber: Uint8Array
): Promise<boolean> {
  try {
    const buffer = await file
      .slice(0, expectedMagicNumber.length)
      .arrayBuffer();
    const bytes = new Uint8Array(buffer);
    return (
      bytes.length >= expectedMagicNumber.length &&
      expectedMagicNumber.every((byte, index) => bytes[index] === byte)
    );
  } catch {
    return false;
  }
}

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
  // .svg intentionally excluded (XSS risk — see VALID_IMAGE_MIME_TYPES comment)
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
 * Validates if a file type is a valid PDF.
 * Checks MIME type, extension, and optionally magic number.
 *
 * Security: Magic number validation is enabled by default to prevent MIME type spoofing.
 *
 * @param file - The file to validate
 * @param checkMagicNumber - Whether to verify the PDF magic number (default: true for security)
 * @returns Promise that resolves to true if the file is a valid PDF, false otherwise
 */
export async function isValidPdfFile(
  file: File,
  checkMagicNumber: boolean = true
): Promise<boolean> {
  const mimeType = file.type.toLowerCase();
  const extension = getFileExtension(file.name);

  // Check MIME type
  if (VALID_PDF_MIME_TYPES.has(mimeType)) {
    // If magic number check is requested, verify file signature
    if (checkMagicNumber) {
      return await verifyMagicNumber(file, PDF_MAGIC_NUMBER);
    }
    return true;
  }

  // Fallback to extension check if MIME type is missing or generic
  if (!mimeType || mimeType === "application/octet-stream") {
    if (VALID_PDF_EXTENSIONS.has(extension)) {
      // If magic number check is requested, verify file signature
      if (checkMagicNumber) {
        return await verifyMagicNumber(file, PDF_MAGIC_NUMBER);
      }
      return true;
    }
  }

  return false;
}

/**
 * Synchronous version of isValidPdfFile that doesn't check magic numbers.
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
 * Validates if a file type is a valid image.
 * Checks MIME type, extension, and optionally magic number.
 *
 * Security: Magic number validation is enabled by default to prevent MIME type spoofing.
 *
 * @param file - The file to validate
 * @param checkMagicNumber - Whether to verify the image magic number (default: true for security)
 * @returns Promise that resolves to true if the file is a valid image, false otherwise
 */
export async function isValidImageFile(
  file: File,
  checkMagicNumber: boolean = true
): Promise<boolean> {
  const mimeType = file.type.toLowerCase();
  const extension = getFileExtension(file.name);

  // Check MIME type
  if (mimeType && VALID_IMAGE_MIME_TYPES.has(mimeType)) {
    // If magic number check is requested, verify file signature
    if (checkMagicNumber) {
      const magicNumbers = [
        { type: "png", magic: PNG_MAGIC_NUMBER },
        { type: "jpeg", magic: JPEG_MAGIC_NUMBER },
        { type: "gif", magic: GIF_MAGIC_NUMBER },
        { type: "webp", magic: WEBP_MAGIC_NUMBER },
      ];

      for (const { magic } of magicNumbers) {
        if (await verifyMagicNumber(file, magic)) {
          return true;
        }
      }
      return false;
    }
    return true;
  }

  // Fallback to extension check if MIME type is missing or generic
  if (!mimeType || mimeType === "application/octet-stream") {
    if (VALID_IMAGE_EXTENSIONS.has(extension)) {
      // If magic number check is requested, verify file signature
      if (checkMagicNumber) {
        const magicNumbers = [
          { ext: ".png", magic: PNG_MAGIC_NUMBER },
          { ext: ".jpg", magic: JPEG_MAGIC_NUMBER },
          { ext: ".jpeg", magic: JPEG_MAGIC_NUMBER },
          { ext: ".gif", magic: GIF_MAGIC_NUMBER },
          { ext: ".webp", magic: WEBP_MAGIC_NUMBER },
        ];

        const matchingMagic = magicNumbers.find((m) => extension === m.ext);
        if (matchingMagic) {
          return await verifyMagicNumber(file, matchingMagic.magic);
        }
      }
      return true;
    }
  }

  return false;
}

/**
 * Synchronous version of isValidImageFile that doesn't check magic numbers.
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

const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100MB

/**
 * Validates file size - checks max size and empty files.
 *
 * @param file - The file to validate
 * @returns Object with validation result and error message if invalid
 */
export function validateFileSize(
  file: File
): Readonly<{ valid: boolean; error?: string }> {
  if (file.size > MAX_FILE_SIZE_BYTES) {
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
