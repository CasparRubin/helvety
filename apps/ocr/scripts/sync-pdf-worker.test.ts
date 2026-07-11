import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { beforeAll, describe, expect, it } from "vitest";

import {
  PDFJS_SOURCE_LABEL,
  resolvePdfJsForReactPdf,
} from "./resolve-pdfjs-for-react-pdf.mjs";

const ocrAppDir = join(fileURLToPath(import.meta.url), "..", "..");
const scriptPath = join(ocrAppDir, "scripts", "sync-pdf-worker.mjs");
const workerPublicPath = join(ocrAppDir, "public", "pdf.worker.min.mjs");
const metaPublicPath = join(ocrAppDir, "public", "pdf.worker.meta.json");

describe.sequential("sync-pdf-worker script", () => {
  beforeAll(() => {
    execFileSync(process.execPath, [scriptPath], { cwd: ocrAppDir });
  });

  it("copies react-pdf's pdfjs-dist worker into public/pdf.worker.min.mjs", () => {
    const { workerSourcePath, version } = resolvePdfJsForReactPdf(ocrAppDir);
    const source = readFileSync(workerSourcePath);
    const copied = readFileSync(workerPublicPath);
    const meta = JSON.parse(readFileSync(metaPublicPath, "utf8")) as {
      version: string;
      source: string;
      syncedAt: string;
    };

    expect(copied.equals(source)).toBe(true);
    expect(copied.byteLength).toBeGreaterThan(0);
    expect(meta.version).toBe(version);
    expect(meta.source).toBe(PDFJS_SOURCE_LABEL);
    expect(() => new Date(meta.syncedAt)).not.toThrow();
    expect(Number.isNaN(new Date(meta.syncedAt).getTime())).toBe(false);
  });

  it("embeds the resolved pdfjs version in the synced worker", () => {
    const { version } = resolvePdfJsForReactPdf(ocrAppDir);
    const copied = readFileSync(workerPublicPath, "utf8");

    expect(copied).toContain(`pdfjsVersion = ${version}`);
  });

  it("package.json wires the pdf worker sync into dev and build via sync:assets", () => {
    const pkg = JSON.parse(
      readFileSync(join(ocrAppDir, "package.json"), "utf8")
    ) as { scripts?: Record<string, string> };

    expect(pkg.scripts?.dev).toContain("sync:assets");
    expect(pkg.scripts?.build).toContain("sync:assets");
    expect(pkg.scripts?.["sync:assets"]).toContain("sync:pdf-worker");
    expect(pkg.scripts?.["sync:pdf-worker"]).toContain("sync-pdf-worker.mjs");
  });

  it("does not pin pdfjs-dist directly; react-pdf owns the transitive dep", () => {
    const pkg = JSON.parse(
      readFileSync(join(ocrAppDir, "package.json"), "utf8")
    ) as {
      dependencies?: Record<string, string>;
      overrides?: Record<string, string>;
    };

    expect(pkg.dependencies?.["pdfjs-dist"]).toBeUndefined();
    expect(pkg.overrides?.["pdfjs-dist"]).toBeUndefined();
    expect(pkg.dependencies?.["react-pdf"]).toBeTruthy();
  });
});
