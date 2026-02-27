import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const databaseTypesPath = resolve(
  process.cwd(),
  "packages/shared/src/types/database.types.ts"
);
const content = readFileSync(databaseTypesPath, "utf8");

if (content.includes("export interface Database {}")) {
  console.error(
    "Supabase types are not generated. Run: bun run db:gen-types and commit updated database types."
  );
  process.exit(1);
}

console.log("Supabase generated types guard passed.");
