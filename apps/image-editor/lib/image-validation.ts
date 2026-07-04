import type { ExportFormat } from "./editor-types";

export const ACCEPTED_IMAGE_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

export const MAX_IMAGE_FILE_BYTES = 25 * 1024 * 1024;

/** Reason a chosen file was rejected. */
export type ImageValidationError =
  "unsupported-type" | "too-large" | "not-image";

/** Outcome of {@link validateImageFile}. */
export interface ImageValidationResult {
  ok: boolean;
  error?: ImageValidationError;
}

/** Validates a file's MIME type and size against the input limits. */
export function validateImageFile(file: File): ImageValidationResult {
  if (
    !ACCEPTED_IMAGE_MIME_TYPES.includes(
      file.type as (typeof ACCEPTED_IMAGE_MIME_TYPES)[number]
    )
  ) {
    return { ok: false, error: "unsupported-type" };
  }
  if (file.size > MAX_IMAGE_FILE_BYTES) {
    return { ok: false, error: "too-large" };
  }
  return { ok: true };
}

/** Maps a validation error to a user-facing toast message. */
export function imageValidationMessage(error: ImageValidationError): string {
  switch (error) {
    case "unsupported-type":
      return "Only PNG, JPEG, and WebP images are supported.";
    case "too-large":
      return "Image exceeds the 25 MB limit.";
    case "not-image":
      return "Please choose an image file.";
    default: {
      const _exhaustive: never = error;
      return _exhaustive;
    }
  }
}

/** Builds the export filename, e.g. `photo.png` -> `photo-edited.png`. */
export function createDownloadName(
  originalName: string,
  format: ExportFormat
): string {
  const base = originalName.replace(/\.[^.]+$/, "") || "image";
  const ext = format === "jpeg" ? "jpg" : "png";
  return `${base}-edited.${ext}`;
}
