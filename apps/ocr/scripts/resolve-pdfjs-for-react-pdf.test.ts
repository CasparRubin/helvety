import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  PDFJS_SOURCE_LABEL,
  resolvePdfJsForReactPdf,
} from "./resolve-pdfjs-for-react-pdf.mjs";

const ocrAppDir = join(fileURLToPath(import.meta.url), "..", "..");

describe("resolvePdfJsForReactPdf", () => {
  it("resolves pdfjs-dist from react-pdf's dependency context", () => {
    const resolved = resolvePdfJsForReactPdf(ocrAppDir);

    expect(resolved.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(resolved.workerSourcePath).toContain("pdf.worker.min.mjs");
    expect(existsSync(resolved.workerSourcePath)).toBe(true);
    expect(existsSync(resolved.pdfjsPackagePath)).toBe(true);
  });

  it("matches react-pdf's declared pdfjs-dist version", () => {
    const require = createRequire(join(ocrAppDir, "package.json"));
    const reactPdfManifest = JSON.parse(
      readFileSync(require.resolve("react-pdf/package.json"), "utf8")
    ) as { dependencies?: Record<string, string> };

    const declared = reactPdfManifest.dependencies?.["pdfjs-dist"];
    expect(declared).toBeTruthy();

    const resolved = resolvePdfJsForReactPdf(ocrAppDir);
    expect(resolved.version).toBe(declared);
  });

  it("exports the react-pdf pdfjs source label", () => {
    expect(PDFJS_SOURCE_LABEL).toBe("react-pdf>pdfjs-dist");
  });

  it("re-exports the shared monorepo resolver", () => {
    const wrapper = readFileSync(
      join(ocrAppDir, "scripts", "resolve-pdfjs-for-react-pdf.mjs"),
      "utf8"
    );
    expect(wrapper).toContain(
      'from "../../../scripts/resolve-pdfjs-for-react-pdf.mjs"'
    );
  });
});
