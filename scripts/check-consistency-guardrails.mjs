/**
 * Cross-workspace consistency checks for `bun run ci:check` (`bun run consistency:guardrails`).
 * Covers invariants that are awkward for ESLint alone (legal dates, security.txt,
 * shared action limits, etc.) and enforces root `app/page.tsx` default export name
 * `Page` per `docs/naming-conventions.md`.
 *
 * Sibling repo checks live under root `consistency:*` scripts (env template keys,
 * manifest vs SEO blurbs, proxy readme sync, toolchain docs, retired extension
 * product naming, lifecycle package.json scripts, test hygiene).
 *
 * Zone `proxy.ts` files must inline the same `config.matcher` string as
 * `SECURITY_PROXY_MATCHER` in `packages/shared/src/proxy.ts` (Next.js requires a
 * static literal, not an imported binding). `apps/web/proxy.ts` uses a custom
 * matcher but must keep the same static-file extension exclusions (e.g. `mjs`,
 * `wasm`, `json`).
 */
import { constants, existsSync } from "node:fs";
import { access, readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { validatePostcssZoneApps } from "./postcss-app-expectations.mjs";

const rootDir = process.cwd();
const appsDir = resolve(rootDir, "apps");

/** Recursively lists `.ts` files under an app `app/actions` directory. */
async function collectActionFiles(actionsDir) {
  const files = [];
  async function walk(dir) {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch (error) {
      if (error && typeof error === "object" && error.code === "ENOENT") {
        return;
      }
      throw error;
    }
    for (const entry of entries) {
      const fullPath = resolve(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
        continue;
      }
      if (entry.isFile() && entry.name.endsWith(".ts")) {
        files.push(fullPath);
      }
    }
  }
  await walk(actionsDir);
  return files;
}

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

/** Fails if any `.tsx` file under `directory` uses the Radix `asChild` prop. */
async function assertNoAsChildProp(directory) {
  if (!existsSync(directory)) {
    return;
  }
  const files = await listTsxFiles(directory);
  for (const filePath of files) {
    const source = await readFile(filePath, "utf8");
    if (/\basChild\b/.test(source)) {
      throw new Error(
        `${filePath} uses asChild; migrate to Base UI render/nativeButton.`
      );
    }
  }
}

const filesToCheck = [
  "apps/contacts/app/actions/batch-actions.ts",
  "apps/links/app/actions/batch-actions.ts",
  "apps/notes/app/actions/batch-actions.ts",
  "apps/tasks/app/actions/batch-actions.ts",
  "apps/auth/lib/login-email-bootstrap.ts",
  "apps/auth/app/actions/otp-actions.ts",
  "apps/store/lib/rate-limit.ts",
  "apps/store/lib/packages/create-package-download.ts",
  "apps/store/app/actions/account-actions.ts",
  "apps/tasks/app/actions/entity-actions.ts",
  "apps/links/app/actions/entity-actions.ts",
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
    !/Public package download requests:\s*2 per minute per IP/.test(
      storeRateLimit.content
    )
  ) {
    throw new Error(
      "apps/store/lib/rate-limit.ts must document DOWNLOADS as per IP to match implementation."
    );
  }

  const packageDownload = contents.find((item) =>
    item.relativePath.endsWith(
      "apps/store/lib/packages/create-package-download.ts"
    )
  );
  if (
    packageDownload &&
    !/Caller must enforce IP rate limits/.test(packageDownload.content)
  ) {
    throw new Error(
      "apps/store/lib/packages/create-package-download.ts must document that the route enforces IP rate limits before signing."
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
    "apps/image-editor/app/page.tsx",
    "apps/links/app/page.tsx",
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
    "apps/image-upscaler/proxy.ts",
    "apps/image-editor/proxy.ts",
    "apps/links/proxy.ts",
    "apps/notes/proxy.ts",
    "apps/pdf/proxy.ts",
    "apps/store/proxy.ts",
    "apps/tasks/proxy.ts",
  ];
  const sharedProxySource = await readFile(
    resolve(rootDir, "packages/shared/src/proxy.ts"),
    "utf8"
  );
  /** @returns {string | null} */
  function parseSecurityProxyMatcherPattern(source) {
    const multiline = source.match(
      /export const SECURITY_PROXY_MATCHER = \[\s*\r?\n\s*["']([^"']+)["']/
    );
    if (multiline?.[1]) return multiline[1];
    const singleLine = source.match(
      /export const SECURITY_PROXY_MATCHER = \[\s*["']([^"']+)["']\s*\]/
    );
    return singleLine?.[1] ?? null;
  }
  const canonicalZoneMatcherPattern =
    parseSecurityProxyMatcherPattern(sharedProxySource);
  if (!canonicalZoneMatcherPattern) {
    throw new Error(
      "Could not parse SECURITY_PROXY_MATCHER string from packages/shared/src/proxy.ts (expected multiline or single-line export)."
    );
  }
  const securityProxyContents = await Promise.all(
    securityProxyTargets.map(async (relativePath) => ({
      relativePath,
      content: await readFile(resolve(rootDir, relativePath), "utf8"),
    }))
  );
  for (const file of securityProxyContents) {
    if (/import\s*\{[^}]*\bSECURITY_PROXY_MATCHER\b/.test(file.content)) {
      throw new Error(
        `${file.relativePath} must not import SECURITY_PROXY_MATCHER: Next.js requires config.matcher to use a static string literal in proxy.ts. Inline the same pattern as packages/shared/src/proxy.ts (verified below).`
      );
    }
    const zoneMatcherMatch = file.content.match(
      /matcher:\s*\[\s*["']([^"']+)["']\s*,?\s*\]/
    );
    if (zoneMatcherMatch?.[1] !== canonicalZoneMatcherPattern) {
      throw new Error(
        `${file.relativePath} config.matcher[0] must equal SECURITY_PROXY_MATCHER[0] in packages/shared/src/proxy.ts.`
      );
    }
  }

  const webProxyPath = "apps/web/proxy.ts";
  const webProxyContent = await readFile(
    resolve(rootDir, webProxyPath),
    "utf8"
  );
  const webMatcherMatch = webProxyContent.match(
    /matcher:\s*\[\s*["']([^"']+)["']\s*,?\s*\]/
  );
  if (!webMatcherMatch?.[1]) {
    throw new Error(
      `${webProxyPath} must export a config.matcher array with a single string pattern.`
    );
  }
  const webMatcherPattern = webMatcherMatch[1];
  for (const ext of ["json", "mjs", "wasm"]) {
    if (!webMatcherPattern.includes(ext)) {
      throw new Error(
        `${webProxyPath} matcher must exclude static .${ext} files (same baseline as SECURITY_PROXY_MATCHER).`
      );
    }
  }
  const zoneExtGroupMatch =
    canonicalZoneMatcherPattern.match(/(\(\?:svg\|[^)]+\))/);
  if (
    zoneExtGroupMatch?.[1] &&
    !webMatcherPattern.includes(zoneExtGroupMatch[1])
  ) {
    throw new Error(
      `${webProxyPath} matcher must include the same static file-extension group as zone SECURITY_PROXY_MATCHER (found gap vs ${zoneExtGroupMatch[1]}).`
    );
  }

  const adminServerUpstashEnvModules = [
    "apps/auth/lib/env.ts",
    "apps/store/lib/env.ts",
  ];
  const userScopedEnvModules = [
    "apps/contacts/lib/env.ts",
    "apps/links/lib/env.ts",
    "apps/notes/lib/env.ts",
    "apps/tasks/lib/env.ts",
  ];
  const upstashCookieEnvModules = [
    "apps/pdf/lib/env.ts",
    "apps/image-upscaler/lib/env.ts",
    "apps/image-editor/lib/env.ts",
  ];

  const adminServerUpstashEnvContents = await Promise.all(
    adminServerUpstashEnvModules.map(async (relativePath) => ({
      relativePath,
      content: await readFile(resolve(rootDir, relativePath), "utf8"),
    }))
  );
  for (const file of adminServerUpstashEnvContents) {
    if (
      !/validateServerUpstashEnv\(|createAppServerUpstashEnv\(/.test(
        file.content
      )
    ) {
      throw new Error(
        `${file.relativePath} must validate env via validateServerUpstashEnv or createAppServerUpstashEnv from @helvety/shared/env-validation.`
      );
    }
    if (!/serverUpstashMergedSchema|authEnvSchema/.test(file.content)) {
      throw new Error(
        `${file.relativePath} must use an admin-tier env schema (serverUpstashMergedSchema or authEnvSchema).`
      );
    }
  }

  const userScopedEnvContents = await Promise.all(
    userScopedEnvModules.map(async (relativePath) => ({
      relativePath,
      content: await readFile(resolve(rootDir, relativePath), "utf8"),
    }))
  );
  for (const file of userScopedEnvContents) {
    if (
      !/validateUpstashCookieEnv\(|createAppUserScopedE2eeEnv\(|createAppUpstashCookieEnv\(/.test(
        file.content
      )
    ) {
      throw new Error(
        `${file.relativePath} must validate env via createAppUserScopedE2eeEnv or createAppUpstashCookieEnv from @helvety/shared/env-validation.`
      );
    }
    if (/createAppUserScopedE2eeEnv\(/.test(file.content)) {
      continue;
    }
    if (!/upstashCookieSigningEnvSchema/.test(file.content)) {
      throw new Error(
        `${file.relativePath} must use upstashCookieSigningEnvSchema (no admin client).`
      );
    }
  }

  const upstashCookieEnvContents = await Promise.all(
    upstashCookieEnvModules.map(async (relativePath) => ({
      relativePath,
      content: await readFile(resolve(rootDir, relativePath), "utf8"),
    }))
  );
  for (const file of upstashCookieEnvContents) {
    if (
      !/validateUpstashCookieEnv\(|createAppUpstashCookieEnv\(/.test(
        file.content
      )
    ) {
      throw new Error(
        `${file.relativePath} must validate env via createAppUpstashCookieEnv from @helvety/shared/env-validation.`
      );
    }
    if (!/upstashCookieSigningEnvSchema/.test(file.content)) {
      throw new Error(
        `${file.relativePath} must use upstashCookieSigningEnvSchema (Upstash + cookie signing).`
      );
    }
  }

  const csrfEnvTemplateApps = [
    "auth",
    "store",
    "tasks",
    "contacts",
    "notes",
    "links",
    "pdf",
    "image-upscaler",
    "image-editor",
  ];
  for (const app of csrfEnvTemplateApps) {
    const templatePath = `apps/${app}/env.template`;
    const templateContent = await readFile(
      resolve(rootDir, templatePath),
      "utf8"
    );
    if (!/HELVETY_COOKIE_SIGNING_SECRET=/.test(templateContent)) {
      throw new Error(
        `${templatePath} must document HELVETY_COOKIE_SIGNING_SECRET (required for CSRF proxy bootstrap/re-issue).`
      );
    }
    if (
      /SUPABASE_SECRET_KEY.*cookie signing|cookie signing.*SUPABASE_SECRET_KEY/i.test(
        templateContent
      )
    ) {
      throw new Error(
        `${templatePath} must not suggest SUPABASE_SECRET_KEY as a substitute for HELVETY_COOKIE_SIGNING_SECRET.`
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
    style: "base-vega",
    rsc: true,
    tsx: true,
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
    if (parsed.rsc !== requiredShadcnConfig.rsc) {
      throw new Error(`${file.relativePath} must set rsc: true.`);
    }
    if (parsed.tsx !== requiredShadcnConfig.tsx) {
      throw new Error(`${file.relativePath} must set tsx: true.`);
    }
    if (typeof parsed.registries !== "object" || parsed.registries === null) {
      throw new Error(`${file.relativePath} must declare a registries object.`);
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
    if (localUiImports.length > 0) {
      const relativePath = tsxPath.replace(`${rootDir}/`, "");
      throw new Error(
        `${relativePath} imports app-local UI primitives. Use @helvety/ui/* for shared primitives.`
      );
    }
    if (/<select[\s/>]/.test(source)) {
      const relativePath = tsxPath.replace(`${rootDir}/`, "");
      throw new Error(
        `${relativePath} uses raw <select>. Use NativeSelect from @helvety/ui/native-select.`
      );
    }
    if (/<textarea[\s/>]/.test(source)) {
      const relativePath = tsxPath.replace(`${rootDir}/`, "");
      throw new Error(
        `${relativePath} uses raw <textarea>. Use Textarea from @helvety/ui/textarea.`
      );
    }
  }

  const extensionRoot = resolve(
    rootDir,
    "..",
    "helvety-browser-extension-chromium"
  );
  try {
    await access(extensionRoot, constants.F_OK);
    const extensionPopupTsx = await listTsxFiles(
      resolve(extensionRoot, "src/popup")
    );
    for (const tsxPath of extensionPopupTsx) {
      const source = await readFile(tsxPath, "utf8");
      if (/<select[\s/>]/.test(source)) {
        const relativePath = tsxPath.replace(`${extensionRoot}/`, "");
        throw new Error(
          `helvety-browser-extension-chromium/${relativePath} uses raw <select>. Use NativeSelect from @helvety/ui/native-select.`
        );
      }
      if (/<textarea[\s/>]/.test(source)) {
        const relativePath = tsxPath.replace(`${extensionRoot}/`, "");
        throw new Error(
          `helvety-browser-extension-chromium/${relativePath} uses raw <textarea>. Use Textarea from @helvety/ui/textarea.`
        );
      }
      if (/from\s+["'][^"']*\/components\/Textarea["']/u.test(source)) {
        const relativePath = tsxPath.replace(`${extensionRoot}/`, "");
        throw new Error(
          `helvety-browser-extension-chromium/${relativePath} imports local Textarea. Use @helvety/ui/textarea.`
        );
      }
    }
    try {
      await access(
        resolve(extensionRoot, "src/popup/components/Textarea.tsx"),
        constants.F_OK
      );
      throw new Error(
        "helvety-browser-extension-chromium/src/popup/components/Textarea.tsx must be removed; use @helvety/ui/textarea."
      );
    } catch (error) {
      if (!(error && typeof error === "object" && error.code === "ENOENT")) {
        throw error;
      }
    }
    const extensionGlobals = await readFile(
      resolve(extensionRoot, "src/globals.css"),
      "utf8"
    );
    if (
      !extensionGlobals.includes('@import "@helvety/ui/globals.css"') &&
      !extensionGlobals.includes('@import "@helvety/ui/form-control-touch.css"')
    ) {
      throw new Error(
        "helvety-browser-extension-chromium/src/globals.css must import @helvety/ui/globals.css (or @helvety/ui/form-control-touch.css)."
      );
    }
    if (
      !extensionGlobals.includes(
        '@import "@helvety/extension-chrome/extension-tokens.css"'
      )
    ) {
      throw new Error(
        "helvety-browser-extension-chromium/src/globals.css must import @helvety/extension-chrome/extension-tokens.css (canonical OKLCH profile)."
      );
    }
    if (extensionGlobals.includes("./popup/extension-tokens.css")) {
      throw new Error(
        "helvety-browser-extension-chromium must not use a local extension-tokens.css fork; use @helvety/extension-chrome/extension-tokens.css."
      );
    }
    await assertNoAsChildProp(resolve(extensionRoot, "src/popup"));
  } catch (error) {
    if (!(error && typeof error === "object" && error.code === "ENOENT")) {
      throw error;
    }
  }

  const proxyMatcherComment =
    "Must stay identical to `SECURITY_PROXY_MATCHER` in `@helvety/shared/proxy`";
  for (const entry of appDirectories.filter((item) => item.isDirectory())) {
    const proxyPath = resolve(rootDir, "apps", entry.name, "proxy.ts");
    const proxySource = await readFile(proxyPath, "utf8");
    if (
      proxySource.includes("createAppProxy") &&
      proxySource.includes("export const config") &&
      !proxySource.includes(proxyMatcherComment)
    ) {
      throw new Error(
        `apps/${entry.name}/proxy.ts must document SECURITY_PROXY_MATCHER parity above config.matcher (see apps/pdf/proxy.ts).`
      );
    }

    const layoutShellTestPath = resolve(
      rootDir,
      "apps",
      entry.name,
      "app/layout-shell-providers.test.ts"
    );
    const layoutShellTest = await readFile(layoutShellTestPath, "utf8");
    for (const forbidden of [
      "@helvety/light-pillar",
      "HelvetyShellWithLightPillarBackdrop",
    ]) {
      if (!layoutShellTest.includes(forbidden)) {
        throw new Error(
          `apps/${entry.name}/app/layout-shell-providers.test.ts must assert layouts do not use ${forbidden}.`
        );
      }
    }
  }

  const e2eeApps = ["contacts", "tasks", "notes", "links"];
  for (const appName of e2eeApps) {
    const layoutShellTestPath = resolve(
      rootDir,
      "apps",
      appName,
      "app/layout-shell-providers.test.ts"
    );
    const layoutShellTest = await readFile(layoutShellTestPath, "utf8");
    if (!layoutShellTest.includes("E2eeAppRootLayout")) {
      throw new Error(
        `apps/${appName}/app/layout-shell-providers.test.ts must assert E2eeAppRootLayout usage.`
      );
    }
    if (!layoutShellTest.includes("encryptionProvider={EncryptionProvider}")) {
      throw new Error(
        `apps/${appName}/app/layout-shell-providers.test.ts must assert encryptionProvider={EncryptionProvider}.`
      );
    }
  }

  const publicToolApps = ["pdf", "image-upscaler", "image-editor"];
  for (const appName of publicToolApps) {
    const layoutShellTestPath = resolve(
      rootDir,
      "apps",
      appName,
      "app/layout-shell-providers.test.ts"
    );
    const layoutShellTest = await readFile(layoutShellTestPath, "utf8");
    if (!layoutShellTest.includes("HelvetyPublicShellRootLayout")) {
      throw new Error(
        `apps/${appName}/app/layout-shell-providers.test.ts must assert HelvetyPublicShellRootLayout usage.`
      );
    }
    if (!layoutShellTest.includes("bootstrapPublicLayoutUser")) {
      throw new Error(
        `apps/${appName}/app/layout-shell-providers.test.ts must assert bootstrapPublicLayoutUser session bootstrap.`
      );
    }
  }

  const userScopedEnvComment =
    "See repository root `README.md` → Automation (`ci:release`).";
  for (const appName of [
    "contacts",
    "tasks",
    "notes",
    "links",
    "store",
    "pdf",
    "image-upscaler",
    "image-editor",
  ]) {
    const envPath = resolve(rootDir, "apps", appName, "lib/env.ts");
    const envSource = await readFile(envPath, "utf8");
    if (!envSource.includes(userScopedEnvComment)) {
      throw new Error(
        `apps/${appName}/lib/env.ts must document SKIP_ENV_VALIDATION / ci:release (match other validated env zones).`
      );
    }
  }

  for (const entry of appDirectories.filter((item) => item.isDirectory())) {
    const actionsDir = resolve(appsDir, entry.name, "app/actions");
    const actionFiles = await collectActionFiles(actionsDir);
    for (const actionPath of actionFiles) {
      const relativePath = actionPath.replace(`${rootDir}/`, "");
      const source = await readFile(actionPath, "utf8");
      if (
        /["']use server["']/.test(source) &&
        !/import\s+["']server-only["']/.test(source)
      ) {
        throw new Error(
          `${relativePath} must import "server-only" when using "use server".`
        );
      }
    }
  }

  const postcssErrors = await validatePostcssZoneApps(rootDir);
  if (postcssErrors.length > 0) {
    throw new Error(postcssErrors.join("\n"));
  }

  const qualityBaselinePath = resolve(
    rootDir,
    "docs/quality-modernization-baseline.md"
  );
  const qualityBaseline = await readFile(qualityBaselinePath, "utf8");
  if (
    !/Omit `assetPrefix`[\s\S]*\bstore, pdf, image-upscaler, image-editor\b/.test(
      qualityBaseline
    )
  ) {
    throw new Error(
      `${qualityBaselinePath} must list public tool zones that omit assetPrefix by default.`
    );
  }

  try {
    await access(resolve(rootDir, ".github/workflows"), constants.F_OK);
    throw new Error(
      ".github/workflows must not exist (Helvety uses local ci:check/ci:release and Vercel builds only)."
    );
  } catch (error) {
    if (!(error && typeof error === "object" && error.code === "ENOENT")) {
      throw error;
    }
  }

  const automationDocPaths = [
    "README.md",
    "docs/README.md",
    "docs/app-consistency-checklist.md",
    "docs/quality-modernization-baseline.md",
    "docs/dependency-inventory.md",
    "docs/security-review-runbook.md",
    "docs/vercel-monorepo-apps.md",
    "docs/naming-conventions.md",
    "docs/legal-change-guardrails.md",
  ];
  const staleAutomationPhrases = [
    "GitHub Actions",
    ".github/workflows/ci.yml",
    ".github/workflows/",
    "Remote CI:",
    "## Automated (CI)",
    "## CI guardrail",
    "Optional CI/monorepo",
    "CI guards this",
    "CI checks expected",
    "CI guardrails keep",
    "Enforced in CI",
  ];
  for (const relativePath of automationDocPaths) {
    const source = await readFile(resolve(rootDir, relativePath), "utf8");
    for (const phrase of staleAutomationPhrases) {
      if (source.includes(phrase)) {
        throw new Error(
          `${relativePath} must not use stale automation wording (${phrase}). Helvety uses local ci:check/ci:release and Vercel builds only.`
        );
      }
    }
  }

  const appEntries = await readdir(appsDir, { withFileTypes: true });
  for (const entry of appEntries.filter((item) => item.isDirectory())) {
    const readmePath = resolve(appsDir, entry.name, "README.md");
    let source;
    try {
      source = await readFile(readmePath, "utf8");
    } catch (error) {
      if (error && typeof error === "object" && error.code === "ENOENT") {
        continue;
      }
      throw error;
    }
    for (const phrase of [
      "Optional CI/monorepo",
      "CI guardrails keep",
      "For monorepo setup and CI/release",
    ]) {
      if (source.includes(phrase)) {
        throw new Error(
          `apps/${entry.name}/README.md must not use stale automation wording (${phrase}).`
        );
      }
    }
  }

  const lockfilePath = resolve(rootDir, "bun.lock");
  const lockfile = await readFile(lockfilePath, "utf8");
  const forbiddenRadixPatterns = [/"radix-ui@/, /"@radix-ui\//, /"cmdk@/];
  for (const pattern of forbiddenRadixPatterns) {
    if (pattern.test(lockfile)) {
      throw new Error(
        `bun.lock must not contain Radix or cmdk packages (${pattern}). Migrate to @base-ui/react and remove cmdk.`
      );
    }
  }

  const asChildScanRoots = [
    resolve(rootDir, "packages/ui/src"),
    resolve(rootDir, "packages/extension-chrome/src"),
    resolve(rootDir, "apps"),
  ];
  for (const scanRoot of asChildScanRoots) {
    await assertNoAsChildProp(scanRoot);
  }

  console.log("Consistency guardrail checks passed.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
