import type { OcrPhase, OcrProgress } from "./types";

/** Short human label for each OCR phase (no page suffix). */
const PHASE_LABELS: Record<OcrPhase, string> = {
  loading: "Loading file",
  "reading-text-layer": "Reading text layer",
  rendering: "Rendering page",
  recognizing: "Recognizing text",
};

/**
 * Describes the current job progress for the UI, e.g.
 * `"Recognizing text — page 3 of 12"`. The page suffix is omitted for
 * single-page inputs (images) and while the file is still loading.
 */
export function describeOcrProgress(progress: OcrProgress): string {
  const label = PHASE_LABELS[progress.phase];
  if (progress.totalPages > 1 && progress.page > 0) {
    return `${label} — page ${progress.page} of ${progress.totalPages}`;
  }
  return label;
}
