/**
 * Custom hook for initializing PDF.js worker.
 * Ensures worker is initialized once and shared across all PDF components.
 */

import { logger } from "@helvety/shared/logger";
import * as React from "react";

import { PDF_RENDER } from "@/lib/constants";

const PDF_BASE_PATH = "/pdf";
const PDF_WORKER_PUBLIC_PATH = `${PDF_BASE_PATH}/pdf.worker.min.mjs`;

// Shared Promise for worker initialization (resolves when worker is ready)
let workerInitPromise: Promise<void> | null = null;

/**
 * Return type for usePdfWorker hook.
 */
export interface UsePdfWorkerReturn {
  /** Whether worker is ready */
  readonly workerReady: boolean;
  /** Error message if worker initialization failed */
  readonly error: string | null;
}

/**
 * Custom hook for initializing PDF.js worker.
 *
 * The worker is configured to use a basePath-prefixed local worker file from
 * the public folder, which is automatically kept in sync with the `pdfjs-dist`
 * version resolved from `react-pdf` via the postinstall script in package.json.
 *
 * Uses a module-level promise to ensure only one worker is initialized across
 * all component instances.
 *
 * @param fileType - File type ('pdf' or 'image') - worker only needed for PDFs
 * @returns Worker ready state and error state
 */
export function usePdfWorker(fileType: "pdf" | "image"): UsePdfWorkerReturn {
  const [workerReady, setWorkerReady] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  /**
   * Initializes the PDF.js worker once on the client side (shared across all instances).
   *
   * @returns A Promise that resolves when the worker is ready, or rejects on error
   * @throws Error if window is not available (SSR environment)
   */
  const initializeWorker = React.useCallback((): Promise<void> => {
    if (typeof window === "undefined") {
      return Promise.reject(new Error("Window is not available"));
    }

    // If worker is already initialized, return resolved promise
    if (workerInitPromise) {
      return workerInitPromise;
    }

    // Create and cache the initialization Promise
    workerInitPromise = import("react-pdf")
      .then((mod) => {
        mod.pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER_PUBLIC_PATH;
        // Wait a bit to ensure worker is fully initialized
        return new Promise<void>((resolve) => {
          setTimeout(() => {
            resolve();
          }, PDF_RENDER.WORKER_INIT_DELAY);
        });
      })
      .catch((err) => {
        // Reset promise on error so it can be retried
        workerInitPromise = null;
        logger.error("Failed to initialize PDF worker:", err);
        throw err;
      });

    return workerInitPromise;
  }, []);

  // Set up PDF.js worker - all components await the same Promise (only for PDFs)
  React.useEffect(() => {
    // Skip worker initialization for images
    if (fileType === "image") {
      setWorkerReady(true); // Set to true so rendering can proceed
      return;
    }

    let isMounted = true;

    initializeWorker()
      .then(() => {
        if (isMounted) {
          setWorkerReady(true);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError(
            "Unable to load PDF viewer. Please refresh the page and try again."
          );
        }
      });

    return () => {
      isMounted = false;
    };
  }, [initializeWorker, fileType]);

  return {
    workerReady,
    error,
  };
}
