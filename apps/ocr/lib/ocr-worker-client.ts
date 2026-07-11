"use client";

import { createWorker, type Worker as TesseractWorker } from "tesseract.js";

import {
  OCR_TESSDATA_PUBLIC_PATH,
  OCR_TESSERACT_ASSETS_PUBLIC_PATH,
  OCR_WORKER_OPERATION_TIMEOUT_MS,
} from "./constants";

import type { OcrLanguage } from "./types";

/** Image inputs Tesseract.js can recognize directly. */
type OcrImageInput = Blob | File;

interface OcrRecognizeOptions {
  readonly language: OcrLanguage;
  readonly signal?: AbortSignal;
  /** Recognition progress in the range 0..1. */
  readonly onProgress?: (progress: number) => void;
}

export interface OcrWorkerClient {
  recognize: (
    image: OcrImageInput,
    options: OcrRecognizeOptions
  ) => Promise<string>;
  dispose: () => void;
}

/**
 * Wraps a Tesseract.js worker with per-page timeouts, abort handling, and
 * terminate/recreate recovery. Assets (worker, core WASM, traineddata) are
 * self-hosted under `public/` so nothing is fetched from a third-party CDN.
 */
class OcrWorkerClientImpl implements OcrWorkerClient {
  private worker: TesseractWorker | null = null;
  private workerLanguage: OcrLanguage | null = null;
  private progressListener: ((progress: number) => void) | null = null;
  private disposed = false;

  private async createWorkerForLanguage(
    language: OcrLanguage
  ): Promise<TesseractWorker> {
    return createWorker(language, undefined, {
      workerPath: `${OCR_TESSERACT_ASSETS_PUBLIC_PATH}/worker.min.js`,
      corePath: `${OCR_TESSERACT_ASSETS_PUBLIC_PATH}/`,
      langPath: OCR_TESSDATA_PUBLIC_PATH,
      // Load the worker as a same-origin script rather than a blob: URL to stay
      // within the zone's script-src / worker-src Content Security Policy.
      workerBlobURL: false,
      // Serve uncompressed `*.traineddata` from public/tessdata (see
      // scripts/download-tessdata.mjs); avoids needing gzipped variants.
      gzip: false,
      logger: (message) => {
        if (message.status === "recognizing text") {
          this.progressListener?.(message.progress);
        }
      },
    });
  }

  private async ensureWorker(language: OcrLanguage): Promise<TesseractWorker> {
    if (this.worker && this.workerLanguage === language) {
      return this.worker;
    }
    await this.terminateWorker();
    const worker = await this.createWorkerForLanguage(language);
    this.worker = worker;
    this.workerLanguage = language;
    return worker;
  }

  private async terminateWorker(): Promise<void> {
    const worker = this.worker;
    this.worker = null;
    this.workerLanguage = null;
    this.progressListener = null;
    if (worker) {
      try {
        await worker.terminate();
      } catch {
        // Terminating a crashed worker can throw; the reference is dropped.
      }
    }
  }

  async recognize(
    image: OcrImageInput,
    { language, signal, onProgress }: OcrRecognizeOptions
  ): Promise<string> {
    if (this.disposed) {
      throw new Error("OCR worker has been disposed");
    }
    if (signal?.aborted) {
      throw new DOMException("OCR aborted", "AbortError");
    }

    const worker = await this.ensureWorker(language);
    this.progressListener = onProgress ?? null;

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let onAbort: (() => void) | undefined;

    try {
      const result = await new Promise<string>((resolve, reject) => {
        timeoutId = setTimeout(() => {
          void this.terminateWorker();
          reject(new Error("OCR processing timed out"));
        }, OCR_WORKER_OPERATION_TIMEOUT_MS);

        onAbort = () => {
          void this.terminateWorker();
          reject(new DOMException("OCR aborted", "AbortError"));
        };
        signal?.addEventListener("abort", onAbort, { once: true });

        worker
          .recognize(image)
          .then((response) => resolve(response.data.text))
          .catch((error: unknown) => reject(error));
      });
      return result;
    } finally {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
      if (onAbort) {
        signal?.removeEventListener("abort", onAbort);
      }
      this.progressListener = null;
    }
  }

  dispose(): void {
    this.disposed = true;
    void this.terminateWorker();
  }
}

/** Creates a Tesseract-backed OCR worker client. */
export function createOcrWorkerClient(): OcrWorkerClient {
  return new OcrWorkerClientImpl();
}
