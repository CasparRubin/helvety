"use client";

import { TOAST_DURATIONS } from "@helvety/shared/constants";
import { logger } from "@helvety/shared/logger";
import { toast } from "@helvety/ui/sonner";
import * as React from "react";

import { OCR_MAX_PDF_PAGES, OCR_PDF_WORKER_PUBLIC_PATH } from "@/lib/constants";
import { validateOcrFile } from "@/lib/file-validation";
import {
  createOcrWorkerClient,
  type OcrWorkerClient,
} from "@/lib/ocr-worker-client";
import {
  renderPdfPageToImageBlob,
  type PdfRenderPage,
} from "@/lib/pdf-page-renderer";
import {
  extractPageTextLayer,
  pageNeedsOcr,
  type PdfTextLayerPage,
} from "@/lib/pdf-text-layer";
import { combinePageTexts } from "@/lib/text-extract";

import type {
  OcrInputKind,
  OcrLanguage,
  OcrProgress,
  OcrStatus,
} from "@/lib/types";

/** Debounce before re-running extraction after a language change. */
const LANGUAGE_RERUN_DEBOUNCE_MS = 300;

/** Combined pdf.js page proxy shape used by the OCR pipeline. */
type PdfPageProxy = PdfTextLayerPage & PdfRenderPage & { cleanup?: () => void };

/** Minimal pdf.js document proxy shape used by the OCR pipeline. */
interface PdfDocumentProxy {
  readonly numPages: number;
  getPage(pageNumber: number): Promise<PdfPageProxy>;
}

/** PDF.js 6 tears down via the loading task, not `PDFDocumentProxy.destroy()`. */
interface PdfLoadingTask {
  readonly promise: Promise<unknown>;
  destroy(): Promise<void>;
}

/** Loads a PDF document via react-pdf's bundled pdf.js (client-only). */
async function loadPdfDocument(data: ArrayBuffer): Promise<{
  doc: PdfDocumentProxy;
  loadingTask: PdfLoadingTask;
}> {
  const { pdfjs } = await import("react-pdf");
  pdfjs.GlobalWorkerOptions.workerSrc = OCR_PDF_WORKER_PUBLIC_PATH;
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(data),
  }) as PdfLoadingTask;
  try {
    const doc = (await loadingTask.promise) as PdfDocumentProxy;
    return { doc, loadingTask };
  } catch (error) {
    await loadingTask.destroy().catch(() => {});
    throw error;
  }
}

/** Throws an `AbortError` if the signal has already been aborted. */
function throwIfAborted(signal: AbortSignal): void {
  if (signal.aborted) {
    throw new DOMException("OCR aborted", "AbortError");
  }
}

/** Public shape returned by {@link useOcrJob}. */
export interface UseOcrJobResult {
  readonly status: OcrStatus;
  readonly progress: OcrProgress | null;
  readonly text: string;
  readonly error: string | null;
  readonly fileName: string | null;
  readonly inputKind: OcrInputKind | null;
  readonly language: OcrLanguage;
  readonly hasFile: boolean;
  readonly setLanguage: (language: OcrLanguage) => void;
  readonly loadFile: (file: File) => void;
  readonly clear: () => void;
}

/**
 * State machine for the OCR extraction flow: validates the input, runs the
 * PDF text-layer / OCR pipeline, and exposes progress and results. Extraction
 * auto-starts on file load and re-runs (debounced) when the language changes.
 */
