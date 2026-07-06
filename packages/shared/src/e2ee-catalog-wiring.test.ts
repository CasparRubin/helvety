import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

const E2EE_APPS = ["contacts", "tasks", "notes", "links"] as const;

const CATALOG_CONFIG_FILES: Record<(typeof E2EE_APPS)[number], string> = {
  tasks: "lib/config/default-stages.ts",
  contacts: "lib/config/default-categories.ts",
  notes: "lib/config/default-note-categories.ts",
  links: "lib/url-normalize.ts",
};

describe("E2EE catalog and URL normalize wiring", () => {
  it.each(E2EE_APPS)(
    "apps/%s imports display catalogs or URL normalize from @helvety/shared",
    (app) => {
      const relativePath = CATALOG_CONFIG_FILES[app];
      const src = readFileSync(
        join(repoRoot, "apps", app, relativePath),
        "utf8"
      );
      expect(src).toMatch(
        /@helvety\/shared\/e2ee-(entity-catalogs|url-normalize)/
      );
    }
  );

  it("tasks default-labels imports from @helvety/shared/e2ee-entity-catalogs", () => {
    const src = readFileSync(
      join(repoRoot, "apps/tasks/lib/config/default-labels.ts"),
      "utf8"
    );
    expect(src).toContain("@helvety/shared/e2ee-entity-catalogs");
  });

  it("tasks priorities imports metadata from @helvety/shared/e2ee-entity-catalogs", () => {
    const src = readFileSync(
      join(repoRoot, "apps/tasks/lib/priorities.ts"),
      "utf8"
    );
    expect(src).toContain("@helvety/shared/e2ee-entity-catalogs");
    expect(src).toContain("TASK_PRIORITY_METADATA");
  });

  it("tasks default-labels re-exports DEFAULT_TASK_LABEL_ID from shared defaults", () => {
    const src = readFileSync(
      join(repoRoot, "apps/tasks/lib/config/default-labels.ts"),
      "utf8"
    );
    expect(src).toContain("@helvety/shared/e2ee-entity-defaults");
    expect(src).toContain("DEFAULT_TASK_LABEL_ID");
    expect(src).toContain("DEFAULT_ITEM_LABEL_ID = DEFAULT_TASK_LABEL_ID");
  });

  it("forbids local catalog array literals in zone default config files", () => {
    for (const app of ["tasks", "contacts", "notes"] as const) {
      const configDir = join(repoRoot, "apps", app, "lib/config");
      for (const file of [
        "default-stages.ts",
        "default-labels.ts",
        "default-categories.ts",
        "default-note-categories.ts",
      ]) {
        const fullPath = join(configDir, file);
        try {
          readFileSync(fullPath, "utf8");
        } catch {
          continue;
        }
        const src = readFileSync(fullPath, "utf8");
        expect(src).not.toMatch(/export const \w+ = \[\s*\{\s*id:/);
      }
    }
  });
});
