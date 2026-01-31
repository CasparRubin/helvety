/**
 * PDF utility functions - main entry point for PDF operations.
 * Re-exports functions from specialized modules for backward compatibility.
 */

import { convertImageToPdf } from "./pdf-conversion";
import { loadPdfFromFile, getPageRotations } from "./pdf-loading";

/**
 * Loads a file (PDF or image) and creates a blob URL for preview.
 * For images, converts them to PDF. For PDFs, loads them directly.
 * Also extracts inherent page rotations from PDF metadata.
 *
 * @param file - The file to load (PDF or image)
 * @param isPdf - Whether the file is a PDF (true) or image (false)
 * @returns Promise that resolves to an object containing the PDF document, blob URL, file type, and inherent rotations
 * @throws Error if the file cannot be loaded or converted
 */
export async function loadFileWithPreview(
  file: File,
  isPdf: boolean
): Promise<{
  pdf: Awaited<ReturnType<typeof loadPdfFromFile>>;
  url: string;
  fileType: "pdf" | "image";
  inherentRotations: Record<number, number>;
}> {
  let pdf: Awaited<ReturnType<typeof loadPdfFromFile>>;
  let fileType: "pdf" | "image";
  let blob: Blob;
  let inherentRotations: Record<number, number> = {};

  if (isPdf) {
    blob = new Blob([file], { type: "application/pdf" });
    pdf = await loadPdfFromFile(file);
    fileType = "pdf";
    // Extract inherent rotations from PDF pages
    inherentRotations = getPageRotations(pdf);
  } else {
    blob = new Blob([file], { type: file.type });
    pdf = await convertImageToPdf(file);
    fileType = "image";
    // Images converted to PDF have no inherent rotation
    inherentRotations = {};
  }

  const url = URL.createObjectURL(blob);

  return { pdf, url, fileType, inherentRotations };
}

// Re-export functions from specialized modules for backward compatibility
export { loadPdfFromFile, getPageRotations } from "./pdf-loading";
export { convertImageToPdf } from "./pdf-conversion";
export { extractPageFromPdf } from "./pdf-extraction";
