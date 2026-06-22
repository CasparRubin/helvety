import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const workerPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../workers/upscale.worker.ts"
);

describe("image-upscaler ORT runtime wiring", () => {
  const worker = readFileSync(workerPath, "utf8").replace(/\r\n/g, "\n");

  it("self-hosts wasm/JSEP under /image-upscaler/ort/", () => {
    expect(worker).toContain('ort.env.wasm.wasmPaths = "/image-upscaler/ort/"');
    expect(worker).toContain("copy-ort-runtime.mjs populates public/ort/");
  });

  it("disables ORT proxy worker inside DedicatedWorker", () => {
    expect(worker).toContain("ort.env.wasm.proxy = false");
  });

  it("pins single-thread wasm without SharedArrayBuffer", () => {
    expect(worker).toContain("ort.env.wasm.numThreads = 1");
    expect(worker).toMatch(/cross-origin-isolation|COEP|SharedArrayBuffer/i);
  });
});
