/**
 * UI action consistency checks for `bun run consistency:ui-actions`.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const rootDir = process.cwd();
const appsDir = resolve(rootDir, "apps");

const failures = [];

function read(path) {
  return readFileSync(path, "utf8");
}

function walkTsx(dir, files = []) {
  if (!existsSync(dir)) {
    return files;
  }
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      walkTsx(full, files);
      continue;
    }
    if (entry.isFile() && /\.tsx?$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

for (const app of readdirSync(appsDir, { withFileTypes: true }).filter((e) =>
  e.isDirectory()
)) {
  for (const sub of ["components", "hooks"]) {
    const dir = resolve(appsDir, app.name, sub);
    if (!existsSync(dir)) {
      continue;
    }
    for (const file of walkTsx(dir)) {
      if (/from\s+["']sonner["']/.test(read(file))) {
        failures.push(`${file}: import toast from @helvety/ui/sonner`);
      }
    }
  }
}

const popupCss = read(
  resolve(rootDir, "packages", "extension-chrome", "popup.css")
);
if (popupCss.includes("hsl(var(--foreground)")) {
  failures.push(
    "packages/extension-chrome/popup.css must not use hsl(var(--*)) with OKLCH tokens"
  );
}

const ocrShell = resolve(appsDir, "ocr", "components", "helvety-ocr.tsx");
if (existsSync(ocrShell)) {
  const ocrSrc = read(ocrShell);
  if (!ocrSrc.includes("@helvety/ui/public-tool-workspace")) {
    failures.push(`${ocrShell}: import public-tool-workspace constants`);
  }
  if (!ocrSrc.includes("PUBLIC_TOOL_SIDEBAR_WIDTH_CLASS")) {
    failures.push(
      `${ocrShell}: use PUBLIC_TOOL_SIDEBAR_WIDTH_CLASS from public-tool-workspace`
    );
  }
}

const pdfToolkit = resolve(
  appsDir,
  "pdf",
  "components",
  "pdf",
  "pdf-toolkit.tsx"
);
if (
  existsSync(pdfToolkit) &&
  !read(pdfToolkit).includes("PUBLIC_TOOL_SIDEBAR_WIDTH_CLASS")
) {
  failures.push(
    `${pdfToolkit}: use PUBLIC_TOOL_SIDEBAR_WIDTH_CLASS from public-tool-workspace`
  );
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("UI action consistency checks passed.");
