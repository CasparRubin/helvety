/**
 * Validation utilities for file processing.
 * Extracted from hooks to improve code organization and reusability.
 */

// Internal utilities
import { FILE_LIMITS } from "./constants"
import { validateFileType, isPdfFile } from "./file-validation"

// Types
import type { PdfFile } from "./types"

/**
 * Validation result for file validation operations.
 * 
 * @property valid - Whether all files passed validation
 * @property errors - Array of error messages for invalid files
 */
export interface FileValidationResult {
  valid: boolean
  errors: string[]
}

/**
 * Validates multiple files for upload.
 * Performs type, size, and duplicate checks.
 * 
 * @param files - Array of files to validate
 * @param existingFiles - Array of already uploaded files to check for duplicates
 * @returns Validation result with errors array
 */
export function validateFiles(
  files: ReadonlyArray<File>,
  existingFiles: ReadonlyArray<PdfFile>
): FileValidationResult {
  const errors: string[] = []
  
  const currentFileCount = existingFiles.length
  const newFileCount = files.length
  if (currentFileCount + newFileCount > FILE_LIMITS.MAX_FILES) {
    errors.push(
      `Cannot add ${newFileCount} file(s). Maximum ${FILE_LIMITS.MAX_FILES} files allowed. You currently have ${currentFileCount} file(s).`
    )
    return { valid: false, errors }
  }

  for (const file of files) {
    const typeValidation = validateFileType(file)
    if (!typeValidation.valid) {
      errors.push(typeValidation.error || `'${file.name}' is not a supported file type.`)
      continue
    }

    // Only check if file is empty, no size limit
    if (file.size === 0) {
      errors.push(`'${file.name}' is empty.`)
      continue
    }

    if (isDuplicateFile(file, existingFiles)) {
      errors.push(`'${file.name}' is already added.`)
      continue
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Checks if a file is a duplicate of an existing file.
 * Compares both filename and file size to detect duplicates.
 * 
 * @param file - The file to check for duplicates
 * @param existingFiles - Array of existing files to check against
 * @returns True if the file is a duplicate (same name and size), false otherwise
 */
export function isDuplicateFile(file: File, existingFiles: ReadonlyArray<PdfFile>): boolean {
  return existingFiles.some(
    (pf) => pf.file.name === file.name && pf.file.size === file.size
  )
}

/**
 * Determines the file type (PDF or image) from a File object.
 * Uses synchronous validation for performance.
 * 
 * @param file - The file to check
 * @returns 'pdf' if the file is a PDF, 'image' if it's an image file
 */
export function determineFileType(file: File): 'pdf' | 'image' {
  return isPdfFile(file) ? 'pdf' : 'image'
}
