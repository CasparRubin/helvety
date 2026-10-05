import { createVitestConfig } from "@helvety/config/vitest";
import { mergeConfig } from "vitest/config";

export default mergeConfig(
  createVitestConfig(__dirname, { passWithNoTests: false }),
  {
    test: {
      // Keep worker sync / public/pdf.worker.* tests from racing on the shared asset.
      fileParallelism: false,
    },
  }
);
