/**
 * Ensures each pdf.js consumer zone's worker matches react-pdf's resolved
 * pdfjs-dist version. Prevents API/worker version skew after dependency updates.
 * Both apps/pdf and apps/ocr render PDFs via react-pdf and must stay aligned.
 */
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import process from "node:process";

const ROOT = process.cwd();

/** Zones that vendor react-pdf's pdfjs-dist worker into `public/`. */
const PDFJS_ZONES = ["pdf", "ocr"];

/**
 * @param {string} specifier
 * @returns {string | null}
 */
function normalizeVersionSpec(specifier) {
  if (typeof specifier !== "string") return null;
  const match = specifier.match(/(\d+\.\d+\.\d+)/);
  return match?.[1] ?? null;
}

/**
 * @param {string} appDir
 */
async function loadPdfJsResolver(appDir) {
  const modulePath = path.join(
    appDir,
    "scripts",
    "resolve-pdfjs-for-react-pdf.mjs"
  );
  return import(pathToFileURL(modulePath).href);
}

/**
 * Validates one zone's worker/meta against react-pdf's resolved pdfjs-dist.
 *
 * @param {string} appName
 * @param {Record<string, unknown>} rootPkg
 * @returns {Promise<string[]>}
 */
async function validateZone(appName, rootPkg) {
  const appDir = path.join(ROOT, "apps", appName);
  const workerPublicPath = path.join(appDir, "public", "pdf.worker.min.mjs");
  const metaPublicPath = path.join(appDir, "public", "pdf.worker.meta.json");
  const violations = [];

  const { resolvePdfJsForReactPdf, PDFJS_SOURCE_LABEL } =
    await loadPdfJsResolver(appDir);

  let resolved;
  try {
    resolved = resolvePdfJsForReactPdf(appDir);
  } catch (error) {
    return [
      `apps/${appName}: failed to resolve pdfjs-dist from react-pdf: ${error instanceof Error ? error.message : error}`,
    ];
  }

  const appPkg = JSON.parse(
    await readFile(path.join(appDir, "package.json"), "utf8")
  );

  const rootOverrides = rootPkg.overrides ?? {};
  for (const key of ["pdfjs-dist", "react-pdf>pdfjs-dist"]) {
    const overrideSpec = rootOverrides[key];
    if (overrideSpec === undefined) continue;
    const overrideVersion = normalizeVersionSpec(String(overrideSpec));
    if (overrideVersion && overrideVersion !== resolved.version) {
      violations.push(
        `Root override "${key}" (${overrideSpec}) does not match react-pdf's resolved pdfjs-dist@${resolved.version} in apps/${appName}. Remove the override or align it with react-pdf's dependency.`
      );
    }
  }

  const directPdfjsSpec =
    appPkg.dependencies?.["pdfjs-dist"] ?? appPkg.overrides?.["pdfjs-dist"];
  if (directPdfjsSpec !== undefined) {
    const directVersion = normalizeVersionSpec(String(directPdfjsSpec));
    if (!directVersion || directVersion !== resolved.version) {
      violations.push(
        `apps/${appName} declares pdfjs-dist (${directPdfjsSpec}) but react-pdf resolves pdfjs-dist@${resolved.version}. Remove the direct pin; react-pdf owns pdfjs-dist.`
      );
    }
  }

  if (!existsSync(workerPublicPath)) {
    violations.push(
      `Missing ${path.relative(ROOT, workerPublicPath)}. Run: cd apps/${appName} && bun run sync:pdf-worker`
    );
  } else {
    const sourceWorker = await readFile(resolved.workerSourcePath);
    const publicWorker = await readFile(workerPublicPath);
    if (!sourceWorker.equals(publicWorker)) {
      violations.push(
        `Stale ${path.relative(ROOT, workerPublicPath)} (expected pdfjs-dist@${resolved.version} via ${PDFJS_SOURCE_LABEL}). Run: cd apps/${appName} && bun run sync:pdf-worker`
      );
    }
  }

  if (!existsSync(metaPublicPath)) {
    violations.push(
      `Missing ${path.relative(ROOT, metaPublicPath)}. Run: cd apps/${appName} && bun run sync:pdf-worker`
    );
  } else {
    const meta = JSON.parse(await readFile(metaPublicPath, "utf8"));
    if (meta.version !== resolved.version) {
      violations.push(
        `apps/${appName} pdf.worker.meta.json version (${meta.version}) does not match resolved pdfjs-dist@${resolved.version}. Run: cd apps/${appName} && bun run sync:pdf-worker`
      );
    }
    if (meta.source !== PDFJS_SOURCE_LABEL) {
      violations.push(
        `apps/${appName} pdf.worker.meta.json source (${meta.source ?? "unset"}) must be "${PDFJS_SOURCE_LABEL}". Run: cd apps/${appName} && bun run sync:pdf-worker`
      );
    }
  }

  return violations;
}

async function main() {
  const rootPkg = JSON.parse(
    await readFile(path.join(ROOT, "package.json"), "utf8")
  );

  const violations = [];
  for (const appName of PDFJS_ZONES) {
    violations.push(...(await validateZone(appName, rootPkg)));
  }

  if (violations.length > 0) {
    console.error("PDF.js worker alignment check failed:");
    for (const violation of violations) {
      console.error(`- ${violation}`);
    }
    process.exit(1);
  }

  console.log(
    `PDF.js worker alignment passed for zones: ${PDFJS_ZONES.join(", ")}.`
  );
}

main().catch((error) => {
  console.error("Failed to validate PDF.js worker alignment:", error);
  process.exit(2);
});
