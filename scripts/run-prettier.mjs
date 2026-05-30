/**
 * Run Prettier from @helvety/dev-deps so prettier-plugin-tailwindcss resolves.
 * Usage: node scripts/run-prettier.mjs --check | --write [extra prettier args...]
 */
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);
const devDepsDir = path.join(rootDir, "packages", "dev-deps");
const devDepsRequire = createRequire(path.join(devDepsDir, "package.json"));
const prettierBin = devDepsRequire.resolve("prettier/bin/prettier.cjs");

const args = process.argv.slice(2);
if (args.length === 0 || !["--check", "--write"].includes(args[0])) {
  console.error(
    "Usage: node scripts/run-prettier.mjs --check|--write [prettier options...]"
  );
  process.exit(1);
}

const nodePath = [
  path.join(rootDir, "node_modules"),
  path.join(devDepsDir, "node_modules"),
  process.env.NODE_PATH,
]
  .filter(Boolean)
  .join(path.delimiter);

const result = spawnSync(process.execPath, [prettierBin, ...args, "."], {
  cwd: rootDir,
  env: { ...process.env, NODE_PATH: nodePath },
  stdio: "inherit",
});

process.exit(result.status ?? 1);
