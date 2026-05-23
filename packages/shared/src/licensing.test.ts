import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  HELVETY_COMPANY_VALUES_TAGLINE,
  HELVETY_FREE_AGPL_FEATURE,
  HELVETY_FREE_AGPL_INLINE,
  HELVETY_LLMS_LICENSING_NOTE,
  HELVETY_SWISS_ORIGIN_SEO,
  HELVETY_MONOREPO_LLMS_GITHUB_LINE,
  HELVETY_SOURCE_LICENSE_LABEL,
  HELVETY_SOURCE_LICENSE_LEGAL_NAME,
  HELVETY_SOURCE_LICENSE_MARKETING,
  HELVETY_SOURCE_LICENSE_SPDX,
  HELVETY_WEB_DEFAULT_TITLE,
} from "./licensing";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

describe("licensing constants", () => {
  it("declares AGPL-3.0-or-later as the SPDX identifier", () => {
    expect(HELVETY_SOURCE_LICENSE_SPDX).toBe("AGPL-3.0-or-later");
    expect(HELVETY_SOURCE_LICENSE_LABEL).toBe("AGPL-3.0");
    expect(HELVETY_SOURCE_LICENSE_MARKETING).toContain("AGPL-3.0");
    expect(HELVETY_SOURCE_LICENSE_MARKETING).toContain("open source");
  });

  it("uses AGPL wording for store feature bullets", () => {
    expect(HELVETY_FREE_AGPL_FEATURE).toBe(
      "Free and AGPL-3.0-licensed open source"
    );
    expect(HELVETY_FREE_AGPL_INLINE).toContain("AGPL-3.0-licensed open source");
  });

  it("documents AGPL in llms and legal naming helpers", () => {
    expect(HELVETY_SOURCE_LICENSE_LEGAL_NAME).toContain("AGPL-3.0");
    expect(HELVETY_LLMS_LICENSING_NOTE).toContain("AGPL-3.0");
    expect(HELVETY_MONOREPO_LLMS_GITHUB_LINE).toContain("AGPL-3.0");
    expect(HELVETY_MONOREPO_LLMS_GITHUB_LINE).not.toContain("\u2014");
  });

  it("exposes company values and Swiss origin for SEO copy", () => {
    expect(HELVETY_COMPANY_VALUES_TAGLINE).toBe("Private, simple, clean.");
    expect(HELVETY_SWISS_ORIGIN_SEO).toBe(
      "Engineered, designed and made in Switzerland."
    );
  });

  it("uses license-free company branding in the helvety.com gateway default title", () => {
    expect(HELVETY_WEB_DEFAULT_TITLE).toBe(
      "Helvety | Software Products - Engineered, Designed and Made in Switzerland - Private, Simple, Clean"
    );
    expect(HELVETY_WEB_DEFAULT_TITLE).not.toContain("AGPL");
  });
});

describe("workspace package manifests", () => {
  const packageJsonPaths = [
    "package.json",
    "apps/web/package.json",
    "apps/auth/package.json",
    "apps/store/package.json",
    "apps/pdf/package.json",
    "apps/image-upscaler/package.json",
    "apps/tasks/package.json",
    "apps/contacts/package.json",
    "apps/notes/package.json",
    "apps/links/package.json",
    "apps/docs/package.json",
    "packages/shared/package.json",
    "packages/ui/package.json",
    "packages/config/package.json",
    "packages/brand/package.json",
  ];

  it("declares AGPL-3.0-or-later in every workspace package.json", () => {
    for (const rel of packageJsonPaths) {
      const pkg = JSON.parse(readFileSync(join(repoRoot, rel), "utf8")) as {
        license?: string;
      };
      expect(pkg.license, rel).toBe("AGPL-3.0-or-later");
    }
  });

  it("does not mention AGPL in customer-facing app package descriptions", () => {
    const appPackages = [
      "apps/web/package.json",
      "apps/auth/package.json",
      "apps/store/package.json",
      "apps/pdf/package.json",
      "apps/image-upscaler/package.json",
      "apps/tasks/package.json",
      "apps/contacts/package.json",
      "apps/notes/package.json",
      "apps/docs/package.json",
    ];
    for (const rel of appPackages) {
      const pkg = JSON.parse(readFileSync(join(repoRoot, rel), "utf8")) as {
        description?: string;
      };
      expect(pkg.description, rel).toBeDefined();
      expect(pkg.description, rel).not.toMatch(/AGPL-3\.0/);
    }
  });
});
