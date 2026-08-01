/**
 * Copy pdfjs-dist's bundled worker into the current app's `public/` for static serving.
 * Resolves pdfjs-dist from react-pdf's dependency tree (runtime API source).
 *
 * Shared by apps/pdf and apps/ocr (thin wrappers under each app's scripts/).
 * Run with cwd set to the zone app (e.g. `cd apps/pdf && bun run sync:pdf-worker`).
 */
import { randomUUID } from "node:crypto";
import { cp, mkdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import {
  PDFJS_SOURCE_LABEL,
  resolvePdfJsForReactPdf,
} from "./resolve-pdfjs-for-react-pdf.mjs";

/**
 * Atomically replace `destination` with `temporary` (Windows-safe when the
 * destination is briefly locked: remove then rename).
 *
 * @param {string} temporary
 * @param {string} destination
 */
async function replaceFile(temporary, destination) {
  try {
    await rename(temporary, destination);
    return;
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? String(error.code)
        : "";
    if (code !== "EPERM" && code !== "EACCES" && code !== "EEXIST") {
      throw error;
    }
  }

  await rm(destination, { force: true });
  await rename(temporary, destination);
}

/**
 * @param {string} [cwd]
 */
export async function syncPdfWorker(cwd = process.cwd()) {
  const { version, workerSourcePath } = resolvePdfJsForReactPdf(cwd);
  const publicDir = path.join(cwd, "public");
  const destinationPath = path.join(publicDir, "pdf.worker.min.mjs");
  const metaPath = path.join(publicDir, "pdf.worker.meta.json");
  const tmpSuffix = randomUUID();
  const tmpDestinationPath = `${destinationPath}.${tmpSuffix}.tmp`;
  const tmpMetaPath = `${metaPath}.${tmpSuffix}.tmp`;

  await mkdir(publicDir, { recursive: true });
  await cp(workerSourcePath, tmpDestinationPath);
  await replaceFile(tmpDestinationPath, destinationPath);
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
  await replaceFile(tmpMetaPath, metaPath);

  console.log(
    `Synced pdf.worker.min.mjs (pdfjs-dist@${version} via ${PDFJS_SOURCE_LABEL})`
  );
}

const isDirectRun =
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isDirectRun) {
  syncPdfWorker().catch((error) => {
    console.error("Failed to sync pdf.worker.min.mjs:", error);
    process.exit(1);
  });
}
