/**
 * PDF page extraction utilities.
 * Extracted from pdf-utils.ts for better code organization.
 */

// External libraries
import { PDFDocument } from "pdf-lib"

/**
 * Extracts a page from a PDF document and creates a new PDF with that page.
 * 
 * @param pdf - The source PDF document
 * @param pageIndex - The zero-based index of the page to extract
 * @returns A promise that resolves to a new PDFDocument containing only the extracted page
 * 
 * @example
 * ```typescript
 * const newPdf = await extractPageFromPdf(pdf, 0) // Extract first page
 * ```
 */
export async function extractPageFromPdf(
  pdf: PDFDocument,
  pageIndex: number
): Promise<PDFDocument> {
  // Validate inputs
  if (!pdf || typeof pdf.getPageCount !== 'function') {
    throw new Error('Invalid PDF document provided. Expected a PDFDocument instance.')
  }

  if (!Number.isInteger(pageIndex) || pageIndex < 0) {
    throw new Error(`Invalid page index: ${pageIndex}. Must be a non-negative integer.`)
  }

  const pageCount = pdf.getPageCount()
  if (pageIndex >= pageCount) {
    throw new Error(`Page index ${pageIndex} is out of bounds. PDF has ${pageCount} page(s).`)
  }

  const newPdf = await PDFDocument.create()
  const [copiedPage] = await newPdf.copyPages(pdf, [pageIndex])
  newPdf.addPage(copiedPage)
  return newPdf
}
