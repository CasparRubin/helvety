import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const loadingPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "loading.tsx"
);

describe("store root loading", () => {
  it("re-exports HelvetyShellRouteLoading for themed route transitions", () => {
    const src = readFileSync(loadingPath, "utf8");
    expect(src).toContain("HelvetyShellRouteLoading");
    expect(src).toContain("@helvety/ui/helvety-shell-route-loading");
  });
});
