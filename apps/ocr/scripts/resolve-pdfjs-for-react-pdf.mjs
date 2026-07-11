/**
 * Resolve pdfjs-dist from react-pdf's dependency context — the same tree the
 * viewer uses at runtime via react-pdf's pdfjs export.
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

export const PDFJS_SOURCE_LABEL = "react-pdf>pdfjs-dist";

/**
 * @param {string} [cwd] App workspace directory (typically `apps/ocr` when scripts run with that cwd).
 * @returns {{ version: string, pdfjsRoot: string, workerSourcePath: string, pdfjsPackagePath: string }}
 */
export function resolvePdfJsForReactPdf(cwd = process.cwd()) {
  const require = createRequire(path.join(cwd, "package.json"));
  const reactPdfPackagePath = require.resolve("react-pdf/package.json", {
    paths: [cwd],
  });
  const reactPdfRoot = path.dirname(reactPdfPackagePath);
  const pdfjsPackagePath = require.resolve("pdfjs-dist/package.json", {
    paths: [reactPdfRoot],
  });
  const pdfjsRoot = path.dirname(pdfjsPackagePath);
  const version = JSON.parse(readFileSync(pdfjsPackagePath, "utf8")).version;
  const workerSourcePath = path.join(pdfjsRoot, "build", "pdf.worker.min.mjs");

  return {
    version,
    pdfjsRoot,
    workerSourcePath,
    pdfjsPackagePath,
  };
}
