import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

/** Reads a legal page module from the web app for static copy assertions. */
function readLegalPage(rel: string): string {
  return readFileSync(join(repoRoot, rel), "utf8");
}

describe("web legal pages source license copy", () => {
  const terms = () => readLegalPage("apps/web/app/terms/page.tsx");
  const impressum = () => readLegalPage("apps/web/app/impressum/page.tsx");
  const privacy = () => readLegalPage("apps/web/app/privacy/page.tsx");

  it("terms describe AGPL-3.0 for all Helvety public repositories", () => {
    const text = terms();
    expect(text).toContain("AGPL-3.0");
    expect(text).toContain("browser extensions");
    expect(text).not.toContain("MIT License");
    expect(text).not.toContain("unless a repository");
  });

  it("impressum describes AGPL-3.0 for products inside and outside the monorepo", () => {
    const text = impressum();
    expect(text).toContain("AGPL-3.0");
    expect(text).toMatch(/browser extensions/i);
    expect(text).not.toContain("MIT License");
    expect(text).not.toContain("unless the repository LICENSE");
    expect(text).not.toContain("applicable open-source license");
  });

  it("privacy avoids MIT legacy license wording", () => {
    const text = privacy();
    expect(text).not.toContain("MIT License");
    expect(text).not.toContain("unless the repository LICENSE");
    expect(text).not.toContain("applicable open-source license");
  });
});
