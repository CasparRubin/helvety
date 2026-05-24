import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

describe("E2EE entity delete registry wiring", () => {
  it.each(["contacts", "tasks", "notes", "links"] as const)(
    "apps/%s uses defineEntityDeleteRegistry",
    (app) => {
      const src = readFileSync(
        join(repoRoot, "apps", app, "lib/config/entity-config.ts"),
        "utf8"
      );
      expect(src).toContain("defineEntityDeleteRegistry");
      expect(src).toContain("buildDeleteMessage");
      expect(src).not.toContain("buildEntityDeleteMessage");
    }
  );
});
