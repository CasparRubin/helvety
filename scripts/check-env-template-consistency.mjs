/**
 * Ensures each app env.template documents exactly the env vars that app validates
 * or requires at build/runtime (see lib/env.ts, apps/web/next.config.ts).
 */
import {
  EXPECTED_KEYS_BY_APP,
  validateEnvTemplates,
  validateTurboGatewayBuildEnv,
} from "./env-template-expectations.mjs";

const rootDir = process.cwd();

async function main() {
  const errors = [
    ...(await validateEnvTemplates(rootDir)),
    ...(await validateTurboGatewayBuildEnv(rootDir)),
  ];

  if (errors.length > 0) {
    throw new Error(errors.join("\n"));
  }

  console.log(
    `Env template consistency checks passed (${Object.keys(EXPECTED_KEYS_BY_APP).length} apps, turbo gateway env).`
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
