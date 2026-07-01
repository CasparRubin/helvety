import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const hookPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "use-pdf-worker.ts"
);

describe("usePdfWorker wiring", () => {
  it("configures worker via react-pdf pdfjs, not a direct pdfjs-dist import", () => {
    const src = readFileSync(hookPath, "utf8");

    expect(src).toContain('import("react-pdf")');
    expect(src).toContain("GlobalWorkerOptions.workerSrc");
    expect(src).toContain("PDF_WORKER_PUBLIC_PATH");
    expect(src).toContain("pdf.worker.min.mjs");
    expect(src).toContain("sync-pdf-worker.mjs");
    expect(src).not.toMatch(/from\s+["']pdfjs-dist["']/);
  });
});
