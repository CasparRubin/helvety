/**
 * Keeps documented toolchain versions aligned with manifests:
 * - Root `packageManager` (Bun) ↔ README prerequisites
 * - `apps/web` `next` semver ↔ Next.js doc deep link in `docs/naming-conventions.md`
 * - Root `ci:check` script order ↔ README Automation bullet
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
      'apps/web/package.json dependencies.next must use a caret minimum like "^16.2.6" (three-part semver after ^).'
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

  const ciCheckScript = rootPackage.scripts?.["ci:check"];
  if (typeof ciCheckScript !== "string") {
    throw new Error('Root package.json must define a "ci:check" script.');
  }

  const ciCheckFromPackage = [
    ...ciCheckScript.matchAll(/consistency:[\w-]+/g),
  ].map((match) => match[0]);

  const ciCheckLine = readme
    .split("\n")
    .find(
      (line) =>
        line.includes("`bun run ci:check`") && line.includes("in order:")
    );

  if (!ciCheckLine) {
    throw new Error(
      "README.md Automation must document ci:check step order (bun run ci:check ... in order: ...)."
    );
  }

  const ciCheckFromReadme = [
    ...ciCheckLine.matchAll(/`consistency:[^`]+`/g),
  ].map((match) => match[0].slice(1, -1));

  if (ciCheckFromPackage.join("|") !== ciCheckFromReadme.join("|")) {
    throw new Error(
      `README.md ci:check consistency steps are out of sync with package.json.\n` +
        `  package.json: ${ciCheckFromPackage.join(", ")}\n` +
        `  README.md:    ${ciCheckFromReadme.join(", ")}`
    );
  }

  const devDepsReadme = await readFile(
    resolve(rootDir, "packages/dev-deps/README.md"),
    "utf8"
  );
  if (!/\bci:check\b/.test(devDepsReadme)) {
    throw new Error(
      "packages/dev-deps/README.md must state that deps:drift runs in root ci:check."
    );
  }

  console.log("Toolchain documentation sync checks passed.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
