/**
 * Cross-workspace consistency checks for CI (`bun run consistency:guardrails`).
 * Covers invariants that are awkward for ESLint alone (legal dates, security.txt,
 * shared action limits, etc.) and enforces root `app/page.tsx` default export name
 * `Page` per `docs/naming-conventions.md`.
 *
 * Sibling repo checks live under root `consistency:*` scripts (manifest vs SEO blurbs,
 * proxy readme sync, toolchain docs, lifecycle package.json scripts, test hygiene).
 */
import { readFile } from "node:fs/promises";
import { readdir } from "node:fs/promises";
import { resolve } from "node:path";

const rootDir = process.cwd();
const appsDir = resolve(rootDir, "apps");

async function listTsxFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolutePath = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listTsxFiles(absolutePath)));
      continue;
    }
    if (entry.isFile() && absolutePath.endsWith(".tsx")) {
      files.push(absolutePath);
    }
  }
  return files;
}

const filesToCheck = [
  "apps/contacts/app/actions/batch-actions.ts",
  "apps/notes/app/actions/batch-actions.ts",
  "apps/tasks/app/actions/batch-actions.ts",
  "apps/auth/lib/login-email-bootstrap.ts",
  "apps/auth/app/actions/otp-actions.ts",
  "apps/store/lib/rate-limit.ts",
  "apps/store/app/actions/download-actions.ts",
  "apps/store/app/actions/account-actions.ts",
  "apps/tasks/app/actions/entity-actions.ts",
  "apps/notes/app/actions/entity-actions.ts",
  "apps/contacts/app/actions/contact-actions.ts",
  "apps/web/app/privacy/page.tsx",
  "apps/web/app/terms/page.tsx",
  "apps/web/app/impressum/page.tsx",
  "apps/web/public/.well-known/security.txt",
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

  const legalCommentTargets = contents.filter((item) =>
    /app\/actions\/(account-actions|entity-actions|contact-actions)\.ts$/.test(
      item.relativePath
    )
  );
  for (const file of legalCommentTargets) {
    if (/Legal basis:\s*nDSG/i.test(file.content)) {
      throw new Error(
        `${file.relativePath} should not encode statutory legal-basis interpretations in implementation comments. Reference product legal docs instead.`
      );
    }
  }

  const storeRateLimit = contents.find((item) =>
    item.relativePath.endsWith("apps/store/lib/rate-limit.ts")
  );
  if (
    storeRateLimit &&
    !/Signed download URL generation:\s*10 per minute per IP/.test(
      storeRateLimit.content
    )
  ) {
    throw new Error(
      "apps/store/lib/rate-limit.ts must document DOWNLOAD_URL as per IP to match implementation."
    );
  }

  const downloadActions = contents.find((item) =>
    item.relativePath.endsWith("apps/store/app/actions/download-actions.ts")
  );
  if (
    downloadActions &&
    !/`download_url:ip:\$\{clientIp\}`|buildDownloadUrlRateLimitKey\(clientIp\)/.test(
      downloadActions.content
    )
  ) {
    throw new Error(
      "apps/store/app/actions/download-actions.ts must enforce DOWNLOAD_URL throttling with an IP-scoped key."
    );
  }

  const legalPages = contents.filter((item) =>
    /apps\/web\/app\/(privacy|terms|impressum)\/page\.tsx$/.test(
      item.relativePath
    )
  );
  const reviewedDates = legalPages.map((file) => {
    const match = file.content.match(/lastReviewed=\"([^\"]+)\"/);
    if (!match) {
      throw new Error(`${file.relativePath} must define a lastReviewed value.`);
    }
    return match[1];
  });
  if (new Set(reviewedDates).size !== 1) {
    throw new Error(
      "Legal pages must share the same lastReviewed value to avoid policy-date drift."
    );
  }

  const securityTxt = contents.find((item) =>
    item.relativePath.endsWith("apps/web/public/.well-known/security.txt")
  );
  if (securityTxt) {
    const expiresMatch = securityTxt.content.match(/^Expires:\s*(.+)$/m);
    if (!expiresMatch) {
      throw new Error(
        "apps/web/public/.well-known/security.txt must include an Expires field."
      );
    }
    const expiresDate = new Date(expiresMatch[1].trim());
    const now = new Date();
    if (Number.isNaN(expiresDate.getTime())) {
      throw new Error("security.txt Expires must be a valid ISO timestamp.");
    }
    const maxAheadMs = 370 * 24 * 60 * 60 * 1000;
    if (expiresDate.getTime() - now.getTime() > maxAheadMs) {
      throw new Error(
        "security.txt Expires is too far in the future; keep it within roughly 12 months."
      );
    }
  }

  const rootAppPagePaths = [
    "apps/auth/app/page.tsx",
    "apps/contacts/app/page.tsx",
    "apps/image-upscaler/app/page.tsx",
    "apps/notes/app/page.tsx",
    "apps/pdf/app/page.tsx",
    "apps/store/app/page.tsx",
    "apps/tasks/app/page.tsx",
    "apps/web/app/page.tsx",
  ];
  const rootAppPageContents = await Promise.all(
    rootAppPagePaths.map(async (relativePath) => ({
      relativePath,
      content: await readFile(resolve(rootDir, relativePath), "utf8"),
    }))
  );
  for (const file of rootAppPageContents) {
    if (!/export default (?:async )?function Page\b/.test(file.content)) {
      throw new Error(
        `${file.relativePath} must default-export a function named Page (see docs/naming-conventions.md).`
      );
    }
  }

  const securityProxyTargets = [
    "apps/auth/proxy.ts",
    "apps/contacts/proxy.ts",
    "apps/notes/proxy.ts",
    "apps/pdf/proxy.ts",
    "apps/store/proxy.ts",
    "apps/tasks/proxy.ts",
  ];
  const securityProxyContents = await Promise.all(
    securityProxyTargets.map(async (relativePath) => ({
      relativePath,
      content: await readFile(resolve(rootDir, relativePath), "utf8"),
    }))
  );
  const canonicalSecurityProxyMatcher =
    '"/((?!_next/static|_next/image|favicon.ico|.*\\\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest|txt|xml|map|woff2?)$).*)"';
  for (const file of securityProxyContents) {
    const hasCanonicalStaticMatcher =
      file.content.includes(canonicalSecurityProxyMatcher) &&
      file.content.includes("matcher: [");

    if (!hasCanonicalStaticMatcher) {
      throw new Error(
        `${file.relativePath} must define the canonical static SECURITY_PROXY_MATCHER required by Next.js proxy config.`
      );
    }
  }

  const envModules = [
    "apps/auth/lib/env.ts",
    "apps/contacts/lib/env.ts",
    "apps/notes/lib/env.ts",
    "apps/store/lib/env.ts",
    "apps/tasks/lib/env.ts",
  ];
  const envModuleContents = await Promise.all(
    envModules.map(async (relativePath) => ({
      relativePath,
      content: await readFile(resolve(rootDir, relativePath), "utf8"),
    }))
  );
  for (const file of envModuleContents) {
    if (!/validateServerUpstashEnv\(/.test(file.content)) {
      throw new Error(
        `${file.relativePath} must validate env via validateServerUpstashEnv from @helvety/shared/env-validation.`
      );
    }
  }

  const appDirectories = await readdir(appsDir, { withFileTypes: true });
  const componentConfigs = await Promise.all(
    appDirectories
      .filter((entry) => entry.isDirectory())
      .map(async (entry) => {
        const relativePath = `apps/${entry.name}/components.json`;
        return {
          relativePath,
          content: await readFile(resolve(rootDir, relativePath), "utf8"),
        };
      })
  );

  const requiredShadcnConfig = {
    style: "radix-vega",
    iconLibrary: "lucide",
    aliases: {
      components: "@/components",
      ui: "@/components/ui",
      utils: "@/lib/utils",
      lib: "@/lib",
      hooks: "@/hooks",
    },
    tailwind: {
      css: "app/globals.css",
      cssVariables: true,
    },
  };

  for (const file of componentConfigs) {
    const parsed = JSON.parse(file.content);
    if (parsed.style !== requiredShadcnConfig.style) {
      throw new Error(
        `${file.relativePath} must use style "${requiredShadcnConfig.style}".`
      );
    }
    if (parsed.iconLibrary !== requiredShadcnConfig.iconLibrary) {
      throw new Error(
        `${file.relativePath} must use iconLibrary "${requiredShadcnConfig.iconLibrary}".`
      );
    }
    if (
      parsed.tailwind?.css !== requiredShadcnConfig.tailwind.css ||
      parsed.tailwind?.cssVariables !==
        requiredShadcnConfig.tailwind.cssVariables
    ) {
      throw new Error(
        `${file.relativePath} must keep tailwind config aligned (css: app/globals.css, cssVariables: true).`
      );
    }

    for (const [key, value] of Object.entries(requiredShadcnConfig.aliases)) {
      if (parsed.aliases?.[key] !== value) {
        throw new Error(
          `${file.relativePath} must map aliases.${key} to "${value}".`
        );
      }
    }
  }

  const appComponentRoots = await Promise.all(
    appDirectories
      .filter((entry) => entry.isDirectory())
      .map(async (entry) =>
        listTsxFiles(resolve(rootDir, "apps", entry.name, "components"))
      )
  );

  for (const tsxPath of appComponentRoots.flat()) {
    const source = await readFile(tsxPath, "utf8");
    const localUiImports = [
      ...source.matchAll(/from\s+["']@\/components\/ui\/([^"']+)["'];?/gu),
      ...source.matchAll(/from\s+["']\.\.\/ui\/([^"']+)["'];?/gu),
    ];
    if (localUiImports.length === 0) {
      continue;
    }
    const onlyApprovedWrappers = localUiImports.every((match) =>
      /^(date-picker|date-time-picker)$/u.test(match[1] ?? "")
    );
    if (!onlyApprovedWrappers) {
      const relativePath = tsxPath.replace(`${rootDir}/`, "");
      throw new Error(
        `${relativePath} imports app-local UI primitives. Use @helvety/ui/* for shared primitives.`
      );
    }
  }

  console.log("Consistency guardrail checks passed.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
