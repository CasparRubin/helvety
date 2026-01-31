/**
 * PDF loading utilities for loading PDF documents from files.
 * Extracted from pdf-utils.ts for better code organization.
 */

// External libraries
import { PDFDocument } from "pdf-lib";

/**
 * Extracts the inherent rotation angles from all pages in a PDF document.
 * PDF pages can have a /Rotate attribute (0, 90, 180, 270) that defines their orientation.
 *
 * @param pdf - The PDFDocument to extract rotations from
 * @returns Record mapping 1-based page numbers to their rotation angles (only non-zero rotations are included)
 *
 * @example
 * ```typescript
 * const pdf = await loadPdfFromFile(file)
 * const rotations = getPageRotations(pdf)
 * // rotations might be: { 1: 90, 3: 270 } for a PDF where pages 1 and 3 are rotated
 * ```
 */
export function getPageRotations(pdf: PDFDocument): Record<number, number> {
  const rotations: Record<number, number> = {};
  const pages = pdf.getPages();

  pages.forEach((page, index) => {
    const rotation = page.getRotation().angle;
    // Only store non-zero rotations to keep the object sparse
    if (rotation !== 0) {
      rotations[index + 1] = rotation; // 1-based page numbers
    }
  });

  return rotations;
}

/**
 * Loads a PDF document from a File object.
 *
 * @param file - The PDF file to load
 * @returns A promise that resolves to the loaded PDFDocument
 * @throws Error if the file cannot be loaded
 *
 * @example
 * ```typescript
 * const pdf = await loadPdfFromFile(file)
 * const pageCount = pdf.getPageCount()
 * ```
 */
export async function loadPdfFromFile(file: File): Promise<PDFDocument> {
  const arrayBuffer = await file.arrayBuffer();
  return await PDFDocument.load(arrayBuffer);
}
