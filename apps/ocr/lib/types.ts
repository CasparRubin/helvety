/** Shared OCR domain types used across the hook, worker client, and UI. */

/** Languages available for OCR (traineddata shipped in `public/tessdata/`). */
export type OcrLanguage = "eng" | "deu";

/** Selectable OCR language options with display labels. */
export const OCR_LANGUAGE_OPTIONS: readonly {
  readonly value: OcrLanguage;
  readonly label: string;
}[] = [
  { value: "eng", label: "English" },
  { value: "deu", label: "German" },
] as const;

/** Detected kind of the loaded input file. */
export type OcrInputKind = "pdf" | "image";

/** Lifecycle status of an OCR extraction job. */
export type OcrStatus = "idle" | "processing" | "done" | "error";

/** Coarse phase reported to the UI while a job runs. */
export type OcrPhase =
  "loading" | "reading-text-layer" | "rendering" | "recognizing";

/** Progress snapshot emitted while a job runs. */
export interface OcrProgress {
  readonly phase: OcrPhase;
  /** 1-based index of the page currently being processed. */
  readonly page: number;
  /** Total number of pages to process (1 for images). */
  readonly totalPages: number;
}
