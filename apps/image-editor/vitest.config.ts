import path from "node:path";

import { createVitestConfig } from "@helvety/config/vitest";
import { mergeConfig } from "vitest/config";

export default mergeConfig(
  createVitestConfig(__dirname, { passWithNoTests: false }),
  {
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
