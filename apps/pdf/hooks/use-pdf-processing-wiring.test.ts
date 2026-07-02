import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const hookPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "use-pdf-processing.ts"
);
const workerPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "workers",
  "pdf-processing.worker.ts"
);
const workerTypesPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "lib",
  "pdf-processing-worker-types.ts"
);

describe("usePdfProcessing export wiring", () => {
  const hookSrc = readFileSync(hookPath, "utf8");
  const workerSrc = readFileSync(workerPath, "utf8");
  const workerTypesSrc = readFileSync(workerTypesPath, "utf8");

  it("syncs pageRotationsRef during render for immediate export reads", () => {
    expect(hookSrc).toContain("pageRotationsRef.current = pageRotations");
    expect(hookSrc).not.toMatch(
      /useEffect\(\(\) => \{\s*pageRotationsRef\.current = pageRotations/
    );
  });

  it("snapshots rotations at the start of merge and extract", () => {
    expect(hookSrc).toContain(
      "const currentRotations = pageRotationsRef.current"
    );
    expect(hookSrc).toMatch(
      /extractPage[\s\S]*currentRotations = pageRotationsRef\.current/
    );
  });

  it("routes export through shared rotation helpers", () => {
    expect(hookSrc).toContain("exportPageWithRotation");
    expect(hookSrc).toContain("computeEffectiveRotation");
    expect(hookSrc).not.toContain("totalRotation !== 0");
    expect(workerSrc).toContain("exportPageWithRotation");
    expect(workerSrc).not.toContain("totalRotation !== 0");
  });

  it("uses totalRotation on worker extract payload", () => {
    expect(workerTypesSrc).toContain("readonly totalRotation: number");
    expect(workerTypesSrc).not.toContain("readonly userRotation: number");
    expect(hookSrc).toContain("totalRotation: computeEffectiveRotation");
    expect(workerSrc).toContain("request.payload.totalRotation");
  });
});
