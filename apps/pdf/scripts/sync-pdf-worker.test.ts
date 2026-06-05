import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const pdfAppDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const scriptPath = join(pdfAppDir, "scripts", "sync-pdf-worker.mjs");
const workerPublicPath = join(pdfAppDir, "public", "pdf.worker.min.mjs");

describe("sync-pdf-worker script", () => {
  it("copies the app pdfjs-dist worker into public/pdf.worker.min.mjs", () => {
    execFileSync(process.execPath, [scriptPath], { cwd: pdfAppDir });

    const require = createRequire(join(pdfAppDir, "package.json"));
    const pdfjsPackagePath = require.resolve("pdfjs-dist/package.json");
    const sourcePath = join(
      dirname(pdfjsPackagePath),
      "build",
      "pdf.worker.min.mjs"
    );

    const source = readFileSync(sourcePath);
    const copied = readFileSync(workerPublicPath);

    expect(copied.equals(source)).toBe(true);
    expect(copied.byteLength).toBeGreaterThan(0);
  });
});
