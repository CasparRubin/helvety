import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  HELVETY_COMPANY_VALUES_TAGLINE,
  HELVETY_FREE_SOURCE_FEATURE,
  HELVETY_FREE_SOURCE_INLINE,
  HELVETY_LLMS_LICENSING_NOTE,
  HELVETY_SWISS_ORIGIN_COUNTRY,
  HELVETY_SWISS_ORIGIN_SEO,
  HELVETY_MONOREPO_LLMS_GITHUB_LINE,
  HELVETY_MONOREPO_SOURCE_LICENSE_LABEL,
  HELVETY_MONOREPO_SOURCE_LICENSE_LEGAL_NAME,
  HELVETY_MONOREPO_SOURCE_LICENSE_MARKETING,
  HELVETY_MONOREPO_SOURCE_LICENSE_SPDX,
  HELVETY_WEB_DEFAULT_TITLE,
} from "./licensing";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

describe("licensing constants", () => {
  it("declares AGPL-3.0-or-later for the helvety.com monorepo", () => {
    expect(HELVETY_MONOREPO_SOURCE_LICENSE_SPDX).toBe("AGPL-3.0-or-later");
    expect(HELVETY_MONOREPO_SOURCE_LICENSE_LABEL).toBe("AGPL-3.0");
    expect(HELVETY_MONOREPO_SOURCE_LICENSE_MARKETING).toContain("AGPL-3.0");
    expect(HELVETY_MONOREPO_SOURCE_LICENSE_MARKETING).toContain("open source");
  });

  it("uses repository-agnostic source wording for shared store bullets", () => {
    expect(HELVETY_FREE_SOURCE_FEATURE).toBe(
      "Free with published source on GitHub"
    );
    expect(HELVETY_FREE_SOURCE_INLINE).toContain("published source on GitHub");
  });

  it("documents mixed Helvety licensing accurately in llms and legal helpers", () => {
    expect(HELVETY_MONOREPO_SOURCE_LICENSE_LEGAL_NAME).toContain("AGPL-3.0");
    expect(HELVETY_LLMS_LICENSING_NOTE).toContain("AGPL-3.0");
    expect(HELVETY_LLMS_LICENSING_NOTE).toContain("MIT");
    expect(HELVETY_MONOREPO_LLMS_GITHUB_LINE).toContain("AGPL-3.0");
    expect(HELVETY_MONOREPO_LLMS_GITHUB_LINE).not.toContain("\u2014");
  });

  it("exposes company values and Swiss origin for SEO copy", () => {
    expect(HELVETY_COMPANY_VALUES_TAGLINE).toBe("Private, simple, clean.");
    expect(HELVETY_SWISS_ORIGIN_SEO).toBe(
      "Engineered, designed and made in Switzerland."
    );
    expect(HELVETY_SWISS_ORIGIN_COUNTRY).toBe("Switzerland");
    expect(HELVETY_SWISS_ORIGIN_SEO).toContain(HELVETY_SWISS_ORIGIN_COUNTRY);
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
    "apps/image-editor/package.json",
    "apps/tasks/package.json",
    "apps/contacts/package.json",
    "apps/notes/package.json",
    "apps/links/package.json",
    "packages/shared/package.json",
    "packages/ui/package.json",
    "packages/config/package.json",
    "packages/brand/package.json",
    "packages/dev-deps/package.json",
    "packages/extension-chrome/package.json",
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
      "apps/image-editor/package.json",
      "apps/tasks/package.json",
      "apps/contacts/package.json",
      "apps/notes/package.json",
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
