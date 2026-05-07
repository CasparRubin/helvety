/**
 * Copies the onnxruntime-web wasm and JSEP runtime files from node_modules into
 * `apps/image-upscaler/public/ort/` so they can be self-hosted under our CSP.
 *
 * Run by `predev` and `prebuild` in `apps/image-upscaler/package.json`. Idempotent.
 */

import { cp, mkdir, readdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);

const RUNTIME_FILE_PATTERNS = [/\.wasm$/i, /\.mjs$/i];

async function main() {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const repoRoot = path.resolve(scriptDir, "..");
  const appDir = path.join(repoRoot, "apps", "image-upscaler");
  const destinationDir = path.join(appDir, "public", "ort");

  // Resolve onnxruntime-web from the consuming app. The package's "exports"
  // field doesn't expose package.json, so resolve a known dist file and walk
  // up to the package root.
  const ortIndexPath = require.resolve("onnxruntime-web", {
    paths: [appDir, repoRoot],
  });
  let ortPackageDir = path.dirname(ortIndexPath);
  while (
    ortPackageDir !== path.dirname(ortPackageDir) &&
    !existsSync(path.join(ortPackageDir, "package.json"))
  ) {
    ortPackageDir = path.dirname(ortPackageDir);
  }
  const ortDistDir = path.join(ortPackageDir, "dist");

  if (!existsSync(ortDistDir)) {
    throw new Error(
      `onnxruntime-web dist directory not found at ${ortDistDir}.`
    );
  }

  await rm(destinationDir, { recursive: true, force: true });
  await mkdir(destinationDir, { recursive: true });

  const entries = await readdir(ortDistDir, { withFileTypes: true });
  let copiedCount = 0;
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (!RUNTIME_FILE_PATTERNS.some((pattern) => pattern.test(entry.name))) {
      continue;
    }
    const source = path.join(ortDistDir, entry.name);
    const destination = path.join(destinationDir, entry.name);
    await cp(source, destination);
    copiedCount += 1;
  }

  if (copiedCount === 0) {
    throw new Error(
      `No onnxruntime-web runtime files matched in ${ortDistDir}.`
    );
  }

  console.log(
    `[copy-ort-runtime] Copied ${copiedCount} files into ${destinationDir}`
  );
}

main().catch((error) => {
  console.error("[copy-ort-runtime] Failed:", error);
  process.exit(1);
});
