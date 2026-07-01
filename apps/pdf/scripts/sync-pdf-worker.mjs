/**
 * Copy pdfjs-dist's bundled worker into apps/pdf/public for static serving.
 * Resolves pdfjs-dist from react-pdf's dependency tree (runtime API source).
 */
import { cp, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import {
  PDFJS_SOURCE_LABEL,
  resolvePdfJsForReactPdf,
} from "./resolve-pdfjs-for-react-pdf.mjs";

async function main() {
  const cwd = process.cwd();
  const { version, workerSourcePath } = resolvePdfJsForReactPdf(cwd);
  const publicDir = path.join(cwd, "public");
  const destinationPath = path.join(publicDir, "pdf.worker.min.mjs");
  const metaPath = path.join(publicDir, "pdf.worker.meta.json");

  await mkdir(publicDir, { recursive: true });
  await cp(workerSourcePath, destinationPath);
  await writeFile(
    metaPath,
    `${JSON.stringify(
      {
        version,
        source: PDFJS_SOURCE_LABEL,
        syncedAt: new Date().toISOString(),
      },
      null,
      2
    )}\n`
  );

  console.log(
    `Synced pdf.worker.min.mjs (pdfjs-dist@${version} via ${PDFJS_SOURCE_LABEL})`
  );
}

main().catch((error) => {
  console.error("Failed to sync pdf.worker.min.mjs:", error);
  process.exit(1);
});
