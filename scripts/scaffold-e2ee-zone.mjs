#!/usr/bin/env node
/**
 * Scaffold checklist for a new E2EE zone (prints paths and copy-paste stubs).
 * Usage: node scripts/scaffold-e2ee-zone.mjs <appName>
 * Example: node scripts/scaffold-e2ee-zone.mjs bookmarks
 */
const appName = process.argv[2]?.trim();
if (!appName || !/^[a-z][a-z0-9-]*$/u.test(appName)) {
  console.error("Usage: node scripts/scaffold-e2ee-zone.mjs <appName>");
  process.exit(1);
}

const title = appName
  .split("-")
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
  .join(" ");

console.log(`# E2EE zone scaffold: ${appName}
Copy from apps/contacts and adapt:

- apps/${appName}/next.config.ts → createE2eeZoneNextConfig({ appName: "${appName}" })
- apps/${appName}/lib/env.ts → createAppServerUpstashEnv({ appName: "${appName}", envTemplatePath: "apps/${appName}/env.template" })
- apps/${appName}/components/navbar.tsx → createE2eeAppNavbar({ currentApp: "${title}", titleText: "${title}", ... })
- apps/${appName}/app/layout.tsx → <E2eeAppRootLayout encryptionProvider={EncryptionProvider} />
- apps/${appName}/app/loading.tsx → export E2eeShellRouteLoading
- apps/${appName}/proxy.ts → e2ee-app profile + failClosedOnAuthRefresh
- apps/${appName}/lib/crypto/index.ts → re-export EncryptionProvider

See docs/app-consistency-checklist.md for required tests and env.template.
`);
