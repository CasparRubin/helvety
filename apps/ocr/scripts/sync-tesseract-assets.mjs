/**
 * Copy Tesseract.js worker + core WASM into apps/ocr/public/tesseract for
 * same-origin static serving (no third-party CDN, CSP-friendly). Runs before
 * dev/build. Language `*.traineddata` files are downloaded separately; see
 * scripts/download-tessdata.mjs.
 */
import { createRequire } from "node:module";
import { cp, mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const require = createRequire(import.meta.url);

async function main() {
  const cwd = process.cwd();
  const publicDir = path.join(cwd, "public", "tesseract");
  await mkdir(publicDir, { recursive: true });

  const tesseractRoot = path.dirname(
    require.resolve("tesseract.js/package.json", { paths: [cwd] })
  );
  await cp(
    path.join(tesseractRoot, "dist", "worker.min.js"),
    path.join(publicDir, "worker.min.js")
  );

  // Resolve the core package from tesseract.js's dependency context.
  const coreDir = path.dirname(
    require.resolve("tesseract.js-core/package.json", {
      paths: [tesseractRoot, cwd],
    })
  );
  const coreFiles = (await readdir(coreDir)).filter((name) =>
    /\.wasm(\.js)?$/.test(name)
  );
  for (const file of coreFiles) {
    await cp(path.join(coreDir, file), path.join(publicDir, file));
  }

  console.log(
    `Synced Tesseract assets (worker.min.js + ${coreFiles.length} core files)`
  );
}

main().catch((error) => {
  console.error("Failed to sync Tesseract assets:", error);
  process.exit(1);
});
