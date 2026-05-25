/**
 * Read-only snapshot of extended (non-npm-only) dependency pins for Helvety.
 * Used by the dependency-update skill and docs/dependency-inventory.md.
 */

import { readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();

const LOCKFILE_PACKAGES = [
  "onnxruntime-web",
  "pdfjs-dist",
  "@eigenpal/docx-editor-react",
  "three",
  "postprocessing",
  "pdf-lib",
  "react-pdf",
];

const PACKAGE_JSON_PATHS = [
  ["root", "package.json"],
  ["@helvety/dev-deps", "packages/dev-deps/package.json"],
  ["@helvety/pdf", "apps/pdf/package.json"],
  ["@helvety/docs", "apps/docs/package.json"],
  ["@helvety/image-upscaler", "apps/image-upscaler/package.json"],
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

function parseOnnxSha256(modelsSource) {
  const entries = [];
  const blockMatch = modelsSource.match(
    /id:\s*"realesr-general-x4v3"[\s\S]*?license:/m
  );
  if (!blockMatch) return entries;
  const onnxBlock = blockMatch[0];

  const mainSha = onnxBlock.match(/sha256:\s*"([a-f0-9]{64})"/);
  if (mainSha) {
    entries.push({ file: "real_esrgan_general_x4v3.onnx", sha256: mainSha[1] });
  }

  const dataSha = onnxBlock.match(
    /externalData:[\s\S]*?sha256:\s*\n\s*"([a-f0-9]{64})"/m
  );
  if (dataSha) {
    entries.push({ file: "real_esrgan_general_x4v3.data", sha256: dataSha[1] });
  }

  return entries;
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
  const modelsSource = await readFile(
    path.join(ROOT, "apps/image-upscaler/lib/models.ts"),
    "utf8"
  );

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
  if (nestedPdfjs) {
    console.log(`- react-pdf/pdfjs-dist (nested): ${nestedPdfjs[1]}`);
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

  console.log(
    "\n## ONNX model integrity (apps/image-upscaler/lib/models.ts)\n"
  );
  for (const { file, sha256 } of parseOnnxSha256(modelsSource)) {
    console.log(`- ${file}: sha256 ${sha256}`);
  }

  console.log("\n## Vendored / self-hosted artifacts\n");
  console.log(
    `- ${await describePath("PDF.js worker", "apps/pdf/public/pdf.worker.min.mjs")}`
  );
  console.log(
    `- ${await describePath("ORT runtime dir", "apps/image-upscaler/public/ort")}`
  );

  const vendorDir = path.join(ROOT, "apps/web/components/vendor");
  if (existsSync(vendorDir)) {
    const { readdir } = await import("node:fs/promises");
    const files = await readdir(vendorDir);
    console.log(`- React Bits vendor files: ${files.join(", ")}`);
  } else {
    console.log("- React Bits vendor: apps/web/components/vendor/ missing");
  }

  console.log("\n## Docs\n");
  console.log(
    "- Google Fonts CDN: apps/docs/app/globals.css (Material Symbols)"
  );

  console.log(
    "\nFull checklist and upstream URLs: docs/dependency-inventory.md\n"
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
