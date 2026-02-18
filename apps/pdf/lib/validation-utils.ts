/**
 * Validation utilities for file processing.
 * Extracted from hooks to improve code organization and reusability.
 */

// Internal utilities
import {
  validateFileType,
  validateFileSize,
  isPdfFile,
} from "./file-validation";

// Types
import type { PdfFile, FileValidationResult } from "./types";

// Re-export for backward compatibility
export type { FileValidationResult };

/**
 * Validates that a value is a non-negative integer.
 * Throws an error if validation fails.
 *
 * @param value - The value to validate
 * @param paramName - Name of the parameter for error messages
 * @throws {Error} If value is not a non-negative integer
 */
export function validateNonNegativeInteger(
  value: unknown,
  paramName: string
): asserts value is number {
  if (!Number.isInteger(value) || (value as number) < 0) {
    throw new Error(
      `Invalid ${paramName}: ${value}. Must be a non-negative integer.`
    );
  }
}

/**
 * Validates that a value is an instance of a specific class.
 * Throws an error if validation fails.
 *
 * @param value - The value to validate
 * @param constructor - The constructor/class to check against
 * @param paramName - Name of the parameter for error messages
 * @throws {Error} If value is not an instance of the specified class
 */
export function validateInstance<T>(
  value: unknown,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor: new (...args: any[]) => T,
  paramName: string
): asserts value is T {
  if (!(value instanceof constructor)) {
    throw new Error(
      `Invalid ${paramName} provided. Expected a ${constructor.name} instance.`
    );
  }
}

/**
 * Validates that a value is an array.
 * Throws an error if validation fails.
 *
 * @param value - The value to validate
 * @param paramName - Name of the parameter for error messages
 * @throws {Error} If value is not an array
 */
export function validateArray(
  value: unknown,
  paramName: string
): asserts value is unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`Invalid ${paramName} parameter. Expected an array.`);
  }
}

/**
 * Validates that a number is finite.
 * Throws an error if validation fails.
 *
 * @param value - The value to validate
 * @param paramName - Name of the parameter for error messages
 * @throws {Error} If value is not a finite number
 */
export function validateFiniteNumber(
  value: unknown,
  paramName: string
): asserts value is number {
  if (!Number.isFinite(value)) {
    throw new Error(`Invalid ${paramName}: ${value}. Must be a finite number.`);
  }
}

/**
 * Validates multiple files for upload.
 * Performs type and size checks (100MB max, empty file detection).
 * Duplicate files are allowed and renamed in the upload handler (use-pdf-files.ts).
 *
 * @param files - Array of files to validate
 * @param _existingFiles - Array of already uploaded files (unused; kept for API compatibility)
 * @returns Validation result with errors array
 */
export function validateFiles(
  files: ReadonlyArray<File>,
  _existingFiles: ReadonlyArray<PdfFile>
): FileValidationResult {
  const errors: string[] = [];

  for (const file of files) {
    const typeValidation = validateFileType(file);
    if (!typeValidation.valid) {
      errors.push(
        typeValidation.error ?? `'${file.name}' is not a supported file type.`
      );
      continue;
    }

    const sizeValidation = validateFileSize(file);
    if (!sizeValidation.valid) {
      errors.push(
        sizeValidation.error ?? `'${file.name}' exceeds the maximum file size.`
      );
      continue;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Checks if a file is a duplicate of an existing file.
 * Compares both filename and file size to detect duplicates.
 *
 * @param file - The file to check for duplicates
 * @param existingFiles - Array of existing files to check against
 * @returns True if the file is a duplicate (same name and size), false otherwise
 */
export function isDuplicateFile(
  file: File,
  existingFiles: ReadonlyArray<PdfFile>
): boolean {
  return existingFiles.some(
    (pf) => pf.file.name === file.name && pf.file.size === file.size
  );
}

/**
 * Generates a unique filename by appending a suffix (_2, _3, etc.) if the name already exists.
 * Checks against both existing files and names already used in the current batch.
 *
 * @param fileName - The original filename to make unique
 * @param existingFiles - Array of already uploaded files
 * @param usedNames - Set of names already used in the current batch (optional)
 * @returns A unique filename, either the original or with a suffix appended
 *
 * @example
 * ```typescript
 * // If "report.pdf" already exists:
 * generateUniqueFileName("report.pdf", existingFiles) // returns "report_2.pdf"
 * // If "report_2.pdf" also exists:
 * generateUniqueFileName("report.pdf", existingFiles) // returns "report_3.pdf"
 * ```
 */
export function generateUniqueFileName(
  fileName: string,
  existingFiles: ReadonlyArray<PdfFile>,
  usedNames: Set<string> = new Set()
): string {
  const existingNames = new Set(existingFiles.map((f) => f.file.name));

  // Combine existing names with names used in current batch
  const allUsedNames = new Set([...existingNames, ...usedNames]);

  if (!allUsedNames.has(fileName)) {
    return fileName;
  }

  const lastDotIndex = fileName.lastIndexOf(".");
  const baseName =
    lastDotIndex > 0 ? fileName.slice(0, lastDotIndex) : fileName;
  const extension = lastDotIndex > 0 ? fileName.slice(lastDotIndex) : "";

  let counter = 2;
  let newName = `${baseName}_${counter}${extension}`;
  while (allUsedNames.has(newName)) {
    counter++;
    newName = `${baseName}_${counter}${extension}`;
  }
  return newName;
}

/**
 * Determines the file type (PDF or image) from a File object.
 * Uses synchronous validation for performance.
 *
 * @param file - The file to check
 * @returns 'pdf' if the file is a PDF, 'image' if it's an image file
 */
export function determineFileType(file: File): "pdf" | "image" {
  return isPdfFile(file) ? "pdf" : "image";
}
