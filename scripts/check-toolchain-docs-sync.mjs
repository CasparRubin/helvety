/**
 * Keeps documented toolchain versions aligned with manifests:
 * - Root `packageManager` (Bun) ↔ README prerequisites
 * - `apps/web` `next` semver ↔ Next.js doc deep link in `docs/naming-conventions.md`
 * - Root `ci:check` script order (all steps) ↔ README Automation bullet
 * - Tailwind/PostCSS Vercel docs ↔ packages/ui and dev-deps READMEs
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
      'apps/web/package.json dependencies.next must use a caret minimum with three-part semver (e.g. "^16.2.9").'
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

  const ciCheckFromPackage = ciCheckScript
    .split("&&")
    .map((part) => part.trim())
    .map((part) => {
      const match = part.match(/^bun run ([\w:-]+)$/);
      return match ? match[1] : null;
    })
    .filter(Boolean);

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

  const orderIndex = ciCheckLine.indexOf("in order:");
  const ciCheckFromReadme = [
    ...ciCheckLine.slice(orderIndex).matchAll(/`([\w:-]+)`/g),
  ].map((match) => match[1]);

  if (ciCheckFromPackage.join("|") !== ciCheckFromReadme.join("|")) {
    throw new Error(
      `README.md ci:check steps are out of sync with package.json.\n` +
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
  if (!/@helvety\/ui[\s\S]*@tailwindcss\/postcss/.test(devDepsReadme)) {
    throw new Error(
      "packages/dev-deps/README.md must document @helvety/ui production tailwindcss / @tailwindcss/postcss exception."
    );
  }

  const uiReadme = await readFile(
    resolve(rootDir, "packages/ui/README.md"),
    "utf8"
  );
  if (!uiReadme.includes("## Styling / Tailwind")) {
    throw new Error(
      "packages/ui/README.md must document Styling / Tailwind and Vercel PostCSS resolution."
    );
  }

  const rootReadme = await readFile(resolve(rootDir, "README.md"), "utf8");
  if (
    !/packages\/ui\/[\s\S]*@tailwindcss\/postcss|@tailwindcss\/postcss[\s\S]*packages\/ui/.test(
      rootReadme
    )
  ) {
    throw new Error(
      "README.md Shared Packages table must document @helvety/ui production @tailwindcss/postcss for Vercel builds."
    );
  }

  console.log("Toolchain documentation sync checks passed.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
