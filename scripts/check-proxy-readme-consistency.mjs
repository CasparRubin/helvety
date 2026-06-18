import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const rootDir = process.cwd();

async function main() {
  const webProxyPath = resolve(rootDir, "apps/web/proxy.ts");
  const webReadmePath = resolve(rootDir, "apps/web/README.md");

  const [proxyContent, readmeContent] = await Promise.all([
    readFile(webProxyPath, "utf8"),
    readFile(webReadmePath, "utf8"),
  ]);

  const usesPublicMarketingProfile =
    /createProfiledSecurityProxy\("public-marketing"\)/.test(proxyContent);
  const csrfDisabledInline = /includeCsrf:\s*false/.test(proxyContent);
  const csrfDisabled = usesPublicMarketingProfile || csrfDisabledInline;
  const readmeMentionsCsrfDisabled = [
    /CSRF cookie bootstrap is intentionally disabled/i,
    /public-marketing/i,
    /includeCsrf:\s*false/i,
  ].every((pattern) => pattern.test(readmeContent));

  const pathnameHeaderEnabled = /includeRequestPathname:\s*true/.test(
    proxyContent
  );
  const readmeMentionsPathnameRouting = [
    /includeRequestPathname/i,
    /x-helvety-pathname/i,
    /getGatewayShellLayoutProps/i,
  ].every((pattern) => pattern.test(readmeContent));

  if (csrfDisabled && !readmeMentionsCsrfDisabled) {
    throw new Error(
      'apps/web/README.md must document that CSRF cookie bootstrap is disabled when apps/web/proxy.ts uses the "public-marketing" profile or explicitly sets includeCsrf: false.'
    );
  }

  if (pathnameHeaderEnabled && !readmeMentionsPathnameRouting) {
    throw new Error(
      "apps/web/README.md must document includeRequestPathname, x-helvety-pathname, and getGatewayShellLayoutProps when apps/web/proxy.ts enables pathname routing."
    );
  }

  console.log("Web proxy/README consistency checks passed.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
