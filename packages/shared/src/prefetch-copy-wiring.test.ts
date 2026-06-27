import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  CONTACTS_PREFETCH_TOO_MANY_ROWS_ERROR,
  DASHBOARD_PREFETCH_TOO_MANY_ITEMS_ERROR,
  NOTES_PREFETCH_TOO_MANY_ROWS_ERROR,
  TASKS_PREFETCH_TOO_MANY_ROWS_ERROR,
} from "./dashboard-prefetch";

const rootDir = resolve(import.meta.dirname, "../../..");

const PREFETCH_API_ROUTES = [
  "apps/tasks/app/api/items/route.ts",
  "apps/notes/app/api/items/route.ts",
  "apps/contacts/app/api/contacts/route.ts",
  "apps/links/app/api/library/route.ts",
] as const;

const PREFETCH_BATCH_ACTIONS = [
  "apps/tasks/app/actions/batch-actions.ts",
  "apps/notes/app/actions/batch-actions.ts",
  "apps/contacts/app/actions/batch-actions.ts",
  "apps/links/app/actions/batch-actions.ts",
] as const;

describe("encrypted prefetch overflow copy wiring", () => {
  it("exports stable per-entity overflow messages", () => {
    expect(TASKS_PREFETCH_TOO_MANY_ROWS_ERROR).toBe(
      "Too many tasks to load in one request"
    );
    expect(NOTES_PREFETCH_TOO_MANY_ROWS_ERROR).toBe(
      "Too many notes to load in one request"
    );
    expect(CONTACTS_PREFETCH_TOO_MANY_ROWS_ERROR).toBe(
      "Too many contacts to load in one request"
    );
    expect(DASHBOARD_PREFETCH_TOO_MANY_ITEMS_ERROR).toBe(
      "Too many items to load in one request"
    );
  });

  it("uses shared overflow constants in encrypted list API routes", () => {
    for (const relativePath of PREFETCH_API_ROUTES) {
      const source = readFileSync(resolve(rootDir, relativePath), "utf8");
      expect(source).toContain("@helvety/shared/dashboard-prefetch");
      expect(source).not.toMatch(
        /error:\s*"Too many (?:tasks|notes|contacts|documents|items) to load in one request"/
      );
    }
  });

  it("uses shared overflow constants in encrypted list API route tests", () => {
    const routeTests = [
      "apps/tasks/app/api/items/route.test.ts",
      "apps/notes/app/api/items/route.test.ts",
      "apps/contacts/app/api/contacts/route.test.ts",
    ] as const;

    for (const relativePath of routeTests) {
      const source = readFileSync(resolve(rootDir, relativePath), "utf8");
      expect(source).toContain("@helvety/shared/dashboard-prefetch");
      expect(source).not.toMatch(
        /error:\s*"Too many (?:tasks|notes|contacts|documents|items) to load in one request"/
      );
    }
  });

  it("uses shared encrypted prefetch query helpers in list API routes", () => {
    for (const relativePath of PREFETCH_API_ROUTES) {
      const source = readFileSync(resolve(rootDir, relativePath), "utf8");
      expect(source).toContain("@helvety/shared/encrypted-prefetch-queries");
    }
  });

  it("uses shared encrypted prefetch query helpers in dashboard batch-actions", () => {
    for (const relativePath of PREFETCH_BATCH_ACTIONS) {
      const source = readFileSync(resolve(rootDir, relativePath), "utf8");
      expect(source).toContain("@helvety/shared/encrypted-prefetch-queries");
      expect(source).not.toMatch(
        /\.from\(["'](?:items|contacts|notes|link_folders|links)["']\)/
      );
    }
  });

  it("uses shared overflow constants in dashboard batch-actions", () => {
    for (const relativePath of PREFETCH_BATCH_ACTIONS) {
      const source = readFileSync(resolve(rootDir, relativePath), "utf8");
      expect(source).toContain("@helvety/shared/dashboard-prefetch");
      expect(source).not.toMatch(
        /error:\s*"Too many (?:tasks|notes|contacts|documents|items) to load in one request"/
      );
    }
  });
});
