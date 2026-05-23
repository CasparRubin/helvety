/**
 * Ensures each zone app's vercel.json and env.template match the monorepo
 * Vercel deployment contract (Root Directory = apps/<slug>, Next.js preset).
 *
 * Run: `bun run consistency:vercel-apps`
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  CANONICAL_VERCEL_JSON,
  VERCEL_APP_EXPECTATIONS,
} from "./vercel-app-expectations.mjs";

const rootDir = process.cwd();

async function main() {
  const errors = [];

  for (const [appSlug, expectation] of Object.entries(
    VERCEL_APP_EXPECTATIONS
  )) {
    const vercelJsonPath = `apps/${appSlug}/vercel.json`;
    const envTemplatePath = `apps/${appSlug}/env.template`;

    let vercelParsed;
    try {
      const vercelRaw = await readFile(
        resolve(rootDir, vercelJsonPath),
        "utf8"
      );
      vercelParsed = JSON.parse(vercelRaw);
    } catch {
      errors.push(`${vercelJsonPath} is missing or invalid JSON.`);
      continue;
    }

    const vercelJson = JSON.stringify(vercelParsed);
    const canonicalJson = JSON.stringify(CANONICAL_VERCEL_JSON);
    if (vercelJson !== canonicalJson) {
      errors.push(
        `${vercelJsonPath} must match the canonical zone config (${canonicalJson}). ` +
          `Do not set custom install/build commands; set Vercel Root Directory to ${expectation.rootDirectory} instead.`
      );
    }

    let envTemplate;
    try {
      envTemplate = await readFile(resolve(rootDir, envTemplatePath), "utf8");
    } catch {
      errors.push(`${envTemplatePath} is missing.`);
      continue;
    }

    const projectLine = `# Helvety ${expectation.displayName} - Vercel project: ${expectation.vercelProject}`;
    if (!envTemplate.includes(projectLine)) {
      errors.push(
        `${envTemplatePath} must include the Vercel project line:\n  ${projectLine}`
      );
    }

    const rootLine = `# Vercel Root Directory: ${expectation.rootDirectory}`;
    if (!envTemplate.includes(rootLine)) {
      errors.push(
        `${envTemplatePath} must document:\n  ${rootLine}`
      );
    }

    for (const forbidden of expectation.forbiddenRootDirectories ?? []) {
      const badRootLine = `# Vercel Root Directory: ${forbidden}`;
      if (envTemplate.includes(badRootLine)) {
        errors.push(
          `${envTemplatePath} must not suggest Root Directory "${forbidden}".`
        );
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(errors.join("\n"));
  }

  console.log(
    `Vercel app config consistency checks passed (${Object.keys(VERCEL_APP_EXPECTATIONS).length} apps).`
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
