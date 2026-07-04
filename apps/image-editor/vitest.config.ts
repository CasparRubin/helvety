import path from "node:path";

import { createVitestConfig } from "@helvety/config/vitest";
import { mergeConfig } from "vitest/config";

export default mergeConfig(
  createVitestConfig(__dirname, { passWithNoTests: false }),
  {
    test: {
      setupFiles: [
        path.resolve(__dirname, "vitest.setup.ts"),
        path.resolve(__dirname, "vitest.browser-mocks.ts"),
      ],
    },
    resolve: {
      alias: [
        {
          find: /^konva$/,
          replacement: path.resolve(__dirname, "vitest.konva-mock.ts"),
        },
      ],
    },
  }
);
