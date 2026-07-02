/**
 * Copy pdfjs-dist's bundled worker into apps/pdf/public for static serving.
 * Resolves pdfjs-dist from react-pdf's dependency tree (runtime API source).
 */
import { cp, mkdir, rename, writeFile } from "node:fs/promises";
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
  const tmpDestinationPath = `${destinationPath}.tmp`;
  const tmpMetaPath = `${metaPath}.tmp`;

  await mkdir(publicDir, { recursive: true });
  await cp(workerSourcePath, tmpDestinationPath);
  await rename(tmpDestinationPath, destinationPath);
  await writeFile(
    tmpMetaPath,
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
  await rename(tmpMetaPath, metaPath);

  console.log(
    `Synced pdf.worker.min.mjs (pdfjs-dist@${version} via ${PDFJS_SOURCE_LABEL})`
  );
}

main().catch((error) => {
  console.error("Failed to sync pdf.worker.min.mjs:", error);
  process.exit(1);
});
