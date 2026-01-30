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
      errors.push(typeValidation.error ?? `'${file.name}' is not a supported file type.`)
      continue
    }

    // Only check if file is empty, no size limit
    if (file.size === 0) {
      errors.push(`'${file.name}' is empty.`)
      continue
    }

    // Note: Duplicate files are now allowed - they will be renamed automatically
    // in the upload handler (use-pdf-files.ts) with suffixes like _2, _3, etc.
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
  const existingNames = new Set(existingFiles.map(f => f.file.name))
  
  // Combine existing names with names used in current batch
  const allUsedNames = new Set([...existingNames, ...usedNames])
  
  if (!allUsedNames.has(fileName)) {
    return fileName
  }
  
  const lastDotIndex = fileName.lastIndexOf('.')
  const baseName = lastDotIndex > 0 ? fileName.slice(0, lastDotIndex) : fileName
  const extension = lastDotIndex > 0 ? fileName.slice(lastDotIndex) : ''
  
  let counter = 2
  let newName = `${baseName}_${counter}${extension}`
  while (allUsedNames.has(newName)) {
    counter++
    newName = `${baseName}_${counter}${extension}`
  }
  return newName
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
