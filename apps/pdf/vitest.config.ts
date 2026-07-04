import { createVitestConfig } from "@helvety/config/vitest";
import { mergeConfig } from "vitest/config";

export default mergeConfig(
  createVitestConfig(__dirname, { passWithNoTests: false }),
  {
    test: {
      // scripts/sync-pdf-worker and pdfjs-worker-alignment share public/pdf.worker.*
      fileParallelism: false,
    },
  }
);
