import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { beforeAll, describe, expect, it } from "vitest";

import {
  PDFJS_SOURCE_LABEL,
  resolvePdfJsForReactPdf,
} from "./resolve-pdfjs-for-react-pdf.mjs";

const pdfAppDir = join(fileURLToPath(import.meta.url), "..", "..");
const scriptPath = join(pdfAppDir, "scripts", "sync-pdf-worker.mjs");
const workerPublicPath = join(pdfAppDir, "public", "pdf.worker.min.mjs");
const metaPublicPath = join(pdfAppDir, "public", "pdf.worker.meta.json");

describe.sequential("sync-pdf-worker script", () => {
  beforeAll(() => {
    execFileSync(process.execPath, [scriptPath], { cwd: pdfAppDir });
  });

  it("copies react-pdf's pdfjs-dist worker into public/pdf.worker.min.mjs", () => {
    const { workerSourcePath, version } = resolvePdfJsForReactPdf(pdfAppDir);
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
    const { version } = resolvePdfJsForReactPdf(pdfAppDir);
    const copied = readFileSync(workerPublicPath, "utf8");

    expect(copied).toContain(`pdfjsVersion = ${version}`);
  });

  it("package.json wires sync:pdf-worker into dev and build", () => {
    const pkg = JSON.parse(
      readFileSync(join(pdfAppDir, "package.json"), "utf8")
    ) as { scripts?: Record<string, string> };

    expect(pkg.scripts?.dev).toContain("sync:pdf-worker");
    expect(pkg.scripts?.build).toContain("sync:pdf-worker");
    expect(pkg.scripts?.["sync:pdf-worker"]).toContain("sync-pdf-worker.mjs");
  });

  it("does not pin pdfjs-dist directly; react-pdf owns the transitive dep", () => {
    const pkg = JSON.parse(
      readFileSync(join(pdfAppDir, "package.json"), "utf8")
    ) as {
      dependencies?: Record<string, string>;
      overrides?: Record<string, string>;
    };

    expect(pkg.dependencies?.["pdfjs-dist"]).toBeUndefined();
    expect(pkg.overrides?.["pdfjs-dist"]).toBeUndefined();
    expect(pkg.dependencies?.["react-pdf"]).toBeTruthy();
  });

  it("delegates to the shared monorepo syncPdfWorker implementation", () => {
    const wrapper = readFileSync(scriptPath, "utf8");
    expect(wrapper).toContain('from "../../../scripts/sync-pdf-worker.mjs"');
    expect(wrapper).toContain("syncPdfWorker");
  });
});
