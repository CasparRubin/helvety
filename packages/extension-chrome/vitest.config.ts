import { createVitestConfig } from "@helvety/config/vitest";

export default createVitestConfig(import.meta.dirname, {
  passWithNoTests: false,
});
