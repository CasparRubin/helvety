/**
 * Copy pdfjs-dist's bundled worker into apps/pdf/public for static serving.
 * Resolves pdfjs-dist from this app workspace (see package.json + root overrides),
 * not from react-pdf's nested dependency tree.
 */
import { cp, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";

const require = createRequire(import.meta.url);

async function main() {
  const pdfjsPackagePath = require.resolve("pdfjs-dist/package.json");

  const sourcePath = path.join(
    path.dirname(pdfjsPackagePath),
    "build",
    "pdf.worker.min.mjs"
  );
  const destinationPath = path.join(
    process.cwd(),
    "public",
    "pdf.worker.min.mjs"
  );

  await mkdir(path.dirname(destinationPath), { recursive: true });
  await cp(sourcePath, destinationPath);
}

main().catch((error) => {
  console.error("Failed to sync pdf.worker.min.mjs:", error);
  process.exit(1);
});
