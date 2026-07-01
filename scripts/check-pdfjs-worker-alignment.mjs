/**
 * Ensures the PDF zone worker matches react-pdf's resolved pdfjs-dist version.
 * Prevents API/worker version skew after dependency updates.
 */
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import process from "node:process";

const ROOT = process.cwd();
const PDF_APP_DIR = path.join(ROOT, "apps", "pdf");
const WORKER_PUBLIC_PATH = path.join(
  PDF_APP_DIR,
  "public",
  "pdf.worker.min.mjs"
);
const META_PUBLIC_PATH = path.join(
  PDF_APP_DIR,
  "public",
  "pdf.worker.meta.json"
);

/**
 * @param {string} specifier
 * @returns {string | null}
 */
function normalizeVersionSpec(specifier) {
  if (typeof specifier !== "string") return null;
  const match = specifier.match(/(\d+\.\d+\.\d+)/);
  return match?.[1] ?? null;
}

async function loadPdfJsResolver() {
  const modulePath = path.join(
    PDF_APP_DIR,
    "scripts",
    "resolve-pdfjs-for-react-pdf.mjs"
  );
  return import(pathToFileURL(modulePath).href);
}

async function main() {
  const violations = [];
  const { resolvePdfJsForReactPdf, PDFJS_SOURCE_LABEL } =
    await loadPdfJsResolver();

  let resolved;
  try {
    resolved = resolvePdfJsForReactPdf(PDF_APP_DIR);
  } catch (error) {
    console.error("Failed to resolve pdfjs-dist from react-pdf:", error);
    process.exit(1);
  }

  const rootPkg = JSON.parse(
    await readFile(path.join(ROOT, "package.json"), "utf8")
  );
  const pdfAppPkg = JSON.parse(
    await readFile(path.join(PDF_APP_DIR, "package.json"), "utf8")
  );

  const rootOverrides = rootPkg.overrides ?? {};
  for (const key of ["pdfjs-dist", "react-pdf>pdfjs-dist"]) {
    const overrideSpec = rootOverrides[key];
    if (overrideSpec === undefined) continue;
    const overrideVersion = normalizeVersionSpec(String(overrideSpec));
    if (overrideVersion && overrideVersion !== resolved.version) {
      violations.push(
        `Root override "${key}" (${overrideSpec}) does not match react-pdf's resolved pdfjs-dist@${resolved.version}. Remove the override or align it with react-pdf's dependency.`
      );
    }
  }

  const directPdfjsSpec =
    pdfAppPkg.dependencies?.["pdfjs-dist"] ??
    pdfAppPkg.overrides?.["pdfjs-dist"];
  if (directPdfjsSpec !== undefined) {
    const directVersion = normalizeVersionSpec(String(directPdfjsSpec));
    if (!directVersion || directVersion !== resolved.version) {
      violations.push(
        `apps/pdf declares pdfjs-dist (${directPdfjsSpec}) but react-pdf resolves pdfjs-dist@${resolved.version}. Remove the direct pin; react-pdf owns pdfjs-dist.`
      );
    }
  }

  if (!existsSync(WORKER_PUBLIC_PATH)) {
    violations.push(
      `Missing ${path.relative(ROOT, WORKER_PUBLIC_PATH)}. Run: cd apps/pdf && bun run sync:pdf-worker`
    );
  } else {
    const sourceWorker = await readFile(resolved.workerSourcePath);
    const publicWorker = await readFile(WORKER_PUBLIC_PATH);
    if (!sourceWorker.equals(publicWorker)) {
      violations.push(
        `Stale ${path.relative(ROOT, WORKER_PUBLIC_PATH)} (expected pdfjs-dist@${resolved.version} via ${PDFJS_SOURCE_LABEL}). Run: cd apps/pdf && bun run sync:pdf-worker`
      );
    }
  }

  if (!existsSync(META_PUBLIC_PATH)) {
    violations.push(
      `Missing ${path.relative(ROOT, META_PUBLIC_PATH)}. Run: cd apps/pdf && bun run sync:pdf-worker`
    );
  } else {
    const meta = JSON.parse(await readFile(META_PUBLIC_PATH, "utf8"));
    if (meta.version !== resolved.version) {
      violations.push(
        `pdf.worker.meta.json version (${meta.version}) does not match resolved pdfjs-dist@${resolved.version}. Run: cd apps/pdf && bun run sync:pdf-worker`
      );
    }
    if (meta.source !== PDFJS_SOURCE_LABEL) {
      violations.push(
        `pdf.worker.meta.json source (${meta.source ?? "unset"}) must be "${PDFJS_SOURCE_LABEL}". Run: cd apps/pdf && bun run sync:pdf-worker`
      );
    }
  }

  if (violations.length > 0) {
    console.error("PDF.js worker alignment check failed:");
    for (const violation of violations) {
      console.error(`- ${violation}`);
    }
    process.exit(1);
  }

  console.log(
    `PDF.js worker alignment passed (pdfjs-dist@${resolved.version} via ${PDFJS_SOURCE_LABEL}).`
  );
}

main().catch((error) => {
  console.error("Failed to validate PDF.js worker alignment:", error);
  process.exit(2);
});
