import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const proxyPath = resolve("packages/shared/src/proxy.ts");
const proxySource = readFileSync(proxyPath, "utf8");

const forbiddenSnippets = [
  "@supabase/ssr",
  "createServerClient(",
  "getSupabaseUrl(",
  "getSupabaseKey(",
];

const violations = forbiddenSnippets.filter((snippet) =>
  proxySource.includes(snippet)
);

if (violations.length > 0) {
  console.error("❌ Proxy policy guard failed.");
  console.error(
    "packages/shared/src/proxy.ts must remain optimistic-only and must not perform Supabase token refresh work."
  );
  console.error("Found forbidden patterns:");
  for (const snippet of violations) {
    console.error(`  - ${snippet}`);
  }
  process.exit(1);
}

if (!proxySource.includes("createSecurityProxy")) {
  console.error("❌ Proxy policy guard failed.");
  console.error(
    "Expected createSecurityProxy export to exist in packages/shared/src/proxy.ts."
  );
  process.exit(1);
}

console.log("✅ Proxy policy guard passed.");
