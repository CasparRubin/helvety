import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { afterAll, describe, expect, it } from "vitest";

const pdfAppDir = join(fileURLToPath(import.meta.url), "..", "..");
const rootDir = join(pdfAppDir, "..", "..");
const checkScriptPath = join(
  rootDir,
  "scripts",
  "check-pdfjs-worker-alignment.mjs"
);
const syncScriptPath = join(pdfAppDir, "scripts", "sync-pdf-worker.mjs");
const workerPublicPath = join(pdfAppDir, "public", "pdf.worker.min.mjs");
const rootPackagePath = join(rootDir, "package.json");

/** Sync the public PDF worker from react-pdf's pdfjs-dist. */
function syncWorker(): void {
  execFileSync(process.execPath, [syncScriptPath], { cwd: pdfAppDir });
}

/** Run the root CI alignment check script. */
function runCheckScript(): void {
  execFileSync(process.execPath, [checkScriptPath], {
    cwd: rootDir,
    stdio: "pipe",
  });
}

describe.sequential("check-pdfjs-worker-alignment script", () => {
  afterAll(() => {
    syncWorker();
  });

  it("passes after sync:pdf-worker", () => {
    syncWorker();
    expect(() => runCheckScript()).not.toThrow();
  });

  it("fails when the public worker is stale", () => {
    syncWorker();
    const original = readFileSync(workerPublicPath);
    writeFileSync(workerPublicPath, Buffer.from([0]));

    try {
      expect(() => runCheckScript()).toThrow();
    } finally {
      writeFileSync(workerPublicPath, original);
    }
  });

  it("root package.json wires consistency:pdfjs-worker into ci:check", () => {
    const rootPkg = JSON.parse(readFileSync(rootPackagePath, "utf8")) as {
      scripts?: Record<string, string>;
    };

    expect(rootPkg.scripts?.["consistency:pdfjs-worker"]).toContain(
      "sync:pdf-worker"
    );
    expect(rootPkg.scripts?.["consistency:pdfjs-worker"]).toContain(
      "check-pdfjs-worker-alignment.mjs"
    );
    expect(rootPkg.scripts?.["ci:check"]).toContain("consistency:pdfjs-worker");
  });

  it("root package.json does not flat-override pdfjs-dist independently of react-pdf", () => {
    const rootPkg = JSON.parse(readFileSync(rootPackagePath, "utf8")) as {
      overrides?: Record<string, string>;
    };

    expect(rootPkg.overrides?.["pdfjs-dist"]).toBeUndefined();
  });
});