export function useOcrJob(): UseOcrJobResult {
  const [status, setStatus] = React.useState<OcrStatus>("idle");
  const [progress, setProgress] = React.useState<OcrProgress | null>(null);
  const [text, setText] = React.useState<string>("");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [fileName, setFileName] = React.useState<string | null>(null);
  const [inputKind, setInputKind] = React.useState<OcrInputKind | null>(null);
  const [language, setLanguageState] = React.useState<OcrLanguage>("eng");

  const fileRef = React.useRef<File | null>(null);
  const kindRef = React.useRef<OcrInputKind | null>(null);
  const abortRef = React.useRef<AbortController | null>(null);
  const clientRef = React.useRef<OcrWorkerClient | null>(null);
  const isMountedRef = React.useRef(true);
  const languageRerunTimeoutRef = React.useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

  const cancelPendingLanguageRerun = React.useCallback((): void => {
    if (languageRerunTimeoutRef.current !== null) {
      clearTimeout(languageRerunTimeoutRef.current);
      languageRerunTimeoutRef.current = null;
    }
  }, []);

  const getClient = React.useCallback((): OcrWorkerClient => {
    clientRef.current ??= createOcrWorkerClient();
    return clientRef.current;
  }, []);

  const runJob = React.useCallback(
    async (
      file: File,
      kind: OcrInputKind,
      lang: OcrLanguage,
      signal: AbortSignal
    ): Promise<string> => {
      const client = getClient();

      if (kind === "image") {
        setProgress({ phase: "recognizing", page: 1, totalPages: 1 });
        return client.recognize(file, { language: lang, signal });
      }

      setProgress({ phase: "loading", page: 0, totalPages: 0 });
      const buffer = await file.arrayBuffer();
      throwIfAborted(signal);
      const { doc, loadingTask } = await loadPdfDocument(buffer);
      try {
        if (doc.numPages > OCR_MAX_PDF_PAGES) {
          toast.warning(
            `This PDF has ${doc.numPages} pages. Only the first ${OCR_MAX_PDF_PAGES} will be processed.`,
            { duration: TOAST_DURATIONS.INFO }
          );
        }
        const totalPages = Math.min(doc.numPages, OCR_MAX_PDF_PAGES);
        const pageTexts: string[] = [];

        for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
          throwIfAborted(signal);
          setProgress({
            phase: "reading-text-layer",
            page: pageNumber,
            totalPages,
          });
          const page = await doc.getPage(pageNumber);
          try {
            const textLayer = await extractPageTextLayer(page);
            if (pageNeedsOcr(textLayer)) {
              setProgress({ phase: "rendering", page: pageNumber, totalPages });
              const imageBlob = await renderPdfPageToImageBlob(page, {
                signal,
              });
              throwIfAborted(signal);
              setProgress({
                phase: "recognizing",
                page: pageNumber,
                totalPages,
              });
              pageTexts.push(
                await client.recognize(imageBlob, { language: lang, signal })
              );
            } else {
              pageTexts.push(textLayer);
            }
          } finally {
            try {
              page.cleanup?.();
            } catch {
              // Page cleanup is best-effort; never mask the extraction result.
            }
          }
        }

        return combinePageTexts(pageTexts);
      } finally {
        await loadingTask.destroy().catch(() => {});
      }
    },
    [getClient]
  );

  const startJob = React.useCallback(
    (file: File, kind: OcrInputKind, lang: OcrLanguage): void => {
      abortRef.current?.abort();
      const abortController = new AbortController();
      abortRef.current = abortController;

      setStatus("processing");
      setText("");
      setErrorMessage(null);
      setProgress({ phase: "loading", page: 0, totalPages: 0 });

      void runJob(file, kind, lang, abortController.signal)
        .then((result) => {
          if (!isMountedRef.current || abortController.signal.aborted) {
            return;
          }
          setText(result);
          setStatus("done");
          setProgress(null);
          if (result.trim().length === 0) {
            toast.info("No text found in this file.", {
              duration: TOAST_DURATIONS.INFO,
            });
          }
        })
        .catch((error: unknown) => {
          if (
            abortController.signal.aborted ||
            (error instanceof DOMException && error.name === "AbortError")
          ) {
            return;
          }
          if (!isMountedRef.current) {
            return;
          }
          logger.logUnexpectedError("OCR extraction failed", error);
          const message =
            error instanceof Error ? error.message : "Failed to extract text.";
          setStatus("error");
          setErrorMessage(message);
          setProgress(null);
          toast.error(message, {
            duration: TOAST_DURATIONS.ERROR,
          });
        })
        .finally(() => {
          if (abortRef.current === abortController) {
            abortRef.current = null;
          }
        });
    },
    [runJob]
  );

  const loadFile = React.useCallback(
    (file: File): void => {
      const validation = validateOcrFile(file);
      if (!validation.ok) {
        toast.error(validation.error, { duration: TOAST_DURATIONS.ERROR });
        return;
      }
      cancelPendingLanguageRerun();
      fileRef.current = file;
      kindRef.current = validation.kind;
      setFileName(file.name);
      setInputKind(validation.kind);
      startJob(file, validation.kind, language);
    },
    [cancelPendingLanguageRerun, language, startJob]
  );

  const clear = React.useCallback((): void => {
    cancelPendingLanguageRerun();
    abortRef.current?.abort();
    abortRef.current = null;
    fileRef.current = null;
    kindRef.current = null;
    setFileName(null);
    setInputKind(null);
    setText("");
    setErrorMessage(null);
    setProgress(null);
    setStatus("idle");
  }, [cancelPendingLanguageRerun]);

  const setLanguage = React.useCallback((next: OcrLanguage): void => {
    setLanguageState(next);
  }, []);

  // Re-run extraction (debounced) when the language changes with a file loaded.
  const initialLanguageRef = React.useRef(language);
  React.useEffect(() => {
    if (language === initialLanguageRef.current) {
      return;
    }
    initialLanguageRef.current = language;
    const file = fileRef.current;
    const kind = kindRef.current;
    if (!file || !kind) {
      return;
    }
    const timeoutId = setTimeout(() => {
      languageRerunTimeoutRef.current = null;
      startJob(file, kind, language);
    }, LANGUAGE_RERUN_DEBOUNCE_MS);
    languageRerunTimeoutRef.current = timeoutId;
    return () => {
      clearTimeout(timeoutId);
      if (languageRerunTimeoutRef.current === timeoutId) {
        languageRerunTimeoutRef.current = null;
      }
    };
  }, [language, startJob]);

  React.useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      cancelPendingLanguageRerun();
      abortRef.current?.abort();
      clientRef.current?.dispose();
      clientRef.current = null;
    };
  }, [cancelPendingLanguageRerun]);

  return {
    status,
    progress,
    text,
    error: errorMessage,
    fileName,
    inputKind,
    language,
    hasFile: fileName !== null,
    setLanguage,
    loadFile,
    clear,
  };
}
