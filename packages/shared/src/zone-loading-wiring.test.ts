import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

/** Root loading component expected per Next.js zone. */
const LOADING_MATRIX: Record<string, string> = {
  web: "HelvetyShellRouteLoading",
  store: "HelvetyShellRouteLoading",
  pdf: "LoadingSpinner",
  "image-editor": "LoadingSpinner",
  ocr: "LoadingSpinner",
};

describe("zone root loading wiring", () => {
  it.each(Object.entries(LOADING_MATRIX))(
    "apps/%s loading.tsx re-exports %s",
    (app, component) => {
      const src = readFileSync(
        join(repoRoot, "apps", app, "app/loading.tsx"),
        "utf8"
      );
      expect(src).toContain(component);
      expect(src).toContain("@helvety/ui/");
    }
  );
});
