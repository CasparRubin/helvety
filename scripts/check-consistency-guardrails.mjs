import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const rootDir = process.cwd();

const filesToCheck = [
  "apps/contacts/app/actions/batch-actions.ts",
  "apps/notes/app/actions/batch-actions.ts",
  "apps/tasks/app/actions/batch-actions.ts",
  "apps/auth/lib/login-email-bootstrap.ts",
  "apps/auth/app/actions/otp-actions.ts",
];

async function main() {
  const contents = await Promise.all(
    filesToCheck.map(async (relativePath) => ({
      relativePath,
      content: await readFile(resolve(rootDir, relativePath), "utf8"),
    }))
  );

  for (const file of contents.slice(0, 3)) {
    if (/const\s+MAX_DASHBOARD_ROWS\s*=/.test(file.content)) {
      throw new Error(
        `${file.relativePath} must use ACTION_LIMITS.MAX_DASHBOARD_ROWS instead of local MAX_DASHBOARD_ROWS constants.`
      );
    }
  }

  const loginBootstrap = contents.find((item) =>
    item.relativePath.endsWith("login-email-bootstrap.ts")
  );
  if (
    loginBootstrap &&
    /step:\s*"encryption-setup"\s*\|\s*"passkey-signin"/.test(
      loginBootstrap.content
    )
  ) {
    throw new Error(
      "apps/auth/lib/login-email-bootstrap.ts must use RequiredAuthStep instead of an inline auth-step union."
    );
  }

  const otpActions = contents.find((item) =>
    item.relativePath.endsWith("otp-actions.ts")
  );
  if (
    otpActions &&
    /nextStep:\s*"encryption-setup"\s*\|\s*"passkey-signin"/.test(
      otpActions.content
    )
  ) {
    throw new Error(
      "apps/auth/app/actions/otp-actions.ts must use RequiredAuthStep instead of an inline auth-step union."
    );
  }

  console.log("Consistency guardrail checks passed.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
