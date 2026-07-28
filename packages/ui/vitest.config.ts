import { createVitestConfig } from "@helvety/config/vitest";

const base = createVitestConfig(__dirname, { passWithNoTests: false });

/** UI package mounts sheets and dialogs; allow extra time under parallel `turbo run test`. */
export default {
  ...base,
  test: {
    ...base.test,
    testTimeout: 15_000,
  },
};
