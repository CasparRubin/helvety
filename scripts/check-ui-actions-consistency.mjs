/**
 * UI action consistency checks for `bun run consistency:ui-actions`.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const rootDir = process.cwd();
const appsDir = resolve(rootDir, "apps");
const extensionDir = resolve(
  rootDir,
  "..",
  "helvety-browser-extension-chromium"
);

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

for (const app of ["tasks", "notes", "contacts"]) {
  const rowName = app === "contacts" ? "contact-row.tsx" : "entity-row.tsx";
  const rowFile = resolve(appsDir, app, "components", rowName);
  if (!existsSync(rowFile)) {
    continue;
  }
  const rowSrc = read(rowFile);
  if (rowSrc.includes("TrashIcon")) {
    failures.push(`${rowFile}: use Trash2Icon in list row delete actions`);
  }
  if (!rowSrc.includes("@helvety/ui/icon-size")) {
    failures.push(
      `${rowFile}: import ICON_SIZE_CLASS from @helvety/ui/icon-size`
    );
  }
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

if (existsSync(extensionDir)) {
  const globals = read(resolve(extensionDir, "src", "globals.css"));
  if (!globals.includes("@helvety/extension-chrome/extension-tokens.css")) {
    failures.push(
      "extension globals.css must import @helvety/extension-chrome/extension-tokens.css"
    );
  }
  if (globals.includes("./popup/extension-tokens.css")) {
    failures.push("extension must not use local extension-tokens.css fork");
  }
  for (const rowRel of [
    "src/popup/components/lists/entity-row.tsx",
    "src/popup/components/lists/contact-row.tsx",
  ]) {
    const rowFile = resolve(extensionDir, rowRel);
    if (
      existsSync(rowFile) &&
      !read(rowFile).includes("@helvety/ui/icon-size")
    ) {
      failures.push(
        `${rowFile}: import ICON_SIZE_CLASS from @helvety/ui/icon-size`
      );
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

const upscaler = resolve(
  appsDir,
  "image-upscaler",
  "components",
  "helvety-image-upscaler.tsx"
);
if (
  existsSync(upscaler) &&
  !read(upscaler).includes("@helvety/ui/public-tool-workspace")
) {
  failures.push(`${upscaler}: import public-tool-workspace constants`);
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
  console.error("UI actions consistency failed:\n");
  for (const failure of failures) {
    console.error(`  - ${failure}`);
  }
  process.exit(1);
}

console.log("UI actions consistency checks passed.");
