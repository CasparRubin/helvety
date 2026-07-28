/**
 * Web-only: keeps apps/web/proxy.ts aligned with apps/web/README.md (not other zones).
 */
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
  if (!usesPublicMarketingProfile) {
    throw new Error(
      'apps/web/proxy.ts must use createProfiledSecurityProxy("public-marketing").'
    );
  }

  if (!/public-marketing/i.test(readmeContent)) {
    throw new Error(
      'apps/web/README.md must document the "public-marketing" security proxy profile.'
    );
  }

  if (/includeCsrf/i.test(proxyContent)) {
    throw new Error(
      "apps/web/proxy.ts must not reference includeCsrf (cookie signing was removed from zone proxies)."
    );
  }

  console.log("Web proxy/README consistency checks passed.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
