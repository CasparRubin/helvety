import {
  OCR_ACCEPTED_IMAGE_MIME_TYPES,
  OCR_FILE_SIZE_LIMIT_BYTES,
  OCR_PDF_MIME_TYPE,
} from "./constants";

import type { OcrInputKind } from "./types";

/** Result of validating a dropped or selected file. */
export type FileValidationResult =
  | { readonly ok: true; readonly kind: OcrInputKind }
  | { readonly ok: false; readonly error: string };

/** True when the file is an accepted image by MIME type or extension. */
function isAcceptedImage(file: File): boolean {
  const type = file.type.toLowerCase();
  if ((OCR_ACCEPTED_IMAGE_MIME_TYPES as readonly string[]).includes(type)) {
    return true;
  }
  // Some browsers omit or misreport MIME types; fall back to extension.
  return /\.(png|jpe?g|webp)$/i.test(file.name);
}

/** True when the file is a PDF by MIME type or `.pdf` extension. */
function isAcceptedPdf(file: File): boolean {
  return (
    file.type.toLowerCase() === OCR_PDF_MIME_TYPE || /\.pdf$/i.test(file.name)
  );
}

/**
 * Validates a single input file for OCR: type must be PDF or a supported image,
 * and size must not exceed the shared limit.
 */
export function validateOcrFile(file: File): FileValidationResult {
  const isPdf = isAcceptedPdf(file);
  const isImage = isAcceptedImage(file);

  if (!isPdf && !isImage) {
    return {
      ok: false,
      error: `"${file.name}" is not a supported file. Use a PDF or PNG, JPEG, or WebP image.`,
    };
  }

  if (file.size > OCR_FILE_SIZE_LIMIT_BYTES) {
    const limitMb = Math.round(OCR_FILE_SIZE_LIMIT_BYTES / (1024 * 1024));
    return {
      ok: false,
      error: `"${file.name}" exceeds the ${limitMb}MB limit.`,
    };
  }

  return { ok: true, kind: isPdf ? "pdf" : "image" };
}
