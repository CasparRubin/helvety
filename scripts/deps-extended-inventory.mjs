/**
 * Read-only snapshot of extended (non-npm-only) dependency pins for Helvety.
 * Used by the dependency-update skill and docs/dependency-inventory.md.
 */

import { readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import process from "node:process";

const ROOT = process.cwd();

const LOCKFILE_PACKAGES = [
  "pdfjs-dist",
  "pdf-lib",
  "react-pdf",
  "tesseract.js",
];

const PACKAGE_JSON_PATHS = [
  ["root", "package.json"],
  ["@helvety/dev-deps", "packages/dev-deps/package.json"],
  ["@helvety/pdf", "apps/pdf/package.json"],
  ["@helvety/ocr", "apps/ocr/package.json"],
  ["@helvety/web", "apps/web/package.json"],
];

async function readJson(relativePath) {
  const absolutePath = path.join(ROOT, relativePath);
  return JSON.parse(await readFile(absolutePath, "utf8"));
}

function getDeclared(manifest, name) {
  return (
    manifest.dependencies?.[name] ??
    manifest.devDependencies?.[name] ??
    manifest.overrides?.[name] ??
    null
  );
}

function parseLockResolved(lockText, packageName) {
  const escaped = packageName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `"${escaped}":\\s*\\["${escaped.replace("/", "\\/")}@([^"]+)"`,
    "m"
  );
  const match = lockText.match(pattern);
  return match?.[1] ?? "(not in lockfile)";
}

async function describePath(label, relativePath) {
  const absolutePath = path.join(ROOT, relativePath);
  if (!existsSync(absolutePath)) {
    return `${label}: missing (${relativePath})`;
  }
  const info = await stat(absolutePath);
  if (info.isDirectory()) {
    return `${label}: directory (${relativePath})`;
  }
  return `${label}: present, ${info.size} bytes, mtime ${info.mtime.toISOString()} (${relativePath})`;
}

async function main() {
  const rootPkg = await readJson("package.json");
  const nvmrc = (await readFile(path.join(ROOT, ".nvmrc"), "utf8")).trim();
  const lockText = await readFile(path.join(ROOT, "bun.lock"), "utf8");

  console.log("# Helvety extended dependency inventory snapshot\n");
  console.log(`Generated: ${new Date().toISOString()}\n`);

  console.log("## Toolchain\n");
  console.log(`- Bun (packageManager): ${rootPkg.packageManager ?? "(unset)"}`);
  console.log(`- Node (.nvmrc): ${nvmrc}`);
  console.log(`- engines.node (root): ${rootPkg.engines?.node ?? "(unset)"}`);
  const eslintOverride = rootPkg.overrides?.["eslint-plugin-react"];
  if (eslintOverride) {
    console.log(`- eslint-plugin-react override: ${eslintOverride}`);
  }

  console.log("\n## Lockfile resolved (key packages)\n");
  for (const name of LOCKFILE_PACKAGES) {
    console.log(`- ${name}: ${parseLockResolved(lockText, name)}`);
  }

  const nestedPdfjs = lockText.match(
    /"react-pdf\/pdfjs-dist":\s*\["pdfjs-dist@([^"]+)"/
  );
  const resolvedPdfjs = parseLockResolved(lockText, "pdfjs-dist");
  if (nestedPdfjs) {
    console.log(`- react-pdf/pdfjs-dist (nested): ${nestedPdfjs[1]}`);
  } else {
    console.log(
      `- react-pdf/pdfjs-dist (nested): none (deduped; lockfile uses pdfjs-dist@${resolvedPdfjs})`
    );
  }

  let effectiveReactPdfPdfjsVersion = null;
  try {
    const pdfAppDir = path.join(ROOT, "apps", "pdf");
    const resolverPath = path.join(
      pdfAppDir,
      "scripts",
      "resolve-pdfjs-for-react-pdf.mjs"
    );
    const { resolvePdfJsForReactPdf } = await import(
      pathToFileURL(resolverPath).href
    );
    effectiveReactPdfPdfjsVersion = resolvePdfJsForReactPdf(pdfAppDir).version;
    console.log(
      `- react-pdf runtime pdfjs-dist (resolved): ${effectiveReactPdfPdfjsVersion}`
    );
  } catch (error) {
    console.log(
      `- react-pdf runtime pdfjs-dist (resolved): unavailable (${error instanceof Error ? error.message : String(error)})`
    );
  }

  if (effectiveReactPdfPdfjsVersion) {
    const rootOverride = rootPkg.overrides?.["pdfjs-dist"];
    const nestedOverride = rootPkg.overrides?.["react-pdf>pdfjs-dist"];
    const pdfAppPkg = await readJson("apps/pdf/package.json");
    const directPdfjs =
      pdfAppPkg.dependencies?.["pdfjs-dist"] ??
      pdfAppPkg.overrides?.["pdfjs-dist"];

    for (const [label, spec] of [
      ["root override pdfjs-dist", rootOverride],
      ["root override react-pdf>pdfjs-dist", nestedOverride],
      ["apps/pdf direct pdfjs-dist", directPdfjs],
    ]) {
      if (spec === undefined || spec === null) continue;
      const match = String(spec).match(/(\d+\.\d+\.\d+)/);
      const declared = match?.[1];
      if (declared && declared !== effectiveReactPdfPdfjsVersion) {
        console.log(
          `- WARNING: ${label} (${spec}) disagrees with react-pdf runtime pdfjs-dist@${effectiveReactPdfPdfjsVersion}`
        );
      }
    }
  }

  console.log("\n## Declared specifiers (package.json)\n");
  for (const [label, relPath] of PACKAGE_JSON_PATHS) {
    const manifest = await readJson(relPath);
    const lines = [];
    for (const dep of LOCKFILE_PACKAGES) {
      const spec = getDeclared(manifest, dep);
      if (spec) lines.push(`${dep}=${spec}`);
    }
    if (lines.length > 0) {
      console.log(`- ${label}: ${lines.join(", ")}`);
    }
  }

  console.log("\n## Vendored / self-hosted artifacts\n");
  console.log(
    `- ${await describePath("PDF.js worker", "apps/pdf/public/pdf.worker.min.mjs")}`
  );
  console.log(
    `- ${await describePath("PDF.js worker meta", "apps/pdf/public/pdf.worker.meta.json")}`
  );
  console.log(
    `- ${await describePath("OCR PDF.js worker", "apps/ocr/public/pdf.worker.min.mjs")}`
  );
  console.log(
    `- ${await describePath("OCR PDF.js worker meta", "apps/ocr/public/pdf.worker.meta.json")}`
  );
  console.log(
    `- ${await describePath("OCR tessdata dir", "apps/ocr/public/tessdata")}`
  );

  console.log(
    "- Gateway hero: static copy in apps/web/components/hero-marketing-shell.tsx (no vendored motion)"
  );

  console.log(
    "\nFull checklist and upstream URLs: docs/dependency-inventory.md\n"
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
