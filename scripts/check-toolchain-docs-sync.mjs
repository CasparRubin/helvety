/**
 * Keeps documented toolchain versions aligned with manifests:
 * - Root `packageManager` (Bun) ↔ README prerequisites
 * - `apps/web` `next` semver ↔ Next.js doc deep link in `docs/naming-conventions.md`
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const rootDir = process.cwd();

async function main() {
  const rootPackage = JSON.parse(
    await readFile(resolve(rootDir, "package.json"), "utf8")
  );
  const packageManager = rootPackage.packageManager;
  const bunMatch =
    typeof packageManager === "string"
      ? packageManager.match(/^bun@(.+)$/)
      : null;
  if (!bunMatch) {
    throw new Error(
      'Root package.json must set "packageManager" to "bun@x.y.z".'
    );
  }
  const bunVersion = bunMatch[1];

  const readme = await readFile(resolve(rootDir, "README.md"), "utf8");
  const readmeBun = new RegExp(
    `\\[Bun\\]\\(https://bun\\.sh/\\)\\s+\`${bunVersion.replaceAll(".", "\\.")}\``
  );
  if (!readmeBun.test(readme)) {
    throw new Error(
      `README.md prerequisites must list Bun \`${bunVersion}\` to match packageManager.`
    );
  }

  const webPackage = JSON.parse(
    await readFile(resolve(rootDir, "apps/web/package.json"), "utf8")
  );
  const nextSpec = webPackage.dependencies?.next;
  const nextMatch =
    typeof nextSpec === "string" ? nextSpec.match(/^\^(\d+\.\d+\.\d+)/) : null;
  if (!nextMatch) {
    throw new Error(
      'apps/web/package.json dependencies.next must use a caret minimum like "^16.2.4".'
    );
  }
  const nextDocTag = `v${nextMatch[1]}`;
  const namingPath = resolve(rootDir, "docs/naming-conventions.md");
  const naming = await readFile(namingPath, "utf8");
  const expectedSubpath = `blob/${nextDocTag}/docs/`;
  if (!naming.includes(expectedSubpath)) {
    throw new Error(
      `${namingPath} must link to Next.js docs at \`${expectedSubpath}\` to match apps/web next (${nextSpec}).`
    );
  }

  console.log("Toolchain documentation sync checks passed.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
